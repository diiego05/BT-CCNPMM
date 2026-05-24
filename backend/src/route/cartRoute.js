import express from "express";
import cartController from "../controllers/cartController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Tất cả các route giỏ hàng đều yêu cầu xác thực người dùng
router.use(verifyToken);

// Lấy danh sách sản phẩm trong giỏ hàng
router.get("/", cartController.getCart);

// Thêm sản phẩm vào giỏ hàng
router.post("/", cartController.addToCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put("/", cartController.updateCart);

// Xóa sản phẩm khỏi giỏ hàng
router.delete("/:productId", cartController.removeFromCart);

// Làm trống toàn bộ giỏ hàng
router.delete("/", cartController.clearCart);

// Xóa nhiều sản phẩm khỏi giỏ hàng
router.post("/delete-multiple", cartController.removeMultipleFromCart);

// Đồng bộ giỏ hàng từ localStorage Guest lên Redis
router.post("/sync", cartController.syncCart);

export default router;
