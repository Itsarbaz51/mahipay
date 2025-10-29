import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import UserServices from "../services/user.service.js";
import Helper from "../utils/helper.js";

class UserController {
  static register = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.internal("Parent id is missing");
    }

    const data = { ...req.body };

    if (req.file) {
      data.profileImage = req.file.path;
    }

    const { user, accessToken } = await UserServices.register({
      ...data,
      parentId: userId,
    });

    if (!user || !accessToken) {
      throw ApiError.internal("User creation failed!");
    }

    const safeUser = Helper.serializeUser(user);

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

  static updateProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const updateData = req.body;
    const user = await UserServices.updateProfile(userId, updateData);

    const safeUser = Helper.serializeUser(user);

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

  static updateProfileImage = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!req.file) {
      throw ApiError.badRequest("Profile image is required");
    }

    const user = await UserServices.updateProfileImage(userId, req.file.path);

    const safeUser = Helper.serializeUser(user);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: safeUser },
          "Profile image updated successfully",
          200
        )
      );
  });

  static getUserById = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    if (!userId) {
      throw ApiError.badRequest("userId required");
    }

    const user = await UserServices.getUserById(userId);

    return res
      .status(200)
      .json(ApiResponse.success({ user }, "User fetched", 200));
  });

  static getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    console.log("🔍 DEBUG - User ID from auth middleware:", userId);
    console.log("🔍 DEBUG - Full user object from request:", req.user);

    if (!userId) {
      throw ApiError.unauthorized("User not authenticated");
    }
    try {
      const user = await UserServices.getUserById(userId);

      if (!user) {
        throw ApiError.notFound("User not found");
      }

      return res
        .status(200)
        .json(ApiResponse.success({ user }, "Current user fetched", 200));
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw ApiError.internal("Failed to fetch user data");
    }
  });

  static getAllUsersByRole = asyncHandler(async (req, res) => {
    const { roleId } = req.params;

    if (!roleId) {
      throw ApiError.badRequest("roleId is required");
    }

    const users = await UserServices.getAllUsersByRole(roleId);

    return res
      .status(200)
      .json(ApiResponse.success({ users }, "Users fetched successfully", 200));
  });

  static getAllUsersByParentId = asyncHandler(async (req, res) => {
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

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const parsedSort = sort.toLowerCase() === "asc" ? "asc" : "desc";

    // Accept ALL but validate against real enum values
    const allowedStatuses = ["ALL", "ACTIVE", "IN_ACTIVE", "DELETED"];
    const upperStatus = (status || "ALL").toUpperCase();

    const parsedStatus = allowedStatuses.includes(upperStatus)
      ? upperStatus
      : "ALL";

    const { users, total } = await UserServices.getAllUsersByParentId(
      parentId,
      {
        page: parsedPage,
        limit: parsedLimit,
        sort: parsedSort,
        status: parsedStatus,
        search: search,
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
  });

  static getAllUsersByChildrenId = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
      throw ApiError.badRequest("userId is required");
    }

    const users = await UserServices.getAllUsersByChildrenId(userId);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { users },
          "Children users fetched successfully",
          200
        )
      );
  });

  static getAllUsersCountByParentId = asyncHandler(async (req, res) => {
    const { parentId } = req.params;

    if (!parentId) {
      throw ApiError.badRequest("parentId is required");
    }

    const result = await UserServices.getAllUsersCountByParentId(parentId);

    return res
      .status(200)
      .json(
        ApiResponse.success(result, "Users count fetched successfully", 200)
      );
  });

  static getAllUsersCountByChildrenId = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
      throw ApiError.badRequest("userId is required");
    }

    const result = await UserServices.getAllUsersCountByChildrenId(userId);

    return res
      .status(200)
      .json(
        ApiResponse.success(result, "Children count fetched successfully", 200)
      );
  });

  static deactivateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const deactivatedBy = req.user?.id;
    const { reason } = req.body;

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

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "User deactivated successfully",
            200
          )
        );
    } catch (error) {
      console.error("Controller error in deactivateUser:", error);
      throw error;
    }
  });

  static reactivateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const reactivatedBy = req.user?.id;
    const { reason } = req.body;

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

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "User reactivated successfully",
            200
          )
        );
    } catch (error) {
      console.error("Controller error in reactivateUser", error);
      throw error;
    }
  });

  static deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const deletedBy = req.user?.id;
    const { reason } = req.body;

    if (!deletedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!userId) {
      throw ApiError.badRequest("User ID is required");
    }

    try {
      const user = await UserServices.deleteUser(userId, deletedBy, reason);

      const safeUser = Helper.serializeUser(user);

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "User deleted successfully",
            200
          )
        );
    } catch (error) {
      console.error("Controller error in deleteUser:".error);
      throw error;
    }
  });
}

export default UserController;
