import express from "express";
const router = express.Router();
import rateLimit from "express-rate-limit";
import authController from "../controllers/authController.js";

const authLimiter = rateLimit({
  windowMs: 1000 * 60 * 5,
  max: 6,
  message: "Too many attempts, please try again after 5 minutes",
});

router.post("/register", authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/refresh", authController.refresh);

export default router;
