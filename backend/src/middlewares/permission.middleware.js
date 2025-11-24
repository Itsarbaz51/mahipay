import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import models from "../models/index.js";
import PermissionRegistry from "../utils/permissionRegistry.js";

class PermissionMiddleware {
  // Verify resource ownership
  static requireOwnership = (resourceType, idParam = "id") =>
    asyncHandler(async (req, res, next) => {
      const user = req.user;
      const resourceId = req.params[idParam];

      if (!resourceId)
        throw ApiError.badRequest(`Resource ID '${idParam}' required`);

      const isOwner = await this.checkOwnership(user, resourceType, resourceId);
      if (!isOwner) throw ApiError.forbidden(`Not owner of ${resourceType}`);

      next();
    });

  static async checkOwnership(user, resourceType, resourceId) {
    if (user.userType === "root") return true;

    const ownershipCheckers = {
      user: async () => {
        if (user.id === resourceId) return true;
        if (user.userType === "business") {
          const target = await models.User.findByPk(resourceId, {
            attributes: ["hierarchyPath"],
          });
          return target?.hierarchyPath?.startsWith(user.hierarchyPath);
        }
        return false;
      },

      employee: async () => {
        const employee = await models.Employee.findByPk(resourceId, {
          attributes: ["createdById"],
        });
        return (
          employee?.createdById === user.id ||
          (user.userType === "employee" &&
            employee?.createdById === user.creator?.id)
        );
      },

      wallet: async () => {
        const wallet = await models.Wallet.findByPk(resourceId, {
          attributes: ["userId"],
        });
        return this.checkOwnership(user, "user", wallet?.userId);
      },

      transaction: async () => {
        const transaction = await models.Transaction.findByPk(resourceId, {
          attributes: ["userId"],
        });
        return this.checkOwnership(user, "user", transaction?.userId);
      },

      department: async () => {
        const department = await models.Department.findByPk(resourceId, {
          attributes: ["createdById"],
        });
        return (
          department?.createdById === user.id ||
          (user.userType === "employee" &&
            department?.createdById === user.creator?.id)
        );
      },
    };

    const checker = ownershipCheckers[resourceType.toLowerCase()];
    return checker ? await checker() : false;
  }

  // Delegated permission check
  static canActOnBehalf = (action) =>
    asyncHandler(async (req, res, next) => {
      if (req.user.userType !== "employee") return next();

      const hasPermission = await this.verifyDelegatedPermission(
        req.user,
        action
      );
      if (!hasPermission)
        throw ApiError.forbidden(
          `Cannot perform ${action} on behalf of creator`
        );

      req.actingOnBehalfOf = req.user.creator;
      next();
    });

  static async verifyDelegatedPermission(employee, action) {
    if (!PermissionRegistry.isValid(action)) return false;
    if (!employee.permissions.includes(action)) return false;
    if (!employee.creator) return false;
    if (employee.creator.userType === "root") return true;

    // Check if business user creator has the permission
    if (employee.creator.userType === "business") {
      const creator = await models.User.findByPk(employee.creator.id, {
        include: [{ association: "userPermissions", required: false }],
      });
      return (
        creator?.userPermissions?.some((up) => up.permission === action) ||
        false
      );
    }

    return false;
  }

  // Dynamic permission checks
  static requireAny = (...permissions) =>
    asyncHandler(async (req, res, next) => {
      if (req.user.userType === "root") return next();

      const hasAny = permissions.some((p) => req.user.permissions.includes(p));
      if (!hasAny)
        throw ApiError.forbidden(`Required any of: ${permissions.join(", ")}`);

      next();
    });

  static checkDynamic = (permissionResolver) =>
    asyncHandler(async (req, res, next) => {
      const hasPermission = await permissionResolver(req);
      if (!hasPermission) throw ApiError.forbidden("Insufficient permissions");
      next();
    });

  // Department-specific access
  static requireDepartment = (department, ...permissions) =>
    asyncHandler(async (req, res, next) => {
      const user = req.user;

      if (user.userType !== "employee")
        throw ApiError.forbidden("Employees only");
      if (user.departmentName !== department)
        throw ApiError.forbidden(`Required department: ${department}`);

      const hasAll = permissions.every((p) => user.permissions.includes(p));
      if (!hasAll)
        throw ApiError.forbidden(
          `Required permissions: ${permissions.join(", ")}`
        );

      next();
    });
}

export default PermissionMiddleware;
