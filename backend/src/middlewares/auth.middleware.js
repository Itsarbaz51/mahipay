import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import models from "../models/index.js";

export const BUSINESS_ROLES = {
  ROOT: "ROOT",
  ADMIN: "ADMIN",
  STATE_HEAD: "STATE HEAD",
  MASTER_DISTRIBUTOR: "MASTER DISTRIBUTOR",
  DISTRIBUTOR: "DISTRIBUTOR",
  RETAILER: "RETAILER",
};

class AuthMiddleware {
  static authenticate = asyncHandler(async (req, res, next) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw ApiError.unauthorized("Access token required");

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await this.findUserWithContext(decoded.id);

    if (!user || user.status !== "ACTIVE")
      throw ApiError.unauthorized("Invalid or inactive account");

    req.user = user;
    next();
  });

  static async findUserWithContext(userId) {
    // Check Root
    let user = await models.Root.findByPk(userId);
    if (user) return { ...user.toJSON(), userType: "root", permissions: [] };

    // Check Employee with permissions
    user = await models.Employee.findByPk(userId, {
      include: [
        { association: "department", attributes: ["name"] },
        {
          association: "employeePermissions",
          where: { isActive: true },
          required: false,
        },
        {
          association: "createdByRoot",
          attributes: ["id", "hierarchyLevel", "hierarchyPath"],
        },
        {
          association: "createdByUser",
          attributes: ["id", "hierarchyLevel", "hierarchyPath", "roleId"],
        },
      ],
    });
    if (user) {
      const permissions =
        user.employeePermissions?.map((ep) => ep.permission) || [];
      const creator = user.createdByRoot
        ? { ...user.createdByRoot.toJSON(), userType: "root" }
        : user.createdByUser
          ? { ...user.createdByUser.toJSON(), userType: "business" }
          : null;

      return {
        ...user.toJSON(),
        userType: "employee",
        permissions,
        creator,
        departmentName: user.department?.name,
      };
    }

    // Check Business User
    user = await models.User.findByPk(userId, {
      include: [
        { association: "role" },
        { association: "userPermissions", required: false },
      ],
    });
    if (user) {
      const permissions =
        user.userPermissions?.map((up) => up.permission) || [];
      return {
        ...user.toJSON(),
        userType: "business",
        permissions,
        role: user.role?.name,
      };
    }

    return null;
  }

  static authorize = (options = {}) =>
    asyncHandler(async (req, res, next) => {
      const user = req.user;
      if (!user) throw ApiError.unauthorized("Authentication required");
      if (user.userType === "root") return next();

      // Role/User Type Check
      if (options.roles?.length && !options.roles.includes(user.role)) {
        throw ApiError.forbidden(`Required roles: ${options.roles.join(", ")}`);
      }
      if (
        options.userTypes?.length &&
        !options.userTypes.includes(user.userType)
      ) {
        throw ApiError.forbidden(
          `Required user types: ${options.userTypes.join(", ")}`
        );
      }

      // Department Check
      if (
        options.departments?.length &&
        user.userType === "employee" &&
        !options.departments.includes(user.departmentName)
      ) {
        throw ApiError.forbidden(
          `Required departments: ${options.departments.join(", ")}`
        );
      }

      // Permission Check
      if (options.permissions?.length) {
        const hasAllPermissions = options.permissions.every(
          (permission) =>
            user.userType === "root" || user.permissions.includes(permission)
        );
        if (!hasAllPermissions)
          throw ApiError.forbidden("Insufficient permissions");
      }

      next();
    });

  // Convenience Methods
  static requireRoot = this.authorize({ userTypes: ["root"] });
  static requireBusiness = this.authorize({ userTypes: ["business"] });
  static requireEmployee = this.authorize({ userTypes: ["employee"] });
  static requireAdmin = this.authorize({ roles: [BUSINESS_ROLES.ADMIN] });
  static requirePermissions = (...permissions) =>
    this.authorize({ permissions });
  static requireDepartment = (departments) =>
    this.authorize({ userTypes: ["employee"], departments });
}

export default AuthMiddleware;
