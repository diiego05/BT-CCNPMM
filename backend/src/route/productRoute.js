import express from "express";
const router = express.Router();
import productController from "../controllers/productController.js";

// Lấy danh sách sản phẩm (có tìm kiếm, lọc)
router.get("/", productController.getProducts);

// Lấy chi tiết sản phẩm theo slug
router.get("/:slug", productController.getProductDetail);

export default router;
