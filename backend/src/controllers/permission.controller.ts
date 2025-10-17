import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  RolePermissionService,
  UserPermissionService,
} from "../services/permission.service.js";

export class RolePermissionController {
  static createOrUpdate = asyncHandler(async (req: Request, res: Response) => {
    const permission = await RolePermissionService.createOrUpdateRolePermission(
      req.body
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          permission,
          "Role Permission saved successfully",
          200
        )
      );
  });

  static getByRole = asyncHandler(async (req: Request, res: Response) => {
    const { roleId } = req.params;
    const data = await RolePermissionService.getRolePermissions(
      roleId as string
    );
    return res
      .status(200)
      .json(ApiResponse.success(data, "Fetched successfully", 200));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { roleId, serviceId } = req.params;
    await RolePermissionService.deleteRolePermission(
      roleId as string,
      serviceId as string
    );
    return res
      .status(200)
      .json(ApiResponse.success({}, "Deleted successfully", 200));
  });
}

export class UserPermissionController {
  static createOrUpdate = asyncHandler(async (req: Request, res: Response) => {
    const permission = await UserPermissionService.createOrUpdateUserPermission(
      req.body
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          permission,
          "User Permission saved successfully",
          200
        )
      );
  });

  static getByUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const data = await UserPermissionService.getUserPermissions(
      userId as string
    );

    return res
      .status(200)
      .json(ApiResponse.success(data, "Fetched successfully", 200));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { userId, serviceId } = req.params;
    await UserPermissionService.deleteUserPermission(
      userId as string,
      serviceId as string
    );
    return res
      .status(200)
      .json(ApiResponse.success({}, "Deleted successfully", 200));
  });
}
