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
    "/profile/:id",
    "/audit-logs",
    "/login-logs",
    "/bank-details",
  ],
  "STATE HEAD": [
    "/dashboard",
    "/kyc-submit",
    "/wallet",
    "/members",
    "/commission",
    "/add-fund",
    "/card-payout",
    "/profile/:id",
    "/transactions",
    "/bank-details",
    "/settings",
  ],
  "MASTER DISTRIBUTOR": [
    "/dashboard",
    "/kyc-submit",
    "/members",
    "/commission",
    "/add-fund",
    "/card-payout",
    "/profile/:id",
    "/transactions",
    "/bank-details",
    "/settings",
  ],
  DISTRIBUTOR: [
    "/dashboard",
    "/kyc-submit",
    "/members",
    "/commission",
    "/card-payout",
    "/add-fund",
    "/profile/:id",
    "/transactions",
    "/bank-details",
    "/settings",
  ],
  RETAILER: [
    "/dashboard",
    "/kyc-submit",
    "/commission",
    "/add-fund",
    "/card-payout",
    "/profile/:id",
    "/transactions",
    "/settings",
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

  if (currentUser.status === "DELETE" || currentUser.status === "IN_ACTIVE") {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  if (
    isAuthenticated &&
    !currentUser?.isKycVerified &&
    location.pathname !== "/kyc-submit"
  ) {
    return <Navigate to="/kyc-submit" replace state={{ from: location }} />;
  }

  if (currentUser?.isKycVerified && location.pathname === "/kyc-submit") {
    return <Navigate to="/dashboard" replace />;
  }

  const role = currentUser?.role?.name || currentUser?.role || "USER";
  const allowedPaths = ROLE_PERMISSIONS[role] || [];
  const currentPath = location.pathname;

  const isPathAllowed = allowedPaths.some((path) => {
    if (path.includes(":")) {
      // Convert "/profile/:id" to regex like /^\/profile\/[^/]+$/
      const regex = new RegExp("^" + path.replace(/:\w+/g, "[^/]+") + "$");
      return regex.test(currentPath);
    }
    return currentPath === path || currentPath.startsWith(path + "/");
  });

  if (!isPathAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
