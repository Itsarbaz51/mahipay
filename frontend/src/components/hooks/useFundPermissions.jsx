import { useMemo } from "react";
import { useSelector } from "react-redux";

// Service constants
export const SERVICES = {
  RAZORPAY: "RAZORPAY",
  BANK_TRANSFER: "BANK_TRANSFER",
};

// Route to Service Mapping
export const ROUTE_SERVICE_MAP = {
  "/request-fund": [SERVICES.RAZORPAY, SERVICES.BANK_TRANSFER],
  // Future routes can be added here
  // "/some-other-route": [SERVICES.SOME_SERVICE],
};

export const useFundPermissions = (routePath = null) => {
  const { currentUser } = useSelector((state) => state.auth);

  const permissions = useMemo(() => {
    // Get user permissions from current user
    const userPermissions = currentUser?.userPermissions || [];

    // Extract service codes from permissions
    const availableServices = userPermissions
      .map((permission) => {
        // Handle both object and string formats
        if (typeof permission === "object") {
          return permission?.service?.code || "";
        }
        return permission;
      })
      .filter((service) => Object.values(SERVICES).includes(service));

    // Check which services are available
    const hasRazorpay = availableServices.includes(SERVICES.RAZORPAY);
    const hasBankTransfer = availableServices.includes(SERVICES.BANK_TRANSFER);

    // Determine visible services
    const visibleServices = [];
    if (hasRazorpay) visibleServices.push(SERVICES.RAZORPAY);
    if (hasBankTransfer) visibleServices.push(SERVICES.BANK_TRANSFER);

    // Show Add Fund menu if at least one service is available
    const showAddFund = visibleServices.length > 0;

    // Generic route accessibility check
    const isRouteAccessible = (path = routePath) => {
      if (!path) return showAddFund; // Default behavior for /request-fund

      const requiredServices = ROUTE_SERVICE_MAP[path];

      // If no specific services required for this route, allow access
      if (!requiredServices || requiredServices.length === 0) return true;

      // Check if user has at least one required service
      return requiredServices.some((service) =>
        availableServices.includes(service)
      );
    };

    // Check specific route accessibility
    const canAccessRoute = isRouteAccessible(routePath);

    return {
      // Service-specific permissions
      visibleServices,
      showAddFund,
      hasRazorpay,
      hasBankTransfer,
      hasBothServices: hasRazorpay && hasBankTransfer,
      hasAnyService: hasRazorpay || hasBankTransfer,

      // Route accessibility
      isRouteAccessible: canAccessRoute,

      // Generic function to check any route
      canAccessRoute: isRouteAccessible,

      // Available services array
      availableServices,
    };
  }, [currentUser, routePath]);

  return permissions;
};
