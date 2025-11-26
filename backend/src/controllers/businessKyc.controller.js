import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/AsyncHandler.js";
import AdminBusinessKycService from "../services/admin/businessKyc.service.js";
import EmployeeBusinessKycService from "../services/employee/businessKyc.service.js";
import RootBusinessKycService from "../services/root/businessKyc.service.js";

export class BusinessKycController {
  static getAllBusinessKyc = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { status, page, limit, sort, search } = req.query;

    let result;

    if (currentUser.role === "ROOT") {
      result = await RootBusinessKycService.getAllBusinessKyc(currentUser, {
        status,
        page,
        limit,
        sort,
        search,
      });
    } else if (
      currentUser.userType === "EMPLOYEE" &&
      currentUser.creator === "ROOT"
    ) {
      result = await EmployeeBusinessKycService.getAllBusinessKyc(currentUser, {
        status,
        page,
        limit,
        sort,
        search,
      });
    } else {
      throw ApiError.unauthorized("Invalid role");
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          "Business KYC applications fetched successfully",
          200
        )
      );
  });

  static getBusinessKycById = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;

    let businessKyc;

    if (currentUser.role === "ROOT") {
      businessKyc = await RootBusinessKycService.getBusinessKycById(
        id,
        currentUser
      );
    } else if (currentUser.role === "ADMIN") {
      businessKyc = await AdminBusinessKycService.getBusinessKycById(
        id,
        currentUser
      );
    } else if (
      currentUser.userType === "EMPLOYEE" &&
      currentUser.creator === "ROOT"
    ) {
      businessKyc = await EmployeeBusinessKycService.getBusinessKycById(
        id,
        currentUser
      );
    } else {
      throw ApiError.unauthorized("Invalid role");
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          businessKyc,
          "Business KYC application fetched successfully",
          200
        )
      );
  });

  static createBusinessKyc = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const payload = {
      ...req.body,
      files: req.files,
    };

    let result;

    if (currentUser.role === "ADMIN") {
      result = await AdminBusinessKycService.createBusinessKyc(
        currentUser,
        payload
      );
    } else {
      throw ApiError.unauthorized("Only Admin can create Business KYC");
    }

    return res
      .status(201)
      .json(
        ApiResponse.success(
          result,
          "Business KYC application submitted successfully",
          201
        )
      );
  });

  static updateBusinessKyc = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;
    const payload = {
      ...req.body,
      files: req.files,
    };

    let result;

    if (currentUser.role === "ADMIN") {
      result = await AdminBusinessKycService.updateBusinessKyc(
        id,
        currentUser,
        payload
      );
    } else {
      throw ApiError.unauthorized("Only Admin can create Business KYC");
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          "Business KYC application updated successfully",
          200
        )
      );
  });

  static verifyBusinessKyc = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const payload = req.body;

    let result;

    if (currentUser.role === "ROOT") {
      result = await RootBusinessKycService.verifyBusinessKyc(
        currentUser,
        payload
      );
    } else if (
      currentUser.userType === "EMPLOYEE" &&
      currentUser.creator === "ROOT"
    ) {
      result = await EmployeeBusinessKycService.verifyBusinessKyc(
        currentUser,
        payload
      );
    } else {
      throw ApiError.unauthorized("Only Root can verify Business KYC");
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          `Business KYC ${payload.status.toLowerCase()} successfully`,
          200
        )
      );
  });
}

export default BusinessKycController;
