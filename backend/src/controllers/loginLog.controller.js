import asyncHandler from "../utils/AsyncHandler.js";
import LoginLogService from "../services/loginLog.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

class LoginLogController {
  static loginLogService = new LoginLogService();

  static index = asyncHandler(async (req, res) => {
    console.log("=== ROUTE DEBUG: Request Body ===");
    console.log("Full body:", req.body);
    console.log("RoleId from body:", req.body.roleId);

    const payload = {
      page: req.body.page || 1,
      limit: req.body.limit || 10,
      userId: req.body.userId,
      roleId: req.body.roleId, // YEH LINE CHECK KAREN
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      search: req.body.search,
      deviceType: req.body.deviceType,
      browser: req.body.browser,
      os: req.body.os,
      sort: req.body.sort || "desc",
      sortBy: req.body.sortBy || "createdAt",
    };

    console.log("=== ROUTE DEBUG: Processed Payload ===");
    console.log("Payload with roleId:", payload.roleId);

    // Current user info from auth middleware
    const currentUser = {
      id: req.user.id,
      role: req.user.role,
    };

    const result = await LoginLogController.loginLogService.getAllLoginLogs(
      payload,
      currentUser
    );

    return res.status(200).json(result);
  });
  static show = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest("Login log ID is required");
    }

    // FIX: Use the static property
    const loginLog =
      await LoginLogController.loginLogService.getLoginLogById(id);

    if (!loginLog) {
      throw ApiError.notFound("Login log not found");
    }

    res
      .status(200)
      .json(
        ApiResponse.success(loginLog, "Login log fetched successfully", 200)
      );
  });

  static store = asyncHandler(async (req, res) => {
    // FIX: Use the static property
    const loginLog = await LoginLogController.loginLogService.createLoginLog(
      req.body
    );

    if (!loginLog) {
      throw ApiError.internal("Failed to create login log");
    }

    res
      .status(201)
      .json(
        ApiResponse.success(loginLog, "Login log created successfully", 201)
      );
  });

  static destroy = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest("Login log ID is required");
    }

    // FIX: Use the static property
    const existingLog =
      await LoginLogController.loginLogService.getLoginLogById(id);

    if (!existingLog) {
      throw ApiError.notFound("Login log not found");
    }

    // FIX: Use the static property
    const result = await LoginLogController.loginLogService.deleteLoginLog(id);

    if (!result) {
      throw ApiError.internal("Failed to delete login log");
    }

    res
      .status(200)
      .json(ApiResponse.success(result, "Login log deleted successfully", 200));
  });
}

export default LoginLogController;
