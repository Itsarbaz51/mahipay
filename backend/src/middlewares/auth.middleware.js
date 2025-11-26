import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import models from "../models/index.js";
import PermissionRegistry from "../utils/permissionRegistry.js";

class AuthMiddleware {
  static authenticate = asyncHandler(async (req, res, next) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw ApiError.unauthorized("Access token required");
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await this.findUserWithContext(decoded.id, decoded.userType);

      if (!user) {
        throw ApiError.unauthorized("Invalid token");
      }

      if (user.status !== "ACTIVE") {
        throw ApiError.unauthorized("Account is not active");
      }

      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized("Invalid token");
      }
      throw error;
    }
  });

  // Find user with complete context including permissions and creator
  static async findUserWithContext(userId, userType = null) {
    if (!userId) return null;
    console.log("===================== userType", userType);

    try {
      // If userType is provided, query directly to the specific table
      if (userType) {
        switch (userType.toUpperCase()) {
          case "ROOT":
            return await this._findRootUser(userId);

          case "EMPLOYEE":
            return await this._findEmployeeUser(userId);

          case "BUSINESS":
            return await this._findBusinessUser(userId);

          default:
            // If unknown userType, fall back to sequential search
            break;
        }
      }

      // If userType not provided, do sequential search as before
      return await this._findUserSequentially(userId);
    } catch (error) {
      console.error("Error finding user context:", error);
      return null;
    }
  }

  // Helper method for ROOT user
  static async _findRootUser(userId) {
    const user = await models.Root.findByPk(userId, {
      attributes: {
        exclude: ["password", "refreshToken", "passwordResetToken"],
      },
    });

    if (!user) return null;

    return {
      ...user.toJSON(),
      userType: "ROOT",
      permissions: PermissionRegistry.getAllPermissions(),
      creator: null,
    };
  }

  // Helper method for EMPLOYEE user
  static async _findEmployeeUser(userId) {
    const user = await models.Employee.findByPk(userId, {
      include: [
        {
          association: "department",
          attributes: ["id", "name", "description"],
        },
        {
          association: "createdByRoot",
          attributes: ["id", "firstName", "lastName", "email", "username"],
          required: false,
        },
        {
          association: "createdByUser",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "username",
            "roleId",
          ],
          required: false,
          include: [
            {
              association: "role",
              attributes: ["name"],
              required: false,
            },
          ],
        },
      ],
      attributes: {
        exclude: ["password", "refreshToken", "passwordResetToken"],
      },
    });

    if (!user) return null;

    const effectivePerms =
      await PermissionRegistry.getEmployeeEffectivePermissions(user.id, models);

    let creator = null;
    if (user.createdByType === "ROOT" && user.createdByRoot) {
      creator = {
        ...user.createdByRoot.toJSON(),
        userType: "ROOT",
      };
    } else if (user.createdByType === "ADMIN" && user.createdByUser) {
      creator = {
        ...user.createdByUser.toJSON(),
        userType: "BUSINESS",
        role: user.createdByUser.role?.name,
      };
    }

    return {
      ...user.toJSON(),
      userType: "EMPLOYEE",
      employeeRole: user.department?.name,
      employeeRoleId: user.department?.id,
      permissions: effectivePerms,
      creator,
    };
  }

  // Helper method for BUSINESS user
  static async _findBusinessUser(userId) {
    const user = await models.User.findByPk(userId, {
      include: [
        {
          association: "role",
          attributes: ["id", "name", "hierarchyLevel", "description"],
        },
        {
          association: "parent",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "username",
            "customerId",
          ],
          required: false,
          include: [
            {
              association: "role",
              attributes: ["name"],
              required: false,
            },
          ],
        },
      ],
      attributes: {
        exclude: [
          "password",
          "refreshToken",
          "transactionPin",
          "passwordResetToken",
        ],
      },
    });

    if (!user) return null;

    const effectivePerms = await PermissionRegistry.getUserEffectivePermissions(
      user.id,
      models
    );

    let creator = null;
    if (user.parent) {
      creator = {
        ...user.parent.toJSON(),
        userType: "BUSINESS",
        role: user.parent.role?.name,
      };
    }

    return {
      ...user.toJSON(),
      userType: "BUSINESS",
      role: user.role?.name,
      roleLevel: user.role?.hierarchyLevel,
      roleId: user.role?.id,
      permissions: effectivePerms,
      creator,
    };
  }

  // Fallback method for sequential search when userType is unknown
  static async _findUserSequentially(userId) {
    // Try ROOT first
    let user = await this._findRootUser(userId);
    if (user) return user;

    // Try EMPLOYEE
    user = await this._findEmployeeUser(userId);
    if (user) return user;

    // Try BUSINESS USER
    user = await this._findBusinessUser(userId);
    if (user) return user;

    return null;
  }

  // Generic authorization middleware
  static authorize = (options = {}) =>
    asyncHandler(async (req, res, next) => {
      const user = req.user;

      if (!user) {
        throw ApiError.unauthorized("Authentication required");
      }

      // ROOT has full access - bypass all checks
      if (user.userType === "ROOT") {
        return next();
      }

      // Check user types
      if (options.userTypes && !options.userTypes.includes(user.userType)) {
        throw ApiError.forbidden(
          `Required user types: ${options.userTypes.join(", ")}`
        );
      }

      // Check business roles
      if (options.roles && user.userType === "BUSINESS") {
        if (!options.roles.includes(user.role)) {
          throw ApiError.forbidden(
            `Required roles: ${options.roles.join(", ")}`
          );
        }
      }

      // Check employee departments (department acts as role)
      if (options.departments && user.userType === "EMPLOYEE") {
        if (!options.departments.includes(user.employeeRole)) {
          throw ApiError.forbidden(
            `Required departments: ${options.departments.join(", ")}`
          );
        }
      }

      // Check permissions
      if (options.permissions?.length > 0) {
        const hasPermission = await PermissionRegistry.hasPermission(
          user,
          options.permissions,
          options.serviceId
        );
        if (!hasPermission) {
          throw ApiError.forbidden(
            `Missing permissions: ${options.permissions.join(", ")}`
          );
        }
      }

      next();
    });

  // Unified authorization for both Business and Employee users
  static requireUser = this.authorize({ userTypes: ["BUSINESS", "EMPLOYEE"] });

  // Specific user type authorizations
  static requireBusiness = this.authorize({ userTypes: ["BUSINESS"] });
  static requireEmployee = this.authorize({ userTypes: ["EMPLOYEE"] });
  static requireRoot = this.authorize({ userTypes: ["ROOT"] });

  // Helper method to get creator info for easy access in controllers
  static getCreatorInfo(user) {
    if (!user || !user.creator) return null;

    return {
      id: user.creator.id,
      type: user.creator.userType,
      name: `${user.creator.firstName} ${user.creator.lastName}`,
      email: user.creator.email,
      username: user.creator.username,
      ...(user.creator.role && { role: user.creator.role }),
      ...(user.creator.customerId && { customerId: user.creator.customerId }),
    };
  }
}

export default AuthMiddleware;
