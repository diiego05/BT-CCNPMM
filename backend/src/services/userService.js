import db from "../models/index.js";

const getUserProfileById = (id) => {
  // TODO: Implement get user by id
  return new Promise(async (resolve, reject) => {
    try {
      let userProfile = await db.UserProfile.findOne({
        where: { user_id: id },
        raw: true,
      });
      if (userProfile) {
        resolve(userProfile);
      } else {
        resolve({});
      }
    } catch (error) {
      reject(error);
    }
  });
};

const updateUserProfile = (data) => {
  // TODO: Implement update user
  return new Promise(async (resolve, reject) => {
    try {
      console.log("data.user_id:", data.user_id);
      let userProfile = await db.UserProfile.findOne({
        where: { user_id: data.user_id },
      });
      if (userProfile) {
        await userProfile.update({
          first_name: data.first_name,
          last_name: data.last_name,
          id_card: data.id_card,
          avatar_url: data.avatar_url,
          cover_photo_url: data.cover_photo_url,
        });
        resolve(userProfile);
      } else {
        resolve({});
      }
    } catch (error) {
      reject(error);
    }
  });
};

export default {
  getUserProfileById,
  updateUserProfile,
};
