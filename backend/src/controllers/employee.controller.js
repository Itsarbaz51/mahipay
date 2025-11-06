import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import EmployeeServices from "../services/employee.service.js";
import Helper from "../utils/helper.js";

class EmployeeController {
  // EMPLOYEE REGISTRATION
  static register = asyncHandler(async (req, res) => {
    const adminId = req.user?.id;

    if (!adminId) {
      throw ApiError.unauthorized("Admin authentication required");
    }

    const data = {
      ...req.body,
      permissions: req.body.permissions || [],
    };

    if (req.file) {
      data.profileImage = req.file.path;
    }

    const { user, accessToken } = await EmployeeServices.register({
      ...data,
      parentId: adminId,
    });

    if (!user || !accessToken) {
      throw ApiError.internal("Employee creation failed!");
    }

    const safeUser = Helper.serializeUser(user);

    return res.status(201).json(
      ApiResponse.success(
        {
          user: safeUser,
          accessToken,
          assignedPermissions: data.permissions,
        },
        `Employee created successfully with ${data.permissions.length} permissions`,
        201
      )
    );
  });

  // EMPLOYEE PROFILE UPDATE
  static updateProfile = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const currentUserId = req.user.id;

    if (!employeeId) {
      throw ApiError.unauthorized("Employe not found");
    }
    if (!currentUserId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const updateData = req.body;
    const user = await EmployeeServices.updateProfile(
      employeeId,
      updateData,
      currentUserId
    );

    const safeUser = Helper.serializeUser(user);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: safeUser },
          "Employee profile updated successfully",
          200
        )
      );
  });

  // EMPLOYEE PROFILE IMAGE UPDATE
  static updateProfileImage = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;

    if (!employeeId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!req.file) {
      throw ApiError.badRequest("Profile image is required");
    }

    const user = await EmployeeServices.updateProfileImage(
      employeeId,
      req.file.path
    );

    const safeUser = Helper.serializeUser(user);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: safeUser },
          "Employee profile image updated successfully",
          200
        )
      );
  });

  // GET EMPLOYEE BY ID
  static getEmployeeById = asyncHandler(async (req, res) => {
    const employeeId = req.params.employeeId;
    const currentUser = req.user;

    if (!employeeId) {
      throw ApiError.badRequest("Employee ID required");
    }

    const user = await EmployeeServices.getEmployeeById(
      employeeId,
      currentUser
    );

    const safeUser = Helper.serializeUser(user);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: safeUser },
          "Employee fetched successfully",
          200
        )
      );
  });

  // UPDATE EMPLOYEE PERMISSIONS
  static updatePermissions = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const adminId = req.user?.id;
    const { permissions } = req.body;

    if (!adminId) {
      throw ApiError.unauthorized("Admin authentication required");
    }

    if (!permissions || !Array.isArray(permissions)) {
      throw ApiError.badRequest("Permissions array is required");
    }

    const result = await EmployeeServices.updateEmployeePermissions(
      employeeId,
      permissions,
      adminId
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          `Employee permissions updated successfully. Added: ${result.added.length}, Removed: ${result.removed.length}`,
          200
        )
      );
  });

  // GET EMPLOYEE PERMISSIONS
  static getPermissions = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const permissions =
      await EmployeeServices.getEmployeePermissions(employeeId);

    return res.status(200).json(
      ApiResponse.success(
        {
          permissions,
          count: permissions.length,
        },
        "Employee permissions fetched successfully",
        200
      )
    );
  });

  // GET ALL EMPLOYEES BY PARENT ID
  static getAllEmployeesByParentId = asyncHandler(async (req, res) => {
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

    const allowedStatuses = ["ALL", "ACTIVE", "IN_ACTIVE", "DELETED"];
    const upperStatus = (status || "ALL").toUpperCase();

    const parsedStatus = allowedStatuses.includes(upperStatus)
      ? upperStatus
      : "ALL";

    const result = await EmployeeServices.getAllEmployeesByParentId(parentId, {
      page: parsedPage,
      limit: parsedLimit,
      sort: parsedSort,
      status: parsedStatus,
      search: search,
    });

    return res.status(200).json(
      ApiResponse.success(
        {
          users: result.users,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        "Employees fetched successfully",
        200
      )
    );
  });

  // DEACTIVATE EMPLOYEE
  static deactivateEmployee = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const deactivatedBy = req.user?.id;
    const { reason } = req.body;

    if (!deactivatedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!employeeId) {
      throw ApiError.badRequest("Employee ID is required");
    }

    try {
      const user = await EmployeeServices.deactivateEmployee(
        employeeId,
        deactivatedBy,
        reason
      );

      const safeUser = Helper.serializeUser(user);

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "Employee deactivated successfully",
            200
          )
        );
    } catch (error) {
      console.error("Controller error in deactivateEmployee:", error);
      throw error;
    }
  });

  // REACTIVATE EMPLOYEE
  static reactivateEmployee = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const reactivatedBy = req.user?.id;
    const { reason } = req.body;

    if (!reactivatedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!employeeId) {
      throw ApiError.badRequest("Employee ID is required");
    }

    try {
      const user = await EmployeeServices.reactivateEmployee(
        employeeId,
        reactivatedBy,
        reason
      );

      const safeUser = Helper.serializeUser(user);

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "Employee reactivated successfully",
            200
          )
        );
    } catch (error) {
      console.error("Controller error in reactivateEmployee", error);
      throw error;
    }
  });

  // DELETE EMPLOYEE
  static deleteEmployee = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const deletedBy = req.user?.id;
    const { reason } = req.body;

    if (!deletedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!employeeId) {
      throw ApiError.badRequest("Employee ID is required");
    }

    try {
      await EmployeeServices.deleteEmployee(employeeId, deletedBy, reason);

      return res
        .status(200)
        .json(
          ApiResponse.success(
            null,
            "Employee permanently deleted successfully",
            200
          )
        );
    } catch (error) {
      console.error("Controller error in deleteEmployee:", error);
      throw error;
    }
  });

  // CHECK SINGLE PERMISSION
  static checkPermission = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { permission } = req.body;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    if (!permission) {
      throw ApiError.badRequest("Permission is required");
    }

    const hasPermission = await EmployeeServices.checkPermission(
      userId,
      permission
    );

    return res.status(200).json(
      ApiResponse.success(
        {
          hasPermission,
          userId,
          permission,
        },
        "Permission check completed",
        200
      )
    );
  });

  // CHECK MULTIPLE PERMISSIONS
  static checkPermissions = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { permissions } = req.body;

    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    if (!permissions || !Array.isArray(permissions)) {
      throw ApiError.badRequest("Permissions array is required");
    }

    const result = await EmployeeServices.checkPermissions(userId, permissions);

    return res
      .status(200)
      .json(ApiResponse.success(result, "Permissions check completed", 200));
  });
}

export default EmployeeController;
