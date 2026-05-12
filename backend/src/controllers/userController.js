import userService from "../services/userService.js";

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const userData = await userService.getUserProfileById(userId);

    return res
      .status(200)
      .json({ message: "Profile retrieved successfully", data: userData });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const data = { ...req.body, user_id: req.user.id };
    const user = await userService.updateUserProfile(data);
    return res
      .status(200)
      .json({ message: "Profile updated successfully", data: user });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  getUserProfile,
  updateUserProfile,
};
