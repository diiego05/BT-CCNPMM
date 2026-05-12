import axios from "axios";

// Lấy link API trực tiếp từ biến môi trường (ví dụ: VITE_API_URL=http://localhost:8088 trên local)
// Khi deploy lên server (Vercel, v.v.), bạn chỉ cần thêm biến VITE_API_URL trỏ về link backend là được
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor: tự động đính kèm accessToken
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: xử lý lỗi chung và tự động refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Backend trả 401 (thiếu token) hoặc 403 (token expired)
    // KHÔNG áp dụng refresh token cho request /auth/login vì đó là lỗi sai mật khẩu
    if (
      (status === 401 || status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          // Gọi API refresh token
          const res = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          if (res.status === 200 && res.data?.data) {
            const { accessToken, refreshToken: newRefreshToken } =
              res.data.data;

            // Cập nhật token mới vào localStorage
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", newRefreshToken);

            // Gắn token mới vào request bị lỗi và thử lại
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh token cũng đã hết hạn (sau 1m) -> Tự động logout
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/auth/login";
          return Promise.reject(refreshError);
        }
      }

      // Nếu không có refresh token hoặc gọi lỗi -> Tự động logout
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/auth/login";
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
