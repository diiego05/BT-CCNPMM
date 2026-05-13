import express from "express";
import rateLimit from "express-rate-limit";
import userController from "../controllers/userController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

const editLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 30,
  message: "Too many attempts, please try again later",
});

const editProfileRules = (req, res, next) => {
  const { first_name, last_name, id_card } = req.body;
  
  if (first_name && first_name.length > 100) {
    return res.status(400).json({ message: "First name must not exceed 100 characters" });
  }
  if (last_name && last_name.length > 100) {
    return res.status(400).json({ message: "Last name must not exceed 100 characters" });
  }
  if (id_card && !/^\d{9,12}$/.test(id_card)) {
    return res.status(400).json({ message: "ID card must be 9-12 digits" });
  }
  
  next();
};

router.get("/profile", verifyToken, userController.getUserProfile);
router.put("/edit-profile", verifyToken, editLimiter, editProfileRules, userController.updateUserProfile);

export default router;
