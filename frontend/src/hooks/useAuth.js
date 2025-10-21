import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { loadUser, logout } from "../features/auth/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  // 🧩 Load user automatically if there's a token
  useEffect(() => {
    if (token && !user) {
      dispatch(loadUser());
    }
  }, [dispatch, token, user]);

  // 🧩 Helper to logout
  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    logout: handleLogout,
  };
};
