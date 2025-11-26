import RootApiIntegrationService from "../services/root/apiIntigration.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/AsyncHandler.js";

export class ApiIntegrationController {
  static getAllApiIntegrations = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { status, page, limit, sort, search } = req.query;

    let result;

    if (currentUser.role === "ROOT") {
      result = await RootApiIntegrationService.getAllApiIntegrations(
        currentUser,
        {
          status,
          page,
          limit,
          sort,
          search,
        }
      );
    } else {
      throw ApiError.unauthorized(
        "Only Root users can access API integrations"
      );
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          "API integrations fetched successfully",
          200
        )
      );
  });

  static getApiIntegrationById = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;

    let integration;

    if (currentUser.role === "ROOT") {
      integration = await RootApiIntegrationService.getApiIntegrationById(
        parseInt(id),
        currentUser
      );
    } else {
      throw ApiError.unauthorized(
        "Only Root users can access API integration details"
      );
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          integration,
          "API integration fetched successfully",
          200
        )
      );
  });

  static createApiIntegration = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const payload = req.body;

    let result;

    if (currentUser.role === "ROOT") {
      result = await RootApiIntegrationService.createApiIntegration(
        currentUser,
        payload
      );
    } else {
      throw ApiError.unauthorized(
        "Only Root users can create API integrations"
      );
    }

    return res
      .status(201)
      .json(
        ApiResponse.success(result, "API integration created successfully", 201)
      );
  });

  static updateApiIntegration = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;
    const payload = req.body;

    let result;

    if (currentUser.role === "ROOT") {
      result = await RootApiIntegrationService.updateApiIntegration(
        parseInt(id),
        currentUser,
        payload
      );
    } else {
      throw ApiError.unauthorized(
        "Only Root users can update API integrations"
      );
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(result, "API integration updated successfully", 200)
      );
  });

  static activateApiIntegration = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;

    let result;

    if (currentUser.role === "ROOT") {
      result = await RootApiIntegrationService.toggleApiIntegrationStatus(
        parseInt(id),
        currentUser,
        true
      );
    } else {
      throw ApiError.unauthorized(
        "Only Root users can activate API integrations"
      );
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          "API integration activated successfully",
          200
        )
      );
  });

  static deactivateApiIntegration = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;

    let result;

    if (currentUser.role === "ROOT") {
      result = await RootApiIntegrationService.toggleApiIntegrationStatus(
        parseInt(id),
        currentUser,
        false
      );
    } else {
      throw ApiError.unauthorized(
        "Only Root users can deactivate API integrations"
      );
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          "API integration deactivated successfully",
          200
        )
      );
  });
}

export default ApiIntegrationController;
