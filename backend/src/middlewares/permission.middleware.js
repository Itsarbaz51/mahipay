import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import PermissionRegistry from "../utils/permissionRegistry.js";

class PermissionMiddleware {
  // Unified permission check for all user types
  static requirePermission = (permission, serviceParam = null) =>
    asyncHandler(async (req, res, next) => {
      const user = req.user;

      if (!user) {
        throw ApiError.unauthorized("Authentication required");
      }

      // ROOT bypass - full access
      if (user.userType === "ROOT") {
        return next();
      }

      if (!permission) {
        throw ApiError.badRequest("Permission parameter required");
      }

      let serviceId = null;
      if (serviceParam) {
        serviceId = req.params[serviceParam] || req.body[serviceParam];
      }

      const hasPermission = await PermissionRegistry.hasPermission(
        user,
        permission,
        serviceId
      );
      if (!hasPermission) {
        throw ApiError.forbidden(`Permission denied: ${permission}`);
      }

      next();
    });

  // All permissions check
  static requireAll = (...permissions) =>
    asyncHandler(async (req, res, next) => {
      const user = req.user;

      if (!user) {
        throw ApiError.unauthorized("Authentication required");
      }

      if (user.userType === "ROOT") {
        return next();
      }

      if (!permissions.length) {
        throw ApiError.badRequest("Permissions list required");
      }

      const hasAll = await PermissionRegistry.hasAllPermissions(
        user,
        permissions
      );
      if (!hasAll) {
        throw ApiError.forbidden(`Required all: ${permissions.join(", ")}`);
      }

      next();
    });

  // Service-specific permission check
  static requireServicePermission = (
    permission,
    serviceIdParam = "serviceId"
  ) =>
    asyncHandler(async (req, res, next) => {
      const user = req.user;

      if (!user) {
        throw ApiError.unauthorized("Authentication required");
      }

      if (user.userType === "ROOT") {
        return next();
      }

      const serviceId = req.params[serviceIdParam];
      if (!serviceId) {
        throw ApiError.badRequest(
          `Service ID parameter '${serviceIdParam}' required`
        );
      }

      const hasPermission = await PermissionRegistry.hasPermission(
        user,
        permission,
        serviceId
      );
      if (!hasPermission) {
        throw ApiError.forbidden(
          `Permission '${permission}' denied for service: ${serviceId}`
        );
      }

      next();
    });
}

export default PermissionMiddleware;
