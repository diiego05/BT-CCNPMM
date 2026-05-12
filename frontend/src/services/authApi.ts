import axiosInstance from "@/lib/axiosInstance";

export interface LoginPayload {
  email_or_phone: string;
  password: string;
}

export interface LoginResponse {
  status: number;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    redirectUrl: string;
    user: {
      id: number;
      email: string;
      phone: string;
      role: string;
    };
  };
}

const authApi = {
  login: (payload: LoginPayload): Promise<LoginResponse> =>
    axiosInstance.post<LoginResponse>("/auth/login", payload).then((res) => res.data),

  /** Gọi GET /user/profile để verify token còn sống không */
  getMe: () => axiosInstance.get("/user/profile"),

  /** Gửi Google Access Token lên server để xác thực */
  googleLogin: (googleAccessToken: string): Promise<LoginResponse> =>
    axiosInstance.post<LoginResponse>("/auth/google", { googleAccessToken }).then((res) => res.data),
};

export default authApi;
