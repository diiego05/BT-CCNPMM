import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectDB } from "./config/DBConfig.js";
import "dotenv/config";
import userRouter from "./route/userRoute.js";
import authRouter from "./route/authRoute.js";
import forgotPasswordRoute from "./route/forgotPasswordRoute.js";

let app = express();

app.use(cors({ origin: true, credentials: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/auth/forgot-password", forgotPasswordRoute);

connectDB();

let port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("Backend nodejs is running on the port: " + port);
});
