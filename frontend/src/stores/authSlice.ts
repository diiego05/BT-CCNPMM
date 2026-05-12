import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import authApi, { type LoginPayload } from "@/services/authApi";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthUser {
  id: number;
  email: string;
  phone: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// ─── Initial State ─────────────────────────────────────────────────────────────
const storedAccess = localStorage.getItem("accessToken");
const storedRefresh = localStorage.getItem("refreshToken");
const storedUser = localStorage.getItem("user");

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedAccess,
  refreshToken: storedRefresh,
  isAuthenticated: false, // luôn false cho đến khi verify xong
  loading: false,
  error: null,
  initialized: !storedAccess, // nếu không có token → coi như đã init
};

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/**
 * Chạy 1 lần khi app mount. Gọi GET /user/profile để verify token.
 * Nếu token hết hạn → interceptor sẽ thử refresh.
 * Nếu refresh cũng hết → interceptor xóa localStorage và redirect /auth/login.
 */
export const initAuthThunk = createAsyncThunk(
  "auth/init",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.getMe();
      // Token hợp lệ → lấy user info đã lưu từ localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        return JSON.parse(storedUser) as AuthUser;
      }
      return rejectWithValue("Không có thông tin user");
    } catch {
      return rejectWithValue("Token hết hạn");
    }
  },
);

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await authApi.login(payload);

      if (response.status !== 200 || !response.data) {
        return rejectWithValue(response.message);
      }

      // Luôn lưu token + user vào localStorage
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      return rejectWithValue(
        axiosError.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng thử lại.",
      );
    }
  },
);

export const googleLoginThunk = createAsyncThunk(
  "auth/googleLogin",
  async (googleAccessToken: string, { rejectWithValue }) => {
    try {
      const response = await authApi.googleLogin(googleAccessToken);

      if (response.status !== 200 || !response.data) {
        return rejectWithValue(response.message);
      }

      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      return response.data;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      return rejectWithValue(
        axiosError.response?.data?.message ||
          "Đăng nhập bằng Google thất bại.",
      );
    }
  },
);

// ─── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.initialized = true;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── initAuth ──
      .addCase(initAuthThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(initAuthThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(initAuthThunk.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      })
      // ── login ──
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      })
      // ── google login ──
      .addCase(googleLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLoginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
      })
      .addCase(googleLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
