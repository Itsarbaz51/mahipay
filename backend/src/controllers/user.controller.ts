import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/WinstonLogger.js";
import UserServices from "../services/user.service.js";
import { UserStatus } from "@prisma/client";
import Helper from "../utils/helper.js";

class UserController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      logger.error("Parent ID missing during registration");
      throw ApiError.internal("Parent id is missing");
    }

    const data: any = { ...req.body };

    if (req.file) {
      data.profileImage = req.file.path;
    }

    const { user, accessToken } = await UserServices.register({
      ...data,
      parentId: userId,
    });

    if (!user || !accessToken) {
      logger.error("User creation failed during registration");
      throw ApiError.internal("User creation failed!");
    }

    const safeUser = Helper.serializeUser(user);

    logger.info("User registration completed successfully", {
      userId: user.id,
    });

    return res
      .status(201)
      .json(
        ApiResponse.success(
          { user: safeUser, accessToken },
          "User created successfully",
          201
        )
      );
  });

  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const updateData = req.body;
    const user = await UserServices.updateProfile(userId, updateData);

    const safeUser = Helper.serializeUser(user);

    logger.info("User profile updated successfully", { userId });

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: safeUser },
          "Profile updated successfully",
          200
        )
      );
  });

  static updateProfileImage = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = req.params;

      if (!userId) {
        throw ApiError.unauthorized("User not authenticated");
      }

      if (!req.file) {
        throw ApiError.badRequest("Profile image is required");
      }

      const user = await UserServices.updateProfileImage(userId, req.file.path);

      const safeUser = Helper.serializeUser(user);

      logger.info("User profile image updated successfully", { userId });

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "Profile image updated successfully",
            200
          )
        );
    }
  );

  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;

    if (!userId) {
      logger.warn("Get user attempted without user ID");
      throw ApiError.badRequest("userId required");
    }

    const user = await UserServices.getUserById(userId);

    logger.debug("User data fetched", { userId });

    return res
      .status(200)
      .json(ApiResponse.success({ user }, "User fetched", 200));
  });

  static getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    console.log("🔍 DEBUG - User ID from auth middleware:", userId);
    console.log("🔍 DEBUG - Full user object from request:", req.user);

    if (!userId) {
      logger.warn("Get current user attempted without user ID");
      throw ApiError.unauthorized("User not authenticated");
    }
    try {
      const user = await UserServices.getUserById(userId);

      if (!user) {
        logger.warn("User not found in database", { userId });
        throw ApiError.notFound("User not found");
      }

      logger.debug("Current user data fetched successfully", { userId });

      return res
        .status(200)
        .json(ApiResponse.success({ user }, "Current user fetched", 200));
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error("Error fetching current user", { userId, error });
      throw ApiError.internal("Failed to fetch user data");
    }
  });

  static getAllUsersByRole = asyncHandler(
    async (req: Request, res: Response) => {
      const { roleId } = req.params;

      if (!roleId) {
        logger.warn("Get users by role attempted without role ID");
        throw ApiError.badRequest("roleId is required");
      }

      const users = await UserServices.getAllUsersByRole(roleId);

      logger.info("Users fetched by role", {
        roleId,
        count: users.length,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success({ users }, "Users fetched successfully", 200)
        );
    }
  );

  static getAllUsersByParentId = asyncHandler(
    async (req: Request, res: Response) => {
      const parentId = req.user?.id;

      if (!parentId) {
        throw ApiError.unauthorized("User not authenticated");
      }

      const {
        page = "1",
        limit = "10",
        sort = "desc",
        status = "ALL",
        search = "",
      } = req.query;

      const parsedPage = parseInt(page as string, 10) || 1;
      const parsedLimit = parseInt(limit as string, 10) || 10;
      const parsedSort =
        (sort as string).toLowerCase() === "asc" ? "asc" : "desc";

      // Accept ALL but validate against real enum values
      const allowedStatuses = ["ALL", ...Object.values(UserStatus)];
      const upperStatus = ((status as string) || "ALL").toUpperCase();

      const parsedStatus = allowedStatuses.includes(upperStatus)
        ? upperStatus
        : "ALL";

      const { users, total } = await UserServices.getAllUsersByParentId(
        parentId,
        {
          page: parsedPage,
          limit: parsedLimit,
          sort: parsedSort,
          status: parsedStatus as UserStatus | "ALL",
          search: search as string,
        }
      );

      return res.status(200).json(
        ApiResponse.success(
          {
            users,
            total,
            page: parsedPage,
            limit: parsedLimit,
            totalPages: Math.ceil(total / parsedLimit),
          },
          "Users fetched successfully",
          200
        )
      );
    }
  );

  static getAllUsersByChildrenId = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = req.params;

      if (!userId) {
        logger.warn("Get children users attempted without user ID");
        throw ApiError.badRequest("userId is required");
      }

      const users = await UserServices.getAllUsersByChildrenId(userId);

      logger.info("Children users fetched", {
        userId,
        count: users.length,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { users },
            "Children users fetched successfully",
            200
          )
        );
    }
  );

  static getAllUsersCountByParentId = asyncHandler(
    async (req: Request, res: Response) => {
      const { parentId } = req.params;

      if (!parentId) {
        logger.warn("Get users count by parent attempted without parent ID");
        throw ApiError.badRequest("parentId is required");
      }

      const result = await UserServices.getAllUsersCountByParentId(parentId);

      logger.info("Users count by parent fetched", {
        parentId,
        count: result.count,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success(result, "Users count fetched successfully", 200)
        );
    }
  );

  static getAllUsersCountByChildrenId = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = req.params;

      if (!userId) {
        logger.warn("Get children count attempted without user ID");
        throw ApiError.badRequest("userId is required");
      }

      const result = await UserServices.getAllUsersCountByChildrenId(userId);

      logger.info("Children count fetched", {
        userId,
        count: result.count,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success(
            result,
            "Children count fetched successfully",
            200
          )
        );
    }
  );

  static deactivateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const deactivatedBy = req.user?.id;
    const { reason } = req.body;

    console.log("🔍 DEBUG - Deactivate User:", {
      userId,
      deactivatedBy,
      reason,
      user: req.user,
    });

    if (!deactivatedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!userId) {
      throw ApiError.badRequest("User ID is required");
    }

    try {
      const user = await UserServices.deactivateUser(
        userId,
        deactivatedBy,
        reason
      );

      const safeUser = Helper.serializeUser(user);

      logger.info("User deactivated via controller", {
        userId,
        deactivatedBy,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "User deactivated successfully",
            200
          )
        );
    } catch (error: any) {
      logger.error("Controller error in deactivateUser:", {
        userId,
        deactivatedBy,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  });

  static reactivateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const reactivatedBy = req.user?.id;
    const { reason } = req.body;

    console.log("🔍 DEBUG - Reactivate User:", {
      userId,
      reactivatedBy,
      reason,
      user: req.user,
    });

    if (!reactivatedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!userId) {
      throw ApiError.badRequest("User ID is required");
    }

    try {
      const user = await UserServices.reactivateUser(
        userId,
        reactivatedBy,
        reason
      );

      const safeUser = Helper.serializeUser(user);

      logger.info("User reactivated via controller", {
        userId,
        reactivatedBy,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "User reactivated successfully",
            200
          )
        );
    } catch (error: any) {
      logger.error("Controller error in reactivateUser:", {
        userId,
        reactivatedBy,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  });

  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const deletedBy = req.user?.id;
    const { reason } = req.body;

    console.log("🔍 DEBUG - Delete User:", {
      userId,
      deletedBy,
      reason,
      user: req.user,
    });

    if (!deletedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!userId) {
      throw ApiError.badRequest("User ID is required");
    }

    try {
      const user = await UserServices.deleteUser(userId, deletedBy, reason);

      const safeUser = Helper.serializeUser(user);

      logger.info("User deleted via controller", {
        userId,
        deletedBy,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "User deleted successfully",
            200
          )
        );
    } catch (error: any) {
      logger.error("Controller error in deleteUser:", {
        userId,
        deletedBy,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  });
}

export default UserController;
