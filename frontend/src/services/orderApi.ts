import axiosInstance from "@/lib/axiosInstance";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: string | number;
  product?: {
    id: number;
    name: string;
    slug: string;
    price: string | number;
    images?: {
      id: number;
      product_id: number;
      image_url: string;
      is_primary: boolean;
    }[];
  };
}

export interface Order {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  address: string;
  note: string | null;
  total_price: string | number;
  payment_method: string;
  status: number; // 1: Đơn hàng mới, 2: Đã xác nhận, 3: Đang chuẩn bị, 4: Đang giao, 5: Đã giao thành công, 6: Hủy đơn, 7: Yêu cầu hủy
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface ShippingData {
  fullName: string;
  phone: string;
  address: string;
  note?: string;
  couponCode?: string;
  selectedKeys?: string[];
}

export interface OrderResponse<T> {
  status: number;
  message?: string;
  data: T;
}

const orderApi = {
  createOrder: (shippingData: ShippingData): Promise<OrderResponse<Order>> =>
    axiosInstance.post<OrderResponse<Order>>("/order/checkout", shippingData).then((res) => res.data),

  getOrderHistory: (): Promise<OrderResponse<Order[]>> =>
    axiosInstance.get<OrderResponse<Order[]>>("/order/history").then((res) => res.data),

  getOrderDetails: (orderId: number): Promise<OrderResponse<Order>> =>
    axiosInstance.get<OrderResponse<Order>>(`/order/${orderId}`).then((res) => res.data),

  cancelOrder: (orderId: number): Promise<OrderResponse<Order>> =>
    axiosInstance.post<OrderResponse<Order>>(`/order/${orderId}/cancel`).then((res) => res.data),
};

export default orderApi;
