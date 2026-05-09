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
    return res.status(500).json({ message: "Internal server error" });
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



export default {
  register,
  login,
  refresh,
};
