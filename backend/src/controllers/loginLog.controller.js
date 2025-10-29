import asyncHandler from "../utils/AsyncHandler.js";
import LoginLogService from "../services/loginLog.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

class LoginLogController {
  private static loginLogService = new LoginLogService();

  static index = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const { status, page, limit, sort, search } = req.body

    const result = await LoginLogController.loginLogService.getAllLoginLogs({
      userId,
      status,
      page,
      limit,
      sort,
      search,
    });

    if (!result) {
      throw ApiError.notFound("No login logs found");
    }

    return res
      .status(200)
      .json(ApiResponse.success(result, "Login logs fetched successfully", 200));
  });

  static show = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest("Login log ID is required");
    }

    const loginLog = await LoginLogController.loginLogService.getLoginLogById(id);

    if (!loginLog) {
      throw ApiError.notFound("Login log not found");
    }

    res.status(200).json(ApiResponse.success(loginLog, "Login log fetched successfully", 200));
  });

  static store = asyncHandler(async (req, res) => {
    const loginLog = await LoginLogController.loginLogService.createLoginLog(req.body);

    if (!loginLog) {
      throw ApiError.internal("Failed to create login log");
    }


    res.status(201).json(ApiResponse.success(loginLog, "Login log created successfully", 201));
  });

  static destroy = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest("Login log ID is required");
    }

    const existingLog = await LoginLogController.loginLogService.getLoginLogById(id);

    if (!existingLog) {
      throw ApiError.notFound("Login log not found");
    }

    const result = await LoginLogController.loginLogService.deleteLoginLog(id);

    if (!result) {
      throw ApiError.internal("Failed to delete login log");
    }

    res.status(200).json(ApiResponse.success(result, "Login log deleted successfully", 200));

  });
}

export default LoginLogController;