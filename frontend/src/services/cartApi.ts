import axiosInstance from "@/lib/axiosInstance";

export interface CartItem {
  product_id: number;
  field_key?: string;
  name: string;
  slug: string;
  price: string | number;
  original_price: string | number | null;
  image: string | null;
  category: string | null;
  stock: number;
  quantity: number;
  subtotal: number;
  size?: string | null;
  color?: string | null;
  type?: string | null;
}

export interface CartData {
  items: CartItem[];
  total_price: number;
  total_items: number;
}

export interface CartResponse {
  status: number;
  message?: string;
  data: CartData;
}

const cartApi = {
  getCart: (): Promise<CartResponse> =>
    axiosInstance.get<CartResponse>("/cart").then((res) => res.data),

  addToCart: (
    productId: number,
    quantity: number,
    size?: string | null,
    color?: string | null,
    type?: string | null
  ): Promise<CartResponse> =>
    axiosInstance.post<CartResponse>("/cart", {
      product_id: productId,
      quantity,
      size,
      color,
      type
    }).then((res) => res.data),

  updateCart: (productId: number, quantity: number, fieldKey?: string | null): Promise<CartResponse> =>
    axiosInstance.put<CartResponse>("/cart", { product_id: productId, quantity, field_key: fieldKey }).then((res) => res.data),

  removeFromCart: (fieldKey: string | number): Promise<CartResponse> =>
    axiosInstance.delete<CartResponse>(`/cart/${fieldKey}`).then((res) => res.data),

  clearCart: (): Promise<CartResponse> =>
    axiosInstance.delete<CartResponse>("/cart").then((res) => res.data),

  removeMultipleFromCart: (fieldKeys: string[]): Promise<CartResponse> =>
    axiosInstance.post<CartResponse>("/cart/delete-multiple", { fieldKeys }).then((res) => res.data),

  syncCart: (
    items: {
      product_id: number;
      quantity: number;
      size?: string | null;
      color?: string | null;
      type?: string | null;
    }[]
  ): Promise<CartResponse> =>
    axiosInstance.post<CartResponse>("/cart/sync", { items }).then((res) => res.data),
};

export default cartApi;
