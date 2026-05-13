import { Model, DataTypes } from "sequelize";

export default (sequelize, DataTypes) => {
  class UserProfile extends Model {
    static associate(models) {
      UserProfile.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  UserProfile.init(
    {
      user_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
      },

      first_name: {
        type: DataTypes.STRING(100),
      },

      last_name: {
        type: DataTypes.STRING(100),
      },

      id_card: {
        type: DataTypes.STRING(20),
        unique: true,
      },

      avatar_url: {
        type: DataTypes.TEXT,
      },

      cover_photo_url: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: "UserProfile",
      tableName: "user_profiles",
      createdAt: false,
      updatedAt: "updated_at",
    },
  );

  return UserProfile;
};