import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./config/DBConfig.js";
import "dotenv/config";
import userRouter from "./route/userRoute.js";
import authRouter from "./route/authRoute.js";
import forgotPasswordRoute from "./route/forgotPasswordRoute.js";
import productRoute from "./route/productRoute.js";
import cartRouter from "./route/cartRoute.js";
import orderRouter from "./route/orderRoute.js";
import redisClient from "./config/redisConfig.js";
import db from "./models/index.js";

let app = express();

app.use(cors({ origin: true, credentials: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/auth/forgot-password", forgotPasswordRoute);
app.use("/products", productRoute);
app.use("/cart", cartRouter);
app.use("/order", orderRouter);

connectDB();
db.sequelize.sync({ alter: true }).then(() => {
  console.log("🚀 Database tables synchronized successfully.");
}).catch((err) => {
  console.error("⚠️ Failed to sync database tables:", err.message);
});
redisClient.connect();

let port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("Backend nodejs is running on the port: " + port);
});
