import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { ServiceProviderService } from "../services/service.service.js";

export class ServiceProviderController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const serviceProvider = await ServiceProviderService.create({
      ...req.body,
      createdBy: userId,
    });

    return res
      .status(201)
      .json(
        ApiResponse.success(
          serviceProvider,
          `Service Provider created successfully`,
          201
        )
      );
  });

  static getAllByCreatedUser = asyncHandler(
    async (req: Request, res: Response) => {
      const userId = req.user?.id;

      if (!userId) {
        throw ApiError.unauthorized("User not authenticated");
      }

      const serviceProviders =
        await ServiceProviderService.getAllByCreatedUser(userId);
      return res
        .status(200)
        .json(
          ApiResponse.success(
            serviceProviders,
            "Service Providers fetched successfully",
            200
          )
        );
    }
  );

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("Service Provider ID is required");

    const serviceProvider = await ServiceProviderService.getById(id);
    return res
      .status(200)
      .json(
        ApiResponse.success(
          serviceProvider,
          "Service Provider fetched successfully",
          200
        )
      );
  });

  static toggleActiveStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { isActive } = req.body;

      if (!id) throw ApiError.badRequest("Service Provider ID is required");
      if (typeof isActive !== "boolean")
        throw ApiError.badRequest("isActive must be a boolean");

      const serviceProvider = await ServiceProviderService.toggleActiveStatus(
        id,
        isActive
      );

      const statusMessage = isActive ? "activated" : "deactivated";
      return res
        .status(200)
        .json(
          ApiResponse.success(
            serviceProvider,
            `Service Provider ${statusMessage} successfully`,
            200
          )
        );
    }
  );

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("Service Provider ID is required");

    const result = await ServiceProviderService.delete(id);
    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          "Service Provider deleted successfully",
          200
        )
      );
  });
}
