import bcrypt from "bcryptjs";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import db from "../models/index.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { email, phone, password, role_id } = data;

      // Check if user already exists
      const existingUser = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: [{ email }, { phone }],
        },
      });

      if (existingUser) {
        return resolve({
          status: 400,
          message: "Email or phone already exists",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await db.User.create({
        email,
        phone,
        password: hashedPassword,
        role_id: role_id || 2, // Default to user role
        status: "ACTIVE",
      });

      // Create profile
      await db.UserProfile.create({
        user_id: user.id,
      });

      resolve({
        status: 201,
        message: "User registered successfully",
        data: {
          id: user.id,
          email: user.email,
          phone: user.phone,
        },
      });
    } catch (error) {
      reject(error);
    }
  });
};

const login = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { email_or_phone, password } = data;

      // Find user by email or phone
      const user = await db.User.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            { email: email_or_phone },
            { phone: email_or_phone },
          ],
        },
        include: [
          {
            model: db.Role,
            as: "role",
          },
        ],
      });

      if (!user) {
        return resolve({
          status: 401,
          message: "User not found",
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return resolve({
          status: 401,
          message: "Wrong password",
        });
      }

      // Check user status
      if (user.status !== "ACTIVE") {
        return resolve({
          status: 403,
          message: "Account is not active",
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role_id: user.role_id,
      });

      const refreshToken = generateRefreshToken({
        id: user.id,
      });

      // Save refresh token to database
      const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute
      await db.RefreshToken.create({
        user_id: user.id,
        token: refreshToken,
        expires_at: expiresAt,
        is_revoked: false,
      });
      let redirectUrl = "/";
      if (user.role_id === 1 || user.role?.role_name === "admin") {
        redirectUrl = "/admin";
      }
      resolve({
        status: 200,
        message: "Login success",
        data: {
          accessToken,
          refreshToken,
          redirectUrl,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role?.role_name,
          },
        },
      });
    } catch (error) {
      reject(error);
    }
  });
};

const refreshToken = (token) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Find refresh token in database
      const refreshTokenRecord = await db.RefreshToken.findOne({
        where: {
          token: token,
          is_revoked: false,
          expires_at: {
            [db.Sequelize.Op.gt]: new Date(),
          },
        },
      });

      if (!refreshTokenRecord) {
        return resolve({
          status: 403,
          message: "Invalid or expired refresh token",
        });
      }

      // Revoke old token
      await refreshTokenRecord.update({ is_revoked: true });

      // Get user
      const user = await db.User.findByPk(refreshTokenRecord.user_id);

      if (!user) {
        return resolve({
          status: 404,
          message: "User not found",
        });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role_id: user.role_id,
      });

      const newRefreshToken = generateRefreshToken({
        id: user.id,
      });

      // Save new refresh token
      const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute
      await db.RefreshToken.create({
        user_id: user.id,
        token: newRefreshToken,
        expires_at: expiresAt,
        is_revoked: false,
      });

      resolve({
        status: 200,
        message: "Token refreshed",
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      reject(error);
    }
  });
};

const googleLogin = (accessTokenFromGoogle) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Dùng accessToken truy vấn Google lấy User Info
      const { data: payload } = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${accessTokenFromGoogle}` },
        }
      );

      const { email, sub, given_name, family_name, picture } = payload;

      let user = await db.User.findOne({
        where: { email },
        include: [
          {
            model: db.Role,
            as: "role",
          },
        ],
      });

      if (user) {
        // Sync provider if user is local or doesn't have provider
        if (!user.auth_provider || user.auth_provider === "local") {
          await user.update({
            auth_provider: "google",
            auth_provider_id: sub,
          });
        }

        // Cập nhật avatar nếu chưa có
        const profile = await db.UserProfile.findOne({
          where: { user_id: user.id },
        });
        if (profile && !profile.avatar_url) {
          await profile.update({ avatar_url: picture });
        }
      } else {
        // Create new user
        user = await db.User.create({
          email,
          auth_provider: "google",
          auth_provider_id: sub,
          status: "ACTIVE",
          role_id: 2, // Default user role
        });

        await db.UserProfile.create({
          user_id: user.id,
          first_name: given_name,
          last_name: family_name,
          avatar_url: picture,
        });

        // reload user with role
        user = await db.User.findByPk(user.id, {
          include: [
            {
              model: db.Role,
              as: "role",
            },
          ],
        });
      }

      if (user.status !== "ACTIVE") {
        return resolve({
          status: 403,
          message: "Account is not active",
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role_id: user.role_id,
      });

      const refreshToken = generateRefreshToken({
        id: user.id,
      });

      // Save refresh token to database
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await db.RefreshToken.create({
        user_id: user.id,
        token: refreshToken,
        expires_at: expiresAt,
        is_revoked: false,
      });

      let redirectUrl = "/";
      if (user.role_id === 1 || user.role?.role_name === "admin") {
        redirectUrl = "/admin";
      }

      resolve({
        status: 200,
        message: "Google login success",
        data: {
          accessToken,
          refreshToken,
          redirectUrl,
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone || "",
            role: user.role?.role_name,
          },
        },
      });
    } catch (error) {
      console.error("Google Login Error:", error);
      reject(error);
    }
  });
};

export default {
  register,
  login,
  refreshToken,
  googleLogin,
};
