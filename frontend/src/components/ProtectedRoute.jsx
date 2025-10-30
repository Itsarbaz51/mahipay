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
    "/request-fund",
    "/card-payout",
    "/profile/:id",
    "/audit-logs",
    "/login-logs",
    "/bank-details",
    "/payout",
  ],
  "STATE HEAD": [
    "/dashboard",
    "/kyc-submit",
    "/wallet",
    "/members",
    "/commission",
    "/request-fund",
    "/card-payout",
    "/profile/:id",
    "/transactions",
    "/bank-details",
    "/settings",
    "/payout",
  ],
  "MASTER DISTRIBUTOR": [
    "/dashboard",
    "/kyc-submit",
    "/members",
    "/commission",
    "/request-fund",
    "/card-payout",
    "/profile/:id",
    "/transactions",
    "/bank-details",
    "/settings",
    "/payout",
  ],
  DISTRIBUTOR: [
    "/dashboard",
    "/kyc-submit",
    "/members",
    "/commission",
    "/card-payout",
    "/request-fund",
    "/profile/:id",
    "/transactions",
    "/bank-details",
    "/settings",
    "/payout",
  ],
  RETAILER: [
    "/dashboard",
    "/kyc-submit",
    "/commission",
    "/request-fund",
    "/card-payout",
    "/profile/:id",
    "/transactions",
    "/settings",
    "/payout",
  ],
};

const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/contact",
  "/login",
  "/privacy-policy",
  "/terms-conditions",
];

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, currentUser } = useSelector((state) => state.auth);
  const location = useLocation();
  const currentPath = location.pathname;

  // Allow public routes without authentication
  if (PUBLIC_ROUTES.includes(currentPath)) {
    return children;
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (currentUser.status === "DELETE" || currentUser.status === "IN_ACTIVE") {
    if (currentPath === "/unauthorized" || currentPath === "/logout") {
      return children;
    }
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  if (!currentUser?.isKycVerified) {
    if (currentPath === "/kyc-submit") {
      return children;
    }
    return <Navigate to="/kyc-submit" replace state={{ from: location }} />;
  } else {
    if (currentPath === "/kyc-submit") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const role = currentUser?.role?.name || currentUser?.role;
  const allowedPaths = ROLE_PERMISSIONS[role] || [];

  const isPathAllowed = allowedPaths.some((path) => {
    if (path.includes(":")) {
      const regex = new RegExp("^" + path.replace(/:\w+/g, "[^/]+") + "$");
      return regex.test(currentPath);
    }

    if (currentPath === path) return true;
    if (currentPath.startsWith(path + "/")) return true;

    return false;
  });

  if (!isPathAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
