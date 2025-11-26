import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/AsyncHandler.js";

// serviceProvider.controller.js
export class ServiceProviderController {
  // Assign Services - Handles both Single and Bulk
  static assignServices = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const payload = req.body;

    const isBulk = Array.isArray(payload);
    let result;

    if (currentUser.role === "ROOT") {
      result = await RootServiceService.assignServices(currentUser, payload);
    } else if (currentUser.role === "ADMIN") {
      result = await AdminServiceService.assignServices(currentUser, payload);
    } else if (currentUser.userType === "EMPLOYEE") {
      // Employee ke andar hi check karo creator kya hai
      result = await EmployeeServiceService.assignServices(
        currentUser,
        payload
      );
    } else {
      throw ApiError.unauthorized("Invalid role for service assignment");
    }

    const message = isBulk
      ? `Services assigned successfully (${result.successful.length} successful, ${result.failed.length} failed)`
      : "Service assigned successfully";

    return res.status(201).json(ApiResponse.success(result, message, 201));
  });

  // Update Service Status - Handles both Single and Bulk
  static updateServiceStatus = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;
    const { status, serviceIds } = req.body;

    const serviceIdentifier = id ? id : serviceIds || [];
    const isBulk = Array.isArray(serviceIdentifier);
    let result;

    if (currentUser.role === "ROOT") {
      result = await RootServiceService.updateServiceStatus(
        currentUser,
        serviceIdentifier,
        status
      );
    } else if (currentUser.role === "ADMIN") {
      result = await AdminServiceService.updateServiceStatus(
        currentUser,
        serviceIdentifier,
        status
      );
    } else if (currentUser.userType === "EMPLOYEE") {
      // Employee ke andar hi check karo creator kya hai
      result = await EmployeeServiceService.updateServiceStatus(
        currentUser,
        serviceIdentifier,
        status
      );
    } else {
      throw ApiError.unauthorized("Invalid role for service status update");
    }

    const message = isBulk
      ? `${result.successful.length} services ${status.toLowerCase()} successfully, ${result.failed.length} failed`
      : `Service ${status.toLowerCase()} successfully`;

    return res.status(200).json(ApiResponse.success(result, message, 200));
  });

  // Delete Services - Handles both Single and Bulk
  static deleteServices = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;
    const { serviceIds } = req.body;

    const serviceIdentifier = id ? id : serviceIds || [];
    const isBulk = Array.isArray(serviceIdentifier);
    let result;

    if (currentUser.role === "ROOT") {
      result = await RootServiceService.deleteServices(
        currentUser,
        serviceIdentifier
      );
    } else if (currentUser.role === "ADMIN") {
      result = await AdminServiceService.deleteServices(
        currentUser,
        serviceIdentifier
      );
    } else if (currentUser.userType === "EMPLOYEE") {
      // Employee ke andar hi check karo creator kya hai
      result = await EmployeeServiceService.deleteServices(
        currentUser,
        serviceIdentifier
      );
    } else {
      throw ApiError.unauthorized("Invalid role for service deletion");
    }

    const message = isBulk
      ? `${result.successful.length} services deleted successfully, ${result.failed.length} failed`
      : "Service deleted successfully";

    return res.status(200).json(ApiResponse.success(result, message, 200));
  });
}
