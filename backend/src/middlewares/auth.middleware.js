import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import Prisma from "../db/db.js";

export const ROLE_TYPES = {
  BUSINESS: "business",
  EMPLOYEE: "employee",
};

class AuthMiddleware {
  static isAuthenticated = asyncHandler(async (req, res, next) => {
    const token =
      req.cookies?.accessToken ||
      req.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      throw ApiError.unauthorized("Unauthorized: No token provided");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      throw ApiError.unauthorized("Unauthorized: Invalid/Expired token");
    }

    const userExists = await Prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: {
          select: {
            name: true,
            type: true,
            level: true,
          },
        },
      },
    });

    if (!userExists) {
      throw ApiError.unauthorized("Unauthorized: Invalid token user");
    }

    req.user = {
      id: userExists.id,
      email: userExists.email,
      role: userExists.role.name,
      roleType: userExists.role.type,
      roleLevel: userExists.role.level,
      roleDetails: userExists.role,
    };

    return next();
  });

  // Business roles ke liye authorization
  static authorizeBusinessRoles = (allowedRoles = []) =>
    asyncHandler(async (req, res, next) => {
      const userRole = req.user?.role;
      const userRoleType = req.user?.roleType;

      if (!userRole || userRoleType !== ROLE_TYPES.BUSINESS) {
        throw ApiError.forbidden("Access restricted to business users only");
      }

      if (!allowedRoles.includes(userRole)) {
        throw ApiError.forbidden(
          `Required business roles: ${allowedRoles.join(", ")}, Your role: ${userRole}`
        );
      }

      return next();
    });

  // Employee roles ke liye authorization
  static authorizeEmployeeRoles = (allowedRoles = []) =>
    asyncHandler(async (req, res, next) => {
      const userRole = req.user?.role;
      const userRoleType = req.user?.roleType;

      if (!userRole || userRoleType !== ROLE_TYPES.EMPLOYEE) {
        throw ApiError.forbidden("Access restricted to employees only");
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        throw ApiError.forbidden(
          `Required employee roles: ${allowedRoles.join(", ")}, Your role: ${userRole}`
        );
      }

      return next();
    });

  // Role type based authorization
  static authorizeRoleTypes = (allowedRoleTypes = []) =>
    asyncHandler(async (req, res, next) => {
      const userRoleType = req.user?.roleType;

      if (!allowedRoleTypes.includes(userRoleType)) {
        throw ApiError.forbidden(
          `Required role types: ${allowedRoleTypes.join(", ")}, Your role type: ${userRoleType}`
        );
      }

      return next();
    });
}
export default AuthMiddleware;
