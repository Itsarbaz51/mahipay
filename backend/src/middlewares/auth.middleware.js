import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import Prisma from "../db/db.js";

class AuthMiddleware {
  static isAuthenticated = asyncHandler(
    async (req, res, next) => {
      const token =
        req.cookies?.accessToken ||
        req.headers["authorization"]?.replace("Bearer ", "");

      if (!token) {
        throw ApiError.unauthorized("Unauthorized: No token provided");
      }

      let decoded;
      try {
        decoded = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET
        );
      } catch (error) {
        throw ApiError.unauthorized("Unauthorized: Invalid/Expired token");
      }

      const userExists = await Prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          role: {
            select: {
              name: true,
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
        roleLevel: userExists.role.level,
      };

      return next();
    }
  );

  static authorizeRoles = (allowedRoles = []) =>
    asyncHandler(
      async (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
          throw ApiError.unauthorized("Unauthorized: No role found");
        }

        if (!allowedRoles.includes(userRole)) {
          throw ApiError.forbidden("Forbidden: Insufficient privileges");
        }

        return next();
      }
    );
}

export default AuthMiddleware;