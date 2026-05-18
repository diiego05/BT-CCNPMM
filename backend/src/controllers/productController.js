import productService from "../services/productService.js";

const getProducts = async (req, res) => {
  try {
    const query = req.query;
    const response = await productService.getProducts(query);
    return res.status(response.status).json(response);
  } catch (error) {
    console.error("Error getting products:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProductDetail = async (req, res) => {
  try {
    const { slug } = req.params;
    const response = await productService.getProductBySlug(slug);
    return res.status(response.status).json(response);
  } catch (error) {
    console.error("Error getting product detail:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default {
  getProducts,
  getProductDetail,
};
