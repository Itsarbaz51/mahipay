import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  RolePermissionService,
  UserPermissionService,
} from "../services/permission.service.js";
import { ApiError } from "../utils/ApiError.js";

export class RolePermissionController {
  static createOrUpdate = asyncHandler(async (req: Request, res: Response) => {
    const permissions =
      await RolePermissionService.createOrUpdateRolePermission(req.body);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          permissions,
          "Role Permissions saved successfully",
          200
        )
      );
  });

  static getByRole = asyncHandler(async (req: Request, res: Response) => {
    const roleId = req.params.id;
    if (!roleId) throw ApiError.badRequest("role id is required");

    const data = await RolePermissionService.getRolePermissions(roleId);
    return res
      .status(200)
      .json(ApiResponse.success(data, "Permissions fetched successfully", 200));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { roleId, serviceId } = req.params;
    if (!serviceId) throw ApiError.badRequest("service id is required");
    if (!roleId) throw ApiError.badRequest("role id is required");

    await RolePermissionService.deleteRolePermission(roleId, serviceId);
    return res
      .status(200)
      .json(ApiResponse.success({}, "Permission deleted successfully", 200));
  });
}

export class UserPermissionController {
  static createOrUpdate = asyncHandler(async (req: Request, res: Response) => {
    const permissions =
      await UserPermissionService.createOrUpdateUserPermission(req.body);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          permissions,
          "User Permissions saved successfully",
          200
        )
      );
  });

  static getByUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) throw ApiError.badRequest("User id is required");

    const data = await UserPermissionService.getUserPermissions(userId);

    return res
      .status(200)
      .json(ApiResponse.success(data, "Permissions fetched successfully", 200));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { userId, serviceId } = req.params;

    if (!userId) throw ApiError.badRequest("User id is required");
    if (!serviceId) throw ApiError.badRequest("service id is required");

    await UserPermissionService.deleteUserPermission(userId, serviceId);
    return res
      .status(200)
      .json(ApiResponse.success({}, "Permission deleted successfully", 200));
  });
}
