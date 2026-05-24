import orderService from "../services/orderService.js";

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const shippingData = req.body;

    const result = await orderService.createOrder(userId, shippingData);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error in createOrder controller:", error);
    return res.status(500).json({
      status: 500,
      message: "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại sau.",
      error: error.message,
    });
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await orderService.getOrderHistory(userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error in getOrderHistory controller:", error);
    return res.status(500).json({
      status: 500,
      message: "Có lỗi xảy ra khi lấy lịch sử đơn hàng. Vui lòng thử lại sau.",
      error: error.message,
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const result = await orderService.getOrderDetails(userId, orderId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error in getOrderDetails controller:", error);
    return res.status(500).json({
      status: 500,
      message: "Có lỗi xảy ra khi lấy chi tiết đơn hàng. Vui lòng thử lại sau.",
      error: error.message,
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const result = await orderService.cancelOrder(userId, orderId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error in cancelOrder controller:", error);
    return res.status(500).json({
      status: 500,
      message: "Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại sau.",
      error: error.message,
    });
  }
};

export default {
  createOrder,
  getOrderHistory,
  getOrderDetails,
  cancelOrder,
};
