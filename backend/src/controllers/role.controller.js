import asyncHandler from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import RoleServices from "../services/role.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

class RoleController {
  static index = asyncHandler(async (req, res) => {
    const userRoleLevel = req.user?.roleLevel;

    const options = {
      ...(typeof userRoleLevel === "number" && {
        currentUserRoleLevel: userRoleLevel,
      }),
    };

    const roles = await RoleServices.index(options);

    return res
      .status(200)
      .json(ApiResponse.success(roles, "Roles fetched successfully", 200));
  });

  static show = asyncHandler(async (req, res) => {
    const userRoleLevel = req.user?.roleLevel;
    const roleId = req.params.id;

    if (!roleId) {
      throw ApiError.badRequest("Role ID is required");
    }

    const role = await RoleServices.show(roleId);

    if (!role) {
      throw ApiError.notFound("Role not found");
    }

    // Check if user has permission to view this role
    if (userRoleLevel && role.level <= userRoleLevel) {
      throw ApiError.forbidden("Insufficient permissions to view this role");
    }

    return res
      .status(200)
      .json(ApiResponse.success(role, "Role fetched successfully", 200));
  });

  static store = asyncHandler(async (req, res) => {
    const createdBy = req.user?.id;
    const userRoleLevel = req.user?.roleLevel;

    if (!createdBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (userRoleLevel === undefined) {
      throw ApiError.forbidden("Insufficient permissions");
    }

    // Check if user can create roles with the requested level
    const { level } = req.body;
    if (level !== undefined && level <= userRoleLevel) {
      throw ApiError.forbidden("Cannot create role with equal or lower level");
    }

    const role = await RoleServices.store({
      ...req.body,
      createdBy,
    });

    return res
      .status(201)
      .json(ApiResponse.success(role, "Role created successfully", 201));
  });

  static update = asyncHandler(async (req, res) => {
    const updatedBy = req.user?.id;
    const userRoleLevel = req.user?.roleLevel;
    const roleId = req.params.id;

    if (!updatedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!roleId) {
      throw ApiError.badRequest("Role ID is required");
    }

    if (userRoleLevel === undefined) {
      throw ApiError.forbidden("Insufficient permissions");
    }

    // Get the existing role to check its level
    const existingRole = await RoleServices.show(roleId);
    if (!existingRole) {
      throw ApiError.notFound("Role not found");
    }

    // Check if user can update this role
    if (existingRole.level <= userRoleLevel) {
      throw ApiError.forbidden("Cannot update role with equal or lower level");
    }

    // Check if trying to update level to invalid value
    const { level } = req.body;
    if (level !== undefined && level <= userRoleLevel) {
      throw ApiError.forbidden(
        "Cannot set role level to equal or lower than your own"
      );
    }

    const role = await RoleServices.update(roleId, {
      ...req.body,
      updatedBy,
    });

    return res
      .status(200)
      .json(ApiResponse.success(role, "Role updated successfully", 200));
  });

  static destroy = asyncHandler(async (req, res) => {
    const userRoleLevel = req.user?.roleLevel;
    const roleId = req.params.id;

    if (!roleId) {
      throw ApiError.badRequest("Role ID is required");
    }

    if (userRoleLevel === undefined) {
      throw ApiError.forbidden("Insufficient permissions");
    }

    // Get the existing role to check its level
    const existingRole = await RoleServices.show(roleId);
    if (!existingRole) {
      throw ApiError.notFound("Role not found");
    }

    // Check if user can delete this role
    if (existingRole.level <= userRoleLevel) {
      throw ApiError.forbidden("Cannot delete role with equal or lower level");
    }

    const result = await RoleServices.destroy(roleId);

    if (!result) {
      throw ApiError.notFound("Role not found or delete failed");
    }

    return res
      .status(200)
      .json(ApiResponse.success(null, "Role deleted successfully", 200));
  });
}

export default RoleController;
