import axiosInstance from "@/lib/axiosInstance";

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  original_price: number | string;
  stock: number;
  sold: number;
  status: string;
  images: ProductImage[];
  category: Category;
}

export interface GetProductsParams {
  search?: string;
  category_slug?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  status: number;
  data: {
    products: Product[];
    total: number;
    page: number;
    total_pages: number;
  };
}

export interface ProductDetailResponse {
  status: number;
  data: {
    product: Product;
    related: Product[];
  };
}

const productApi = {
  getProducts: (params: GetProductsParams): Promise<ProductsResponse> =>
    axiosInstance.get("/products", { params }).then((res) => res.data),

  getProductDetail: (slug: string): Promise<ProductDetailResponse> =>
    axiosInstance.get(`/products/${slug}`).then((res) => res.data),
};

export default productApi;
