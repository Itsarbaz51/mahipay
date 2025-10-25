import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ROLE_PERMISSIONS = {
  ADMIN: [
    "/dashboard",
    "/transactions",
    "/all-kyc",
    "/employee-management",
    "/reports",
    "/permission",
    "/settings",
    "/members",
    "/commission",
    "/add-fund",
    "/card-payout",
    "/profile",
    "/audit-logs",
    "/login-logs",
  ],
  "STATE HEAD": [
    "/dashboard",
    "/kyc-submit",
    "/wallet",
    "/members",
    "/commission",
    "/add-fund",
    "/profile",
  ],
  "MASTER DISTRIBUTOR": [
    "/dashboard",
    "/kyc-submit",
    "/members",
    "/commission",
    "/add-fund",
    "/profile",
  ],
  DISTRIBUTOR: [
    "/dashboard",
    "/kyc-submit",
    "/members",
    "/commission",
    "/add-fund",
    "/profile",
  ],
  RETAILER: ["/dashboard", "/kyc-submit", "/commission", "/add-fund"],
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, currentUser, isLoading } = useSelector(
    (state) => state.auth
  );
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    isAuthenticated &&
    !currentUser?.isKycVerified &&
    currentUser?.kyc?.status !== "VERIFIED" &&
    location.pathname !== "/kyc-submit"
  ) {
    return <Navigate to="/kyc-submit" replace state={{ from: location }} />;
  }

  if (
    currentUser?.isKycVerified &&
    currentUser?.kyc?.status === "VERIFIED" &&
    location.pathname === "/kyc-submit"
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  const role = currentUser?.role?.name || currentUser?.role || "USER";
  const allowedPaths = ROLE_PERMISSIONS[role] || [];
  const currentPath = location.pathname;

  if (!allowedPaths.some((p) => currentPath.startsWith(p))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
