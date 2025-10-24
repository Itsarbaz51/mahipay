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
  RETAILER: [
    "/dashboard",
    "/kyc-submit",
    "/commission",
    "/add-fund",
    "/profile",
  ],
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, currentUser, isLoading } = useSelector(
    (state) => state.auth
  );
  const location = useLocation();

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Redirect to KYC submit if not verified and not already on KYC page
  if (!currentUser.isKycVerified && location.pathname !== "/kyc-submit") {
    return <Navigate to="/kyc-submit" replace />;
  }

  // Redirect to dashboard if KYC verified but on KYC submit page
  if (currentUser.isKycVerified && location.pathname === "/kyc-submit") {
    return <Navigate to="/dashboard" replace />;
  }

  // Role-based access control
  const role = currentUser?.role?.name || currentUser?.role || "RETAILER";
  const allowedPaths = ROLE_PERMISSIONS[role] || [];
  const currentPath = location.pathname;

  const isPathAllowed = allowedPaths.some(
    (path) => currentPath === path || currentPath.startsWith(path + "/")
  );

  if (!isPathAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
