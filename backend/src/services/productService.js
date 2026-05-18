import db from "../models/index.js";
import { Op } from "sequelize";

const getProducts = async (query) => {
  try {
    const { search, category_slug, min_price, max_price, sort_by, order, page = 1, limit = 12 } = query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }
    if (min_price) {
      where.price = { ...where.price, [Op.gte]: min_price };
    }
    if (max_price) {
      where.price = { ...where.price, [Op.lte]: max_price };
    }

    const include = [
      {
        model: db.ProductImage,
        as: "images",
        where: { is_primary: true },
        required: false,
      },
      {
        model: db.Category,
        as: "category",
      },
    ];

    if (category_slug) {
      include[1].where = { slug: category_slug };
      include[1].required = true;
    }

    const orderOptions = [];
    if (sort_by && order) {
      orderOptions.push([sort_by, order.toUpperCase()]);
    } else {
      orderOptions.push(["created_at", "DESC"]); // Default sort
    }

    const { count, rows } = await db.Product.findAndCountAll({
      where,
      include,
      order: orderOptions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true, // important when using includes with hasMany
    });

    return {
      status: 200,
      data: {
        products: rows,
        total: count,
        page: parseInt(page),
        total_pages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    throw error;
  }
};

const getProductBySlug = async (slug) => {
  try {
    const product = await db.Product.findOne({
      where: { slug },
      include: [
        {
          model: db.ProductImage,
          as: "images",
        },
        {
          model: db.Category,
          as: "category",
        },
      ],
    });

    if (!product) {
      return { status: 404, message: "Product not found" };
    }

    // Increment view count
    await product.increment("views", { by: 1 });

    // Get related products
    const relatedProducts = await db.Product.findAll({
      where: {
        category_id: product.category_id,
        id: { [Op.ne]: product.id }, // Not this product
      },
      include: [
        {
          model: db.ProductImage,
          as: "images",
          where: { is_primary: true },
          required: false,
        },
      ],
      limit: 4,
    });

    return {
      status: 200,
      data: {
        product,
        related: relatedProducts,
      },
    };
  } catch (error) {
    throw error;
  }
};

export default {
  getProducts,
  getProductBySlug,
};
