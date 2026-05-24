import db from "../models/index.js";
import redisClient from "../config/redisConfig.js";

/**
 * Lấy danh sách sản phẩm trong giỏ hàng từ Redis và truy vấn thông tin chi tiết từ MySQL
 */
const getCart = async (userId) => {
  try {
    const redisKey = `cart:${userId}`;
    const cartData = await redisClient.hGetAll(redisKey); // Trả về object { [fieldKey]: quantity }
    
    const items = [];
    let totalPrice = 0;
    let totalItems = 0;

    const productIds = Object.keys(cartData).map(key => key.split("_")[0]);
    if (productIds.length > 0) {
      // Tìm thông tin tất cả sản phẩm có trong giỏ hàng
      const products = await db.Product.findAll({
        where: {
          id: productIds,
        },
        include: [
          {
            model: db.ProductImage,
            as: "images",
            where: { is_primary: true },
            required: false,
          },
          {
            model: db.Category,
            as: "category",
          },
        ],
      });

      // Tạo map để tra cứu thông tin sản phẩm nhanh hơn
      const productMap = new Map();
      products.forEach((p) => productMap.set(String(p.id), p));

      // Duyệt qua danh sách trong Redis để ghép thông tin
      for (const [fieldKey, qtyStr] of Object.entries(cartData)) {
        let productId = fieldKey;
        let size = null;
        let color = null;
        let type = null;

        if (fieldKey.includes("_")) {
          const parts = fieldKey.split("_");
          productId = parts[0];
          size = parts[1] || null;
          color = parts[2] || null;
          type = parts[3] || null;
        }

        const product = productMap.get(productId);
        if (product) {
          const quantity = parseInt(qtyStr) || 1;
          const subtotal = Number(product.price) * quantity;
          
          items.push({
            product_id: product.id,
            field_key: fieldKey,
            name: product.name,
            slug: product.slug,
            price: product.price,
            original_price: product.original_price,
            image: product.images && product.images.length > 0 ? product.images[0].image_url : null,
            category: product.category ? product.category.name : null,
            stock: product.stock,
            quantity: quantity,
            subtotal: subtotal,
            size,
            color,
            type
          });

          totalPrice += subtotal;
          totalItems += quantity;
        } else {
          // Sản phẩm không tồn tại trong DB nữa -> Tự động xóa khỏi Redis
          await redisClient.hDel(redisKey, fieldKey);
        }
      }
    }

    return {
      status: 200,
      data: {
        items,
        total_price: totalPrice,
        total_items: totalItems,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Thêm sản phẩm vào giỏ hàng trên Redis (Cộng dồn số lượng nếu đã có)
 */
const addToCart = async (userId, productId, quantity, size = null, color = null, type = null) => {
  try {
    const qtyToAdd = parseInt(quantity);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      return { status: 400, message: "Số lượng sản phẩm không hợp lệ" };
    }

    // Tìm sản phẩm trong DB để kiểm tra tồn kho
    const product = await db.Product.findByPk(productId);
    if (!product) {
      return { status: 404, message: "Sản phẩm không tồn tại" };
    }

    if (product.status !== "ACTIVE") {
      return { status: 400, message: "Sản phẩm này tạm thời ngừng bán" };
    }

    // Tạo key ghép cho biến thể
    const fieldKey = [productId, size || "", color || "", type || ""].join("_");

    const redisKey = `cart:${userId}`;
    // Lấy số lượng hiện tại
    const currentQtyStr = await redisClient.hGet(redisKey, fieldKey);
    const currentQty = currentQtyStr ? parseInt(currentQtyStr) : 0;
    const newQty = currentQty + qtyToAdd;

    // Kiểm tra tồn kho cụ thể của biến thể
    let maxStock = product.stock;
    if (size || color || type) {
      const variant = await db.ProductVariant.findOne({
        where: {
          product_id: productId,
          ...(size ? { size } : {}),
          ...(color ? { color } : {}),
          ...(type ? { type } : {}),
        }
      });
      if (variant) {
        maxStock = variant.stock;
      }
    }

    if (newQty > maxStock) {
      return {
        status: 400,
        message: `Số lượng vượt quá tồn kho của biến thể này. Kho chỉ còn ${maxStock} sản phẩm. Giỏ hàng của bạn đang có ${currentQty}.`,
      };
    }

    // Lưu lại lên Redis
    await redisClient.hSet(redisKey, fieldKey, String(newQty));

    return await getCart(userId);
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật số lượng sản phẩm trực tiếp trong giỏ hàng Redis
 */
const updateCartItem = async (userId, fieldKey, quantity) => {
  try {
    const newQty = parseInt(quantity);
    if (isNaN(newQty) || newQty <= 0) {
      // Số lượng <= 0 thì coi như xóa sản phẩm
      return await removeFromCart(userId, fieldKey);
    }

    let productId = fieldKey;
    let size = null;
    let color = null;
    let type = null;

    if (fieldKey.includes("_")) {
      const parts = fieldKey.split("_");
      productId = parts[0];
      size = parts[1] || null;
      color = parts[2] || null;
      type = parts[3] || null;
    }

    // Tìm sản phẩm trong DB để kiểm tra tồn kho
    const product = await db.Product.findByPk(productId);
    if (!product) {
      return { status: 404, message: "Sản phẩm không tồn tại" };
    }

    let maxStock = product.stock;
    if (size || color || type) {
      const variant = await db.ProductVariant.findOne({
        where: {
          product_id: productId,
          ...(size ? { size } : {}),
          ...(color ? { color } : {}),
          ...(type ? { type } : {}),
        }
      });
      if (variant) {
        maxStock = variant.stock;
      }
    }

    if (newQty > maxStock) {
      return {
        status: 400,
        message: `Số lượng vượt quá tồn kho. Kho chỉ còn ${maxStock} sản phẩm.`,
      };
    }

    const redisKey = `cart:${userId}`;
    await redisClient.hSet(redisKey, fieldKey, String(newQty));

    return await getCart(userId);
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa một sản phẩm khỏi giỏ hàng Redis
 */
const removeFromCart = async (userId, fieldKey) => {
  try {
    const redisKey = `cart:${userId}`;
    await redisClient.hDel(redisKey, String(fieldKey));
    return await getCart(userId);
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa sạch toàn bộ giỏ hàng trên Redis
 */
const clearCart = async (userId) => {
  try {
    const redisKey = `cart:${userId}`;
    await redisClient.del(redisKey);
    return {
      status: 200,
      message: "Làm trống giỏ hàng thành công",
      data: {
        items: [],
        total_price: 0,
        total_items: 0,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Đồng bộ giỏ hàng từ Guest (localStorage) lên Redis khi đăng nhập
 * guestItems: [{ product_id, quantity, size, color, type }]
 */
const syncCart = async (userId, guestItems) => {
  try {
    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      return await getCart(userId);
    }

    const redisKey = `cart:${userId}`;

    // Lấy thông tin các sản phẩm tương ứng từ MySQL
    const productIds = guestItems.map((item) => item.product_id);
    const products = await db.Product.findAll({
      where: { id: productIds },
    });

    const productMap = new Map();
    products.forEach((p) => productMap.set(String(p.id), p));

    for (const item of guestItems) {
      const pId = String(item.product_id);
      const qtyToAdd = parseInt(item.quantity) || 1;
      const size = item.size || null;
      const color = item.color || null;
      const type = item.type || null;
      
      const product = productMap.get(pId);
      if (product && product.status === "ACTIVE") {
        const fieldKey = [pId, size || "", color || "", type || ""].join("_");

        const currentQtyStr = await redisClient.hGet(redisKey, fieldKey);
        const currentQty = currentQtyStr ? parseInt(currentQtyStr) : 0;
        let finalQty = currentQty + qtyToAdd;

        // Kiểm tra tồn kho của biến thể
        let maxStock = product.stock;
        if (size || color || type) {
          const variant = await db.ProductVariant.findOne({
            where: {
              product_id: pId,
              ...(size ? { size } : {}),
              ...(color ? { color } : {}),
              ...(type ? { type } : {}),
            }
          });
          if (variant) {
            maxStock = variant.stock;
          }
        }

        // Giới hạn theo tồn kho
        if (finalQty > maxStock) {
          finalQty = maxStock;
        }

        if (finalQty > 0) {
          await redisClient.hSet(redisKey, fieldKey, String(finalQty));
        }
      }
    }

    return await getCart(userId);
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa nhiều sản phẩm khỏi giỏ hàng Redis
 */
const removeMultipleFromCart = async (userId, fieldKeys) => {
  try {
    const redisKey = `cart:${userId}`;
    await redisClient.hDel(redisKey, fieldKeys.map(String));
    return await getCart(userId);
  } catch (error) {
    throw error;
  }
};

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart,
  removeMultipleFromCart,
};
