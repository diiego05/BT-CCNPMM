import { RouteObject } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import AuthLayout from "@/components/layout/AuthLayout";
import AuthGuard from "@/hocs/AuthGuard";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Profile from "@/pages/Profile";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Home from "@/pages/Home";
import Cart from "@/pages/Cart";
import Orders from "@/pages/Orders";

export const getRoutes = (): RouteObject[] => {
  const role = "ADMIN";

  const publicRoutes: RouteObject[] = [
    {
      path: "/",
      element: <MainLayout />,
      children: [
        {
          index: true,
          element: <Home />,
        },
        {
          path: "shop",
          element: <Shop />,
        },
        {
          path: "cart",
          element: <Cart />,
        },
        {
          path: "product/:slug",
          element: <ProductDetail />,
        },
        {
          path: "profile",
          element: (
            <AuthGuard>
              <Profile />
            </AuthGuard>
          ),
        },
        {
          path: "orders",
          element: (
            <AuthGuard>
              <Orders />
            </AuthGuard>
          ),
        },
      ],
    },
    {
      path: "auth",
      element: <AuthLayout />,
      children: [
        {
          path: "login",
          element: <Login />,
        },
        {
          path: "register",
          element: <Register />,
        },
        {
          path: "forgot-password",
          element: <ForgotPassword />,
        },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ];

  const adminRoutes: RouteObject[] = [];

  switch (role) {
    case "ADMIN":
      return [...publicRoutes, ...adminRoutes];
    default:
      return publicRoutes;
  }
};
