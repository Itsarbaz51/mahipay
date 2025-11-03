import { ServiceProviderService } from "../services/service.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/AsyncHandler.js";

class ServiceProviderController {
  static create = asyncHandler(async (req, res) => {
    const user = req.user.id;

    if (!user) {
      throw ApiError.badRequest("Please login before creating a service");
    }

    const iconFile = req.file;

    if (iconFile) {
      if (iconFile.size > 5 * 1024 * 1024) {
        throw ApiError.badRequest("Icon file size must be less than 5 MB");
      }

      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedMimeTypes.includes(iconFile.mimetype)) {
        throw ApiError.badRequest("Icon file must be an image (jpeg/png/webp)");
      }
    }

    const serviceProvider = await ServiceProviderService.create(req.body, {
      icon: [iconFile],
    });

    return res
      .status(201)
      .json(
        ApiResponse.success(
          serviceProvider,
          `Service Provider ${serviceProvider.code} created successfully`,
          201
        )
      );
  });

  // Get all services (ADMIN only) or user assigned services
  static getAll = asyncHandler(async (req, res) => {
    const user = req.user;
    let serviceProviders;

    if (user.role === "ADMIN") {
      // ADMIN can see all services
      serviceProviders = await ServiceProviderService.getAll();
    } else {
      // Regular users can only see assigned services
      serviceProviders = await ServiceProviderService.getUserServices(user.id);
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          serviceProviders,
          "Service Providers fetched successfully",
          200
        )
      );
  });

  // Get active services (ADMIN sees all active, users see assigned active)
  static getAllActive = asyncHandler(async (req, res) => {
    const user = req.user;
    let serviceProviders;

    if (user.role === "ADMIN") {
      serviceProviders = await ServiceProviderService.getAllActive();
    } else {
      serviceProviders = await ServiceProviderService.getUserActiveServices(
        user.id
      );
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          serviceProviders,
          "Active Service Providers fetched successfully",
          200
        )
      );
  });

  static getById = asyncHandler(async (req, res) => {
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

  static toggleActiveStatus = asyncHandler(async (req, res) => {
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
  });

  static update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("Service Provider ID is required");

    const serviceProvider = await ServiceProviderService.update(id, req.body);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          serviceProvider,
          "Service Provider updated successfully",
          200
        )
      );
  });

  static delete = asyncHandler(async (req, res) => {
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

  // Service Credential Management
  static updateCredentials = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { credentials } = req.body;

    if (!id) throw ApiError.badRequest("Service Provider ID is required");
    if (!credentials) throw ApiError.badRequest("Credentials are required");

    const updatedService = await ServiceProviderService.updateCredentials(
      id,
      credentials
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          updatedService,
          "Service credentials updated successfully",
          200
        )
      );
  });

  static getCredentials = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("Service Provider ID is required");

    const credentials = await ServiceProviderService.getCredentials(id);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          credentials,
          "Service credentials fetched successfully",
          200
        )
      );
  });
}

export default ServiceProviderController;
