import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class ProductImage extends Model {
    static associate(models) {
      ProductImage.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }
  }

  ProductImage.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "ProductImage",
      tableName: "product_images",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return ProductImage;
};
