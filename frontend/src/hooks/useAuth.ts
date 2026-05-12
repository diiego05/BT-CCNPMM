import { useSelector } from "react-redux";
import type { RootState } from "@/stores/store";

export default function useAuth() {
  const { isAuthenticated, user, loading, error, accessToken } = useSelector(
    (state: RootState) => state.auth,
  );

  return { isAuthenticated, user, loading, error, accessToken };
}
