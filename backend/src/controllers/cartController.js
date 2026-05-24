import cartService from "../services/cartService.js";

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const response = await cartService.getCart(userId);
    return res.status(response.status || 200).json(response);
  } catch (error) {
    console.error("Lỗi lấy giỏ hàng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy giỏ hàng" });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity = 1, size = null, color = null, type = null } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: "Thiếu product_id" });
    }

    const response = await cartService.addToCart(userId, product_id, quantity, size, color, type);
    return res.status(response.status || 200).json(response);
  } catch (error) {
    console.error("Lỗi thêm giỏ hàng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi thêm vào giỏ hàng" });
  }
};

const updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, field_key, quantity } = req.body;

    if ((!product_id && !field_key) || quantity === undefined) {
      return res.status(400).json({ message: "Thiếu product_id hoặc field_key hoặc quantity" });
    }

    const response = await cartService.updateCartItem(userId, field_key || product_id, quantity);
    return res.status(response.status || 200).json(response);
  } catch (error) {
    console.error("Lỗi cập nhật giỏ hàng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật giỏ hàng" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Thiếu productId" });
    }

    const response = await cartService.removeFromCart(userId, productId);
    return res.status(response.status || 200).json(response);
  } catch (error) {
    console.error("Lỗi xóa giỏ hàng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xóa sản phẩm khỏi giỏ hàng" });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const response = await cartService.clearCart(userId);
    return res.status(response.status || 200).json(response);
  } catch (error) {
    console.error("Lỗi làm trống giỏ hàng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi làm trống giỏ hàng" });
  }
};

const syncCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items = [] } = req.body;

    const response = await cartService.syncCart(userId, items);
    return res.status(response.status || 200).json(response);
  } catch (error) {
    console.error("Lỗi đồng bộ giỏ hàng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đồng bộ giỏ hàng" });
  }
};

const removeMultipleFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fieldKeys } = req.body;

    if (!fieldKeys || !Array.isArray(fieldKeys) || fieldKeys.length === 0) {
      return res.status(400).json({ message: "Thiếu danh sách sản phẩm cần xóa" });
    }

    const response = await cartService.removeMultipleFromCart(userId, fieldKeys);
    return res.status(response.status || 200).json(response);
  } catch (error) {
    console.error("Lỗi xóa nhiều sản phẩm khỏi giỏ hàng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xóa các sản phẩm khỏi giỏ hàng" });
  }
};

export default {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
  syncCart,
  removeMultipleFromCart,
};
