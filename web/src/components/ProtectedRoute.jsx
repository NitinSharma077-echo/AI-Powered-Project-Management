import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { BootScreen } from "./Loading";

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <BootScreen />;
  }

  if (!isAuthenticated) {
    // Come back to the page the user asked for after signing in.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
