import { useSelector } from "react-redux";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ROUTE_CONFIG, RouteUtils } from "./hooks/usePermissionMonitor";
import { useEffect, useRef } from "react";

// Authentication and authorization hooks for better reusability
const useAuth = () => {
  const { isAuthenticated, currentUser } = useSelector((state) => state.auth);
  const location = useLocation();
  const currentPath = location.pathname;

  return {
    isAuthenticated,
    currentUser,
    currentPath,
    location,
  };
};

const useUserRole = (currentUser) => {
  const role = currentUser?.role?.name || currentUser?.role;
  const isStaticBusinessRole =
    ROUTE_CONFIG.STATIC_BUSINESS_ROLES.includes(role);
  const isEmployee = currentUser?.role?.type === "employee";

  return {
    role,
    isStaticBusinessRole,
    isEmployee,
  };
};

// Custom hook for auto-redirect when permissions are updated - FIXED VERSION
const useAutoRedirect = (
  currentUser,
  isEmployee,
  currentPath,
  isAuthenticated
) => {
  const navigate = useNavigate();
  const previousPermissionsRef = useRef([]);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Reset redirect flag when path changes OR when user changes
    hasRedirectedRef.current = false;
    previousPermissionsRef.current = [];
  }, [currentPath, currentUser?.id]);

  useEffect(() => {
    // Only run if authenticated and user data is available
    if (!isAuthenticated || !currentUser || !isEmployee) return;

    const userPermissions = currentUser?.userPermissions || [];

    // FIX: Create a copy before sorting to avoid mutating read-only array
    const sortedPermissions = [...userPermissions].sort();
    const currentPermissions = JSON.stringify(sortedPermissions);

    // Check if permissions have actually changed
    const permissionsChanged =
      currentPermissions !== previousPermissionsRef.current;

    if (
      currentPath === "/permission-denied" &&
      RouteUtils.hasValidPermissions(userPermissions) &&
      (permissionsChanged || previousPermissionsRef.current === "[]") &&
      !hasRedirectedRef.current
    ) {
      const allowedPaths = RouteUtils.getUserAllowedRoutes(userPermissions);
      const defaultRoute = RouteUtils.getEmployeeDefaultRoute(allowedPaths);

      // IMPORTANT FIX: Check if defaultRoute is valid and not permission-denied
      if (defaultRoute && defaultRoute !== "/permission-denied") {
        hasRedirectedRef.current = true;
        navigate(defaultRoute, { replace: true });
      }
    }

    // Update previous permissions
    previousPermissionsRef.current = currentPermissions;
  }, [currentUser, isEmployee, currentPath, navigate, isAuthenticated]);
};

// Main component - FIXED VERSION
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, currentUser, currentPath, location } = useAuth();
  const { role, isStaticBusinessRole, isEmployee } = useUserRole(currentUser);

  // Use auto-redirect hook
  useAutoRedirect(currentUser, isEmployee, currentPath, isAuthenticated);

  // Handle public routes - including unauthorized and logout
  if (ROUTE_CONFIG.PUBLIC.includes(currentPath)) {
    return children;
  }

  // Authentication check
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // NEW: Prevent access to permission-denied if user has valid permissions
  if (currentPath === "/permission-denied" && isEmployee) {
    const userPermissions = currentUser?.userPermissions || [];

    if (RouteUtils.hasValidPermissions(userPermissions)) {
      const allowedPaths = RouteUtils.getUserAllowedRoutes(userPermissions);
      const defaultRoute = RouteUtils.getEmployeeDefaultRoute(allowedPaths);

      if (defaultRoute && defaultRoute !== "/permission-denied") {
        return <Navigate to={defaultRoute} replace />;
      }
    }
  }

  // Check if user should be redirected from unauthorized page
  if (
    RouteUtils.shouldRedirectFromUnauthorized(
      currentPath,
      isAuthenticated,
      currentUser
    )
  ) {
    // For employees, redirect to their allowed default route instead of dashboard
    if (isEmployee) {
      const userPermissions = currentUser?.userPermissions || [];

      if (!RouteUtils.hasValidPermissions(userPermissions)) {
        return <Navigate to="/permission-denied" replace />;
      }

      const allowedPaths = RouteUtils.getUserAllowedRoutes(userPermissions);
      const defaultRoute = RouteUtils.getEmployeeDefaultRoute(allowedPaths);

      if (defaultRoute && defaultRoute !== "/permission-denied") {
        return <Navigate to={defaultRoute} replace />;
      }
    }
    return <Navigate to="/dashboard" replace />;
  }

  // User status checks
  if (currentUser.status === "DELETE" || currentUser.status === "IN_ACTIVE") {
    // Allow access to unauthorized and logout routes for inactive users
    if (
      ROUTE_CONFIG.UNAUTHORIZED_ACCESS_ROUTES.includes(currentPath) ||
      currentPath === "/logout"
    ) {
      return children;
    }
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  // KYC verification flow
  if (!currentUser?.isKycVerified) {
    return currentPath === "/kyc-submit" ? (
      children
    ) : (
      <Navigate to="/kyc-submit" replace state={{ from: location }} />
    );
  }

  if (currentPath === "/kyc-submit") {
    // After KYC submission, redirect to appropriate route based on permissions
    if (isEmployee) {
      const userPermissions = currentUser?.userPermissions || [];

      // Check if user has any permissions at all
      if (!RouteUtils.hasValidPermissions(userPermissions)) {
        return <Navigate to="/permission-denied" replace />;
      }

      const allowedPaths = RouteUtils.getUserAllowedRoutes(userPermissions);
      const defaultRoute = RouteUtils.getEmployeeDefaultRoute(allowedPaths);

      if (defaultRoute && defaultRoute !== "/permission-denied") {
        return <Navigate to={defaultRoute} replace />;
      }
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Handle unauthorized route for active users - redirect to appropriate route
  if (currentPath === "/unauthorized") {
    if (isEmployee) {
      const userPermissions = currentUser?.userPermissions || [];

      // Check if user has any permissions at all
      if (!RouteUtils.hasValidPermissions(userPermissions)) {
        return <Navigate to="/permission-denied" replace />;
      }

      const allowedPaths = RouteUtils.getUserAllowedRoutes(userPermissions);
      const defaultRoute = RouteUtils.getEmployeeDefaultRoute(allowedPaths);

      if (defaultRoute && defaultRoute !== "/permission-denied") {
        return <Navigate to={defaultRoute} replace />;
      }
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Authorization based on role type
  if (isStaticBusinessRole) {
    const allowedPaths = ROUTE_CONFIG.STATIC_ROLE_PERMISSIONS[role] || [];

    if (!RouteUtils.hasAccessToPath(currentPath, allowedPaths)) {
      return <Navigate to="/permission-denied" replace />;
    }
  } else if (isEmployee) {
    const userPermissions = currentUser?.userPermissions || [];

    // Get allowed routes from permissions
    const allowedPaths = RouteUtils.getUserAllowedRoutes(userPermissions);

    // If no permissions at all, redirect to permission denied
    if (!RouteUtils.hasValidPermissions(userPermissions)) {
      return <Navigate to="/permission-denied" replace />;
    }

    // Special handling for profile routes
    if (currentPath.startsWith("/profile/")) {
      const canAccess = RouteUtils.canAccessProfile(
        currentPath,
        currentUser.id,
        allowedPaths
      );

      if (!canAccess) {
        return <Navigate to="/permission-denied" replace />;
      }
    }
    // Check general route access
    else if (!RouteUtils.hasAccessToPath(currentPath, allowedPaths)) {
      // Instead of going to permission-denied, redirect to first available allowed route
      const defaultRoute = RouteUtils.getEmployeeDefaultRoute(allowedPaths);

      if (defaultRoute && defaultRoute !== "/permission-denied") {
        return <Navigate to={defaultRoute} replace />;
      }

      return <Navigate to="/permission-denied" replace />;
    }
  } else {
    // Unknown role type
    return <Navigate to="/permission-denied" replace />;
  }

  return children;
};

export default ProtectedRoute;
