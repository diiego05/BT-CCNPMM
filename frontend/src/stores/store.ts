import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/stores/authSlice";
import cartReducer from "@/stores/cartSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
