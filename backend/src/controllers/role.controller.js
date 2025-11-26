import asyncHandler from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import RootRoleService from "../services/root/role.service.js";
import AdminRoleService from "../services/admin/role.service.js";
import EmployeeRoleService from "../services/employee/role.service.js";

class RoleController {
  static getAllRoles = asyncHandler(async (req, res) => {
    const currentUser = req.user;

    let response;

    if (currentUser.userType === "root") {
      response = await RootRoleService.getAllRoles(currentUser);
    } else if (currentUser.userType === "business") {
      response = await AdminRoleService.getAllRoles(currentUser);
    } else if (
      currentUser.userType === "employee" &&
      (currentUser.creator === "business" || currentUser.creator === "root")
    ) {
      response = await EmployeeRoleService.getAllRoles(currentUser);
    } else {
      throw ApiError.forbidden("You are not authorized to access roles");
    }

    return res
      .status(200)
      .json(ApiResponse.success(response, "Roles fetched successfully", 200));
  });

  static upsertRole = asyncHandler(async (req, res) => {
    const currentUser = req.user;

    // Validate name for create operation
    if (!id && !name) {
      throw ApiError.badRequest("Role name is required for creation");
    }

    let response;

    if (currentUser.userType === "root") {
      response = await RootRoleService.upsertRole(currentUser);
    } else if (
      currentUser.userType === "employee" &&
      currentUser.creator === "root"
    ) {
      response = await EmployeeRoleService.upsertRole(currentUser);
    } else {
      throw ApiError.forbidden("You are not authorized to access roles");
    }

    const message =
      response.action === "created"
        ? "Role created successfully"
        : "Role updated successfully";

    const statusCode = response.action === "created" ? 201 : 200;

    return res
      .status(statusCode)
      .json(ApiResponse.success(response.role, message, statusCode));
  });

  static deleteRole = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const roleId = req.params.id;
    const { type } = req.body;

    if (!currentUser?.id) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!roleId) {
      throw ApiError.badRequest("Role ID is required");
    }

    if (!type || !["employee", "business"].includes(type)) {
      throw ApiError.badRequest(
        "Invalid type parameter. Must be 'employee' or 'business'"
      );
    }

    let response;

    if (currentUser.userType === "root") {
      response = await RootRoleService.deleteRole(currentUser);
    } else if (
      currentUser.userType === "employee" &&
      currentUser.creator === "root"
    ) {
      response = await EmployeeRoleService.deleteRole(currentUser);
    } else {
      throw ApiError.forbidden("You are not authorized to access roles");
    }

    if (!result.success) {
      throw ApiError.internal("Role deletion failed");
    }

    const message =
      type === "employee"
        ? "Employee role deleted successfully"
        : "Business role deleted successfully";

    return res.status(200).json(ApiResponse.success(null, message, 200));
  });
}

export default RoleController;
