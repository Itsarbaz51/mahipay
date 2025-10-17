import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import RoleServices from "../services/role.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

class RoleController {
  static index = asyncHandler(async (req: Request, res: Response) => {
    const userRoleLevel = req?.user?.roleLevel;

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

  static show = asyncHandler(async (req: Request, res: Response) => {
    const userRole = req?.user?.role;
    const roleId = req.params.id;

    if (!roleId) {
      throw ApiError.badRequest("Role ID is required");
    }

    if (userRole !== "SUPER ADMIN") {
      throw ApiError.forbidden("Insufficient permissions");
    }

    const role = await RoleServices.show(roleId);

    if (!role) {
      throw ApiError.notFound("Role not found");
    }

    return res
      .status(200)
      .json(ApiResponse.success(role, "Role fetched successfully", 200));
  });

  static store = asyncHandler(async (req: Request, res: Response) => {
    const createdBy = req?.user?.id;
    const userRole = req?.user?.role;

    if (!createdBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (userRole !== "ADMIN") {
      throw ApiError.forbidden("Insufficient permissions");
    }

    const role = await RoleServices.store({
      ...req.body,
      createdBy,
    });

    if (!role) {
      throw ApiError.internal("Failed to create role");
    }

    return res
      .status(201)
      .json(ApiResponse.success(role, "Role created successfully", 201));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const updatedBy = req?.user?.id;
    const userRole = req?.user?.role;
    const roleId = req.params.id;

    if (!updatedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!roleId) {
      throw ApiError.badRequest("Role ID is required");
    }

    if (userRole !== "ADMIN") {
      throw ApiError.forbidden("Insufficient permissions");
    }

    const role = await RoleServices.update(roleId, {
      ...req.body,
      updatedBy,
    });

    if (!role) {
      throw ApiError.notFound("Role not found or update failed");
    }

    return res
      .status(200)
      .json(ApiResponse.success(role, "Role updated successfully", 200));
  });

  static destroy = asyncHandler(async (req: Request, res: Response) => {
    const userRole = req?.user?.role;
    const roleId = req.params.id;

    if (!roleId) {
      throw ApiError.badRequest("Role ID is required");
    }

    if (userRole !== "ADMIN") {
      throw ApiError.forbidden("Insufficient permissions");
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
