import db from "../models/index.js";
import redisClient from "../config/redisConfig.js";
import cartService from "./cartService.js";

/**
 * Tạo đơn hàng mới từ giỏ hàng Redis và lưu vào MySQL
 */
const createOrder = async (userId, shippingData) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { fullName, phone, address, note, couponCode, selectedKeys } = shippingData;

    if (!fullName || !phone || !address) {
      return { status: 400, message: "Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng" };
    }

    // Lấy giỏ hàng của người dùng từ Redis/Fallback
    const cartResult = await cartService.getCart(userId);
    const cartData = cartResult.data;

    if (!cartData || !cartData.items || cartData.items.length === 0) {
      await transaction.rollback();
      return { status: 400, message: "Giỏ hàng của bạn đang trống, không thể thanh toán" };
    }

    let itemsToProcess = cartData.items;
    if (selectedKeys && Array.isArray(selectedKeys)) {
      itemsToProcess = cartData.items.filter(item => selectedKeys.includes(item.field_key));
    }

    if (itemsToProcess.length === 0) {
      await transaction.rollback();
      return { status: 400, message: "Vui lòng chọn ít nhất một sản phẩm để thanh toán" };
    }

    let subtotal = 0;
    const itemsToCreate = [];

    // Kiểm tra tồn kho của từng sản phẩm trong MySQL
    for (const item of itemsToProcess) {
      const product = await db.Product.findByPk(item.product_id, { transaction });
      if (!product) {
        await transaction.rollback();
        return { status: 404, message: `Sản phẩm "${item.name}" không tồn tại` };
      }

      if (product.status !== "ACTIVE") {
        await transaction.rollback();
        return { status: 400, message: `Sản phẩm "${item.name}" hiện đang ngừng bán` };
      }

      // Kiểm tra tồn kho cụ thể của biến thể
      let maxStock = product.stock;
      let variantInstance = null;
      if (item.size || item.color || item.type) {
        variantInstance = await db.ProductVariant.findOne({
          where: {
            product_id: item.product_id,
            ...(item.size ? { size: item.size } : {}),
            ...(item.color ? { color: item.color } : {}),
            ...(item.type ? { type: item.type } : {}),
          },
          transaction
        });
        if (variantInstance) {
          maxStock = variantInstance.stock;
        }
      }

      if (maxStock < item.quantity) {
        await transaction.rollback();
        return {
          status: 400,
          message: `Biến thể sản phẩm "${item.name}" (${[item.size, item.color, item.type].filter(Boolean).join(" - ")}) không đủ số lượng trong kho. Kho chỉ còn ${maxStock} sản phẩm.`,
        };
      }

      const itemSubtotal = Number(product.price) * item.quantity;
      subtotal += itemSubtotal;

      itemsToCreate.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price,
        size: item.size || null,
        color: item.color || null,
        type: item.type || null,
        product, // Giữ lại instance để update kho sau
        variantInstance, // Giữ lại variant instance để update kho
      });
    }

    // Tính toán giảm giá và phí ship đồng bộ với Frontend
    let discount = 0;
    const code = couponCode ? couponCode.trim().toUpperCase() : "";
    if (code === "UTESHOP") {
      discount = subtotal * 0.2; // Giảm 20%
    }

    const shippingCost = (subtotal - discount > 500000 || code === "FREESHIP") ? 0 : 30000;
    const finalTotal = subtotal - discount + shippingCost;

    // 1. Tạo đơn hàng mới (Trạng thái 1: Đơn hàng mới)
    const order = await db.Order.create(
      {
        user_id: userId,
        full_name: fullName,
        phone: phone,
        address: address,
        note: note || null,
        total_price: finalTotal,
        payment_method: "COD",
        status: 1, // 1. Đơn hàng mới
      },
      { transaction }
    );

    // 2. Tạo các chi tiết đơn hàng và khấu trừ tồn kho
    for (const item of itemsToCreate) {
      await db.OrderItem.create(
        {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color,
          type: item.type,
        },
        { transaction }
      );

      // Trừ tồn kho chính và tăng số lượng đã bán
      const product = item.product;
      product.stock = Math.max(0, product.stock - item.quantity);
      product.sold += item.quantity;
      await product.save({ transaction });

      // Trừ tồn kho biến thể nếu có
      if (item.variantInstance) {
        item.variantInstance.stock = Math.max(0, item.variantInstance.stock - item.quantity);
        await item.variantInstance.save({ transaction });
      }
    }

    await transaction.commit();

    // 3. Làm trống các sản phẩm đã thanh toán trên Redis
    const redisKey = `cart:${userId}`;
    if (selectedKeys && Array.isArray(selectedKeys)) {
      for (const fieldKey of selectedKeys) {
        await redisClient.hDel(redisKey, String(fieldKey));
      }
    } else {
      await redisClient.del(redisKey);
    }

    return {
      status: 200,
      message: "Đặt đơn hàng thành công!",
      data: order,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Xem lịch sử mua hàng của người dùng
 */
const getOrderHistory = async (userId) => {
  try {
    const orders = await db.Order.findAll({
      where: { user_id: userId },
      include: [
        {
          model: db.OrderItem,
          as: "items",
          include: [
            {
              model: db.Product,
              as: "product",
              include: [
                {
                  model: db.ProductImage,
                  as: "images",
                  where: { is_primary: true },
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return {
      status: 200,
      data: orders,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Xem chi tiết đơn hàng cụ thể
 */
const getOrderDetails = async (userId, orderId) => {
  try {
    const order = await db.Order.findOne({
      where: { id: orderId, user_id: userId },
      include: [
        {
          model: db.OrderItem,
          as: "items",
          include: [
            {
              model: db.Product,
              as: "product",
              include: [
                {
                  model: db.ProductImage,
                  as: "images",
                  where: { is_primary: true },
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    if (!order) {
      return { status: 404, message: "Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này" };
    }

    return {
      status: 200,
      data: order,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Hủy đơn hàng kèm theo các quy tắc xử lý thời gian và hoàn trả kho
 */
const cancelOrder = async (userId, orderId) => {
  const transaction = await db.sequelize.transaction();
  try {
    const order = await db.Order.findOne({
      where: { id: orderId, user_id: userId },
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      return { status: 404, message: "Đơn hàng không tồn tại" };
    }

    // Kiểm tra trạng thái hiện tại
    if (order.status === 6) {
      await transaction.rollback();
      return { status: 400, message: "Đơn hàng này đã được hủy trước đó" };
    }

    if (order.status === 5) {
      await transaction.rollback();
      return { status: 400, message: "Không thể hủy đơn hàng đã giao thành công" };
    }

    if (order.status === 4) {
      await transaction.rollback();
      return { status: 400, message: "Đơn hàng đang trên đường giao, không thể hủy" };
    }

    if (order.status === 7) {
      await transaction.rollback();
      return { status: 400, message: "Đơn hàng này đã gửi yêu cầu hủy và đang chờ shop duyệt" };
    }

    // Kiểm tra quy tắc thời gian: chỉ cho phép hủy trước 30 phút sau khi đặt đơn
    const createdAtTime = new Date(order.created_at).getTime();
    const currentTime = new Date().getTime();
    const diffMinutes = (currentTime - createdAtTime) / (1000 * 60);

    if (diffMinutes > 30) {
      await transaction.rollback();
      return {
        status: 400,
        message: "Không thể hủy đơn hàng vì đã vượt quá 30 phút kể từ lúc đặt hàng. Vui lòng liên hệ Hotline shop để được hỗ trợ.",
      };
    }

    // Xử lý các trạng thái hủy
    if (order.status === 1 || order.status === 2) {
      // 1. Đơn hàng mới hoặc 2. Đã xác nhận -> Cho phép hủy trực tiếp
      order.status = 6; // Chuyển sang 6. Hủy đơn hàng
      await order.save({ transaction });

      // Hoàn trả lại số lượng tồn kho sản phẩm và trừ đi lượng đã bán
      const orderItems = await db.OrderItem.findAll({
        where: { order_id: orderId },
        transaction,
      });

      for (const item of orderItems) {
        const product = await db.Product.findByPk(item.product_id, { transaction });
        if (product) {
          product.stock += item.quantity;
          product.sold = Math.max(0, product.sold - item.quantity);
          await product.save({ transaction });
        }

        // Hoàn trả tồn kho cho variant
        if (item.size || item.color || item.type) {
          const variant = await db.ProductVariant.findOne({
            where: {
              product_id: item.product_id,
              ...(item.size ? { size: item.size } : {}),
              ...(item.color ? { color: item.color } : {}),
              ...(item.type ? { type: item.type } : {}),
            },
            transaction
          });
          if (variant) {
            variant.stock += item.quantity;
            await variant.save({ transaction });
          }
        }
      }

      await transaction.commit();
      return {
        status: 200,
        message: "Đơn hàng đã được hủy trực tiếp thành công! Sản phẩm đã được hoàn trả lại kho hàng.",
        data: order,
      };
    } else if (order.status === 3) {
      // 3. Shop đang chuẩn bị hàng -> Chuyển sang 7. Gửi Yêu cầu hủy đơn cho shop
      order.status = 7; // Trạng thái 7: Yêu cầu hủy đơn hàng
      await order.save({ transaction });

      await transaction.commit();
      return {
        status: 200,
        message: "Đã gửi Yêu cầu hủy đơn hàng đến shop thành công! Vui lòng đợi shop phê duyệt.",
        data: order,
      };
    }

    await transaction.rollback();
    return { status: 400, message: "Không thể xử lý yêu cầu hủy ở trạng thái hiện tại" };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export default {
  createOrder,
  getOrderHistory,
  getOrderDetails,
  cancelOrder,
};
