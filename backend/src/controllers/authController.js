import authService from "../services/authService.js";

//REGISTER
const register = async (req, res) => {
  try {
    const { email, phone, password, role_id } = req.body;

    if (!email || !phone || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const response = await authService.register({
      email,
      phone,
      password,
      role_id,
    });

    return res.status(response.status).json(response);
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      message: "Internal server error: " + error.message,
      stack: error.stack,
    });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email_or_phone, password } = req.body;

    if (!email_or_phone || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const response = await authService.login({
      email_or_phone,
      password,
    });

    if (response.status !== 200) {
      const maxAttempts = req.rateLimit?.limit || 6;
      const currentAttempts = req.rateLimit?.current || 1;
      
      let vietnameseMessage = response.message;
      if (response.message === "User not found") vietnameseMessage = "Không tìm thấy người dùng";
      if (response.message === "Wrong password") vietnameseMessage = "Sai mật khẩu";

      response.message = `${vietnameseMessage}. Bạn đã nhập sai ${currentAttempts}/${maxAttempts} lần. Quá ${maxAttempts} lần sẽ bị khóa đăng nhập 5 phút.`;
    }

    return res.status(response.status).json(response);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// REFRESH TOKEN
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const response = await authService.refreshToken(refreshToken);

    return res.status(response.status).json(response);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GOOGLE LOGIN
const googleLogin = async (req, res) => {
  try {
    const { googleAccessToken } = req.body;

    if (!googleAccessToken) {
      return res.status(400).json({ message: "Missing Google Access Token" });
    }

    const response = await authService.googleLogin(googleAccessToken);
    return res.status(response.status).json(response);
  } catch (error) {
    console.error("Google Login Controller Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  register,
  login,
  refresh,
  googleLogin,
};
