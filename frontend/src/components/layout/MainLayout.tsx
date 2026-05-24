import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/stores/store";
import { fetchCartThunk, syncCartThunk } from "@/stores/cartSlice";

const MainLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, initialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (initialized) {
      if (isAuthenticated) {
        // Kiểm tra giỏ hàng guest từ localStorage để gộp lên server
        const storedCart = localStorage.getItem("guestCart");
        const parsed = storedCart ? JSON.parse(storedCart) : null;
        
        if (parsed && parsed.items && parsed.items.length > 0) {
          const guestItems = parsed.items.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          }));
          dispatch(syncCartThunk(guestItems));
        } else {
          dispatch(fetchCartThunk());
        }
      }
    }
  }, [dispatch, isAuthenticated, initialized]);

  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
};

export default MainLayout;
