import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  ProviderCredentialService,
  ProviderRateCardService,
  ServiceProviderService,
  ServiceService,
} from "../services/service.service.js";
import Helper from "../utils/helper.js";

export class ServiceController {
  // Create new service
  static create = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.create(req.body);

    return res
      .status(201)
      .json(
        ApiResponse.success(
          service,
          `${service.name} Service created successfully`,
          201
        )
      );
  });

  // Get all services
  static getAll = asyncHandler(async (_req: Request, res: Response) => {
    const services = await ServiceService.getAll();
    return res
      .status(200)
      .json(
        ApiResponse.success(services, "Services fetched successfully", 200)
      );
  });

  // Get service by ID
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.getById(req.params.id as string);
    return res
      .status(200)
      .json(ApiResponse.success(service, "Service fetched successfully", 200));
  });

  // Update service
  static update = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.update(
      req.params.id as string,
      req.body
    );
    return res
      .status(200)
      .json(ApiResponse.success(service, "Service updated successfully", 200));
  });

  // Deactivate service
  static deactivate = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.deactivate(
      req.params.id as string,
      req.body
    );
    return res
      .status(200)
      .json(
        ApiResponse.success(service, "Service deactivated successfully", 200)
      );
  });
}

export class ServiceProviderController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const provider = await ServiceProviderService.create(req.body);
    return res
      .status(201)
      .json(
        ApiResponse.success(
          provider,
          "Service Provider created successfully",
          201
        )
      );
  });

  static list = asyncHandler(async (_req: Request, res: Response) => {
    const providers = await ServiceProviderService.list();
    return res
      .status(200)
      .json(
        ApiResponse.success(
          providers,
          "Service providers fetched successfully",
          200
        )
      );
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("Service Provider ID is required");

    const provider = await ServiceProviderService.getById(id);
    if (!provider) throw ApiError.notFound("Service Provider not found");
    return res
      .status(200)
      .json(
        ApiResponse.success(
          provider,
          "Service provider fetched successfully",
          200
        )
      );
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("Service Provider ID is required");

    const provider = await ServiceProviderService.update(id, req.body);
    return res
      .status(200)
      .json(
        ApiResponse.success(
          provider,
          "Service Provider updated successfully",
          200
        )
      );
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("Service Provider ID is required");

    await ServiceProviderService.delete(id);
    return res
      .status(200)
      .json(
        ApiResponse.success(null, "Service Provider deleted successfully", 200)
      );
  });
}

export class ProviderRateCardController {
  static createOrUpdate = asyncHandler(async (req: Request, res: Response) => {
    const data = await ProviderRateCardService.createOrUpdate(req.body);

    const safeData = Helper.serializeUser(data);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          safeData,
          "Provider rate card created/updated successfully",
          200
        )
      );
  });

  static list = asyncHandler(async (_req: Request, res: Response) => {
    const list = await ProviderRateCardService.list();

    const safeList = Helper.serializeUser(list);

    return res
      .status(200)
      .json(
        ApiResponse.success(safeList, "Rate cards fetched successfully", 200)
      );
  });

  static getByProvider = asyncHandler(async (req: Request, res: Response) => {
    const { providerId } = req.params;

    if (!providerId) {
      throw ApiError.badRequest("providerId is required");
    }

    const list = await ProviderRateCardService.getByProvider(providerId);

    const safeList = Helper.serializeUser(list);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          safeList,
          "Provider rate cards fetched successfully",
          200
        )
      );
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("Rate card ID is required");

    const rateCard = await ProviderRateCardService.getById(id);

    const safeRateCard = Helper.serializeUser(rateCard);

    return res
      .status(200)
      .json(
        ApiResponse.success(safeRateCard, "Rate card fetched successfully", 200)
      );
  });
}

export class ProviderCredentialController {
  static upsert = asyncHandler(async (req: Request, res: Response) => {
    const data = await ProviderCredentialService.upsertCredential(req.body);
    return res
      .status(200)
      .json(
        ApiResponse.success(data, "Provider credential saved successfully", 200)
      );
  });

  static list = asyncHandler(async (_req: Request, res: Response) => {
    const creds = await ProviderCredentialService.list();
    return res
      .status(200)
      .json(
        ApiResponse.success(
          creds,
          "Provider credentials fetched successfully",
          200
        )
      );
  });

  static getByProvider = asyncHandler(async (req: Request, res: Response) => {
    const providerId = req.params.providerId;
    if (!providerId) throw ApiError.badRequest("providerId is required");

    const creds = await ProviderCredentialService.getByProvider(providerId);
    return res
      .status(200)
      .json(
        ApiResponse.success(
          creds,
          "Provider credentials fetched successfully",
          200
        )
      );
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw ApiError.badRequest("Credential ID is required");

    const credential = await ProviderCredentialService.getById(id);
    return res
      .status(200)
      .json(
        ApiResponse.success(credential, "Credential fetched successfully", 200)
      );
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) throw ApiError.badRequest("Credential ID is required");

    const deleted = await ProviderCredentialService.delete(id);
    return res
      .status(200)
      .json(
        ApiResponse.success(deleted, "Credential deleted successfully", 200)
      );
  });
}
