import { useEffect, useRef } from "react";

export const ROUTE_CONFIG = {
  PUBLIC: [
    "/",
    "/about",
    "/contact",
    "/login",
    "/privacy-policy",
    "/terms-conditions",
    "/permission-denied",
    "/logout",
  ],

  UNAUTHORIZED_ACCESS_ROUTES: ["/unauthorized", "/logout"],

  STATIC_BUSINESS_ROLES: [
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
  ],

  STATIC_ROLE_PERMISSIONS: {
    ADMIN: [
      "/dashboard",
      "/transactions",
      "/kyc-request",
      "/employee-management",
      "/reports",
      "/permission",
      "/settings",
      "/members",
      "/commission",
      "/request-fund",
      "/card-payout",
      "/profile/:id",
      "/logs",
      "/payout",
    ],
    "STATE HEAD": [
      "/dashboard",
      "/kyc-submit",
      "/wallet",
      "/members",
      "/commission",
      "/kyc-request",
      "/request-fund",
      "/card-payout",
      "/profile/:id",
      "/transactions",
      "/settings",
      "/logs",
      "/payout",
    ],
    "MASTER DISTRIBUTOR": [
      "/dashboard",
      "/kyc-submit",
      "/members",
      "/commission",
      "/request-fund",
      "/kyc-request",
      "/card-payout",
      "/profile/:id",
      "/transactions",
      "/settings",
      "/logs",
      "/payout",
    ],
    DISTRIBUTOR: [
      "/dashboard",
      "/kyc-submit",
      "/members",
      "/commission",
      "/card-payout",
      "/request-fund",
      "/kyc-request",
      "/profile/:id",
      "/transactions",
      "/settings",
      "/payout",
      "/logs",
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
      "/logs",
    ],
  },

  PERMISSION_TO_ROUTE_MAP: {
    dashboard: "/dashboard",
    transactions: "/transactions",
    "kyc request": "/kyc-request",
    "employee management": "/employee-management",
    reports: "/reports",
    settings: "/settings",
    members: "/members",
    commission: "/commission",
    "fund request": "/request-fund",
    payout: "/payout",
    logs: "/logs",
    profile: "/profile/:id",
  },
};

// Utility functions for better separation of concerns
export const RouteUtils = {
  /**
   * Check if a path matches a route pattern (supports dynamic segments)
   */
  isPathAllowed: (currentPath, allowedPath) => {
    // Handle exact matches
    if (currentPath === allowedPath) {
      return true;
    }

    // Handle dynamic routes with parameters
    if (allowedPath.includes(":")) {
      const regexPattern = allowedPath
        .replace(/:\w+/g, "([^/]+)")
        .replace(/\//g, "\\/");

      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(currentPath);
    }

    // Handle nested routes (e.g., /transactions/123 should match /transactions)
    if (currentPath.startsWith(allowedPath + "/")) {
      return true;
    }

    return false;
  },

  /**
   * Check if any allowed path matches the current path
   */
  hasAccessToPath: (currentPath, allowedPaths) => {
    return allowedPaths.some((path) =>
      RouteUtils.isPathAllowed(currentPath, path)
    );
  },

  /**
   * Extract employee permissions and map to routes - FIXED VERSION
   */
  getUserAllowedRoutes: (userPermissions = []) => {
    const allowedRoutes = userPermissions
      .map((permission) => {
        // Handle both string permissions and permission objects
        const permissionKey =
          typeof permission === "string"
            ? permission.toLowerCase().trim()
            : permission?.permission?.toLowerCase()?.trim() || "";

        const mappedRoute = ROUTE_CONFIG.PERMISSION_TO_ROUTE_MAP[permissionKey];

        return mappedRoute;
      })
      .filter(Boolean);

    // Remove duplicates and return ONLY explicit permissions
    return [...new Set(allowedRoutes)];
  },

  /**
   * Check if user can access profile routes
   */
  canAccessProfile: (currentPath, userId, allowedPaths = []) => {
    const userProfileRoute = `/profile/${userId}`;

    // Users can always access their own profile
    if (currentPath === userProfileRoute) {
      return true;
    }

    // For other profiles, need members permission and the route should be in allowed paths
    const hasMembersPermission = allowedPaths.some(
      (path) => path === "/members" || path === "/profile/:id"
    );

    return hasMembersPermission && currentPath.startsWith("/profile/");
  },

  /**
   * Check if user should be redirected from unauthorized page
   */
  shouldRedirectFromUnauthorized: (
    currentPath,
    isAuthenticated,
    currentUser
  ) => {
    if (currentPath === "/unauthorized" && isAuthenticated && currentUser) {
      // Only redirect if user is active and KYC verified
      const isUserActive =
        currentUser.status !== "DELETE" && currentUser.status !== "IN_ACTIVE";
      const isKycVerified = currentUser?.isKycVerified;

      return isUserActive && isKycVerified;
    }
    return false;
  },

  /**
   * Get default redirect route for employee based on permissions - FIXED VERSION
   */
  getEmployeeDefaultRoute: (allowedRoutes = []) => {
    // If no allowed routes, return permission-denied
    if (!allowedRoutes.length) {
      return "/permission-denied";
    }

    // Priority order for default routes
    const priorityRoutes = [
      "/dashboard",
      "/reports",
      "/transactions",
      "/commission",
      "/members",
      "/payout",
      "/logs",
      "/kyc-request",
      "/employee-management",
      "/settings",
      "/request-fund",
      "/card-payout",
    ];

    // Find first available route from priority list that user actually has access to
    const defaultRoute = priorityRoutes.find((route) =>
      allowedRoutes.includes(route)
    );

    // If no priority route found, return the first allowed route
    return defaultRoute || allowedRoutes[0] || "/permission-denied";
  },

  /**
   * Check if user has any valid permissions
   */
  hasValidPermissions: (userPermissions = []) => {
    return userPermissions && userPermissions.length > 0;
  },

  /**
   * Check if permissions have changed significantly
   */
  havePermissionsChanged: (oldPermissions = [], newPermissions = []) => {
    const oldPerms = JSON.stringify([...oldPermissions].sort());
    const newPerms = JSON.stringify([...newPermissions].sort());
    return oldPerms !== newPerms;
  },

  /**
   * Check if user should be blocked from accessing permission-denied
   */
  shouldBlockPermissionDenied: (currentUser, currentPath) => {
    if (currentPath !== "/permission-denied") return false;

    const userPermissions = currentUser?.userPermissions || [];
    return RouteUtils.hasValidPermissions(userPermissions);
  },

  /**
   * Enhanced permission change detection
   */
  detectPermissionChange: (oldPermissions = [], newPermissions = []) => {
    if (!oldPermissions.length && newPermissions.length) {
      return "initial_permissions_granted";
    }

    // FIX: Create copies before sorting
    const oldSorted = JSON.stringify([...oldPermissions].sort());
    const newSorted = JSON.stringify([...newPermissions].sort());

    return oldSorted !== newSorted ? "permissions_updated" : "no_change";
  },
};

// Updated hook without useNavigate - just for permission checking
export const usePermissionMonitor = (
  currentUser,
  isEmployee,
  currentPath,
  isAuthenticated
) => {
  const previousPermissionsRef = useRef([]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser || !isEmployee) return;

    const userPermissions = currentUser?.userPermissions || [];
    const currentPermissions = JSON.stringify(userPermissions.sort());

    // Update previous permissions
    previousPermissionsRef.current = currentPermissions;
  }, [currentUser, isEmployee, currentPath, isAuthenticated]);
};
