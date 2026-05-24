import express from "express";
import orderController from "../controllers/orderController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Tất cả các route đơn hàng đều yêu cầu xác thực người dùng
router.use(verifyToken);

// Tạo đơn hàng mới (Thanh toán COD)
router.post("/checkout", orderController.createOrder);

// Lấy lịch sử mua hàng của người dùng
router.get("/history", orderController.getOrderHistory);

// Lấy chi tiết một đơn hàng cụ thể
router.get("/:id", orderController.getOrderDetails);

// Hủy đơn hàng hoặc gửi yêu cầu hủy đơn hàng (Quy tắc 30 phút)
router.post("/:id/cancel", orderController.cancelOrder);

export default router;
