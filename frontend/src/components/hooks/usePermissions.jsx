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

export const usePermissions = (routePath = null) => {
  const { currentUser } = useSelector((state) => state.auth);

  const permissions = useMemo(() => {
    // Get user permissions from current user
    const userPermissions = currentUser?.userPermissions || [];

    // Extract service codes from permissions with canView check
    const servicePermissions = userPermissions
      .map((permission) => {
        // Handle both object and string formats
        if (typeof permission === "object") {
          const serviceCode = permission?.service?.code;
          const canView = permission?.canView;

          // Only return service if canView is true and service code is valid
          if (
            serviceCode &&
            canView === true &&
            Object.values(SERVICES).includes(serviceCode)
          ) {
            return serviceCode;
          }
          return null;
        }

        // Handle string format - assume canView is true for strings
        if (
          typeof permission === "string" &&
          Object.values(SERVICES).includes(permission)
        ) {
          return permission;
        }

        return null;
      })
      .filter((service) => service !== null); // Remove null values

    // Check which services are available (only those with canView: true)
    const hasRazorpay = servicePermissions.includes(SERVICES.RAZORPAY);
    const hasBankTransfer = servicePermissions.includes(SERVICES.BANK_TRANSFER);

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

      // Check if user has at least one required service with canView: true
      return requiredServices.some((service) =>
        servicePermissions.includes(service)
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

      // Available services array (only those with canView: true)
      availableServices: servicePermissions,
    };
  }, [currentUser, routePath]);

  return permissions;
};
