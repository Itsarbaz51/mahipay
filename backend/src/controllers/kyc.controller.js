import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/AsyncHandler.js";
import RootKycService from "../services/root/kyc.service.js";
import AdminKycService from "../services/admin/kyc.service.js";
import EmployeeKycService from "../services/employee/kyc.service.js";

export class KycController {
  static getAllKyc = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { status, page, limit, sort, search } = req.query;

    let result;

    if (currentUser.role === "ROOT") {
      result = await RootKycService.getAllKyc(currentUser, {
        status,
        page,
        limit,
        sort,
        search,
      });
    } else if (currentUser.userType === "BUSINESS") {
      result = await AdminKycService.getAllKyc(currentUser, {
        status,
        page,
        limit,
        sort,
        search,
      });
    } else if (
      currentUser.userType === "EMPLOYEE" &&
      (currentUser.creator === "ROOT" || currentUser.creator === "ADMIN")
    ) {
      result = await EmployeeKycService.getAllKyc(currentUser, {
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
          "KYC applications fetched successfully",
          200
        )
      );
  });

  static getKycById = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;

    let kyc;

    if (currentUser.role === "ROOT") {
      kyc = await RootKycService.getKycById(id, currentUser);
    } else if (currentUser.role === "ADMIN") {
      kyc = await AdminKycService.getKycById(id, currentUser);
    } else if (
      currentUser.userType === "EMPLOYEE" &&
      (currentUser.creator === "ROOT" || currentUser.creator === "ADMIN")
    ) {
      kyc = await EmployeeKycService.getKycById(id, currentUser);
    } else {
      throw ApiError.unauthorized("Invalid role");
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(kyc, "KYC application fetched successfully", 200)
      );
  });

  static createKyc = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const payload = {
      ...req.body,
      files: req.files,
    };

    let result;

    if (currentUser.userType === "BUSINESS") {
      result = await AdminKycService.createKyc(currentUser, payload);
    } else {
      throw ApiError.unauthorized("Invalid role");
    }

    return res
      .status(201)
      .json(
        ApiResponse.success(
          result,
          "KYC application submitted successfully",
          201
        )
      );
  });

  static updateKyc = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { id } = req.params;
    const payload = {
      ...req.body,
      files: req.files,
    };

    let result;
    if (currentUser.userType === "BUSINESS") {
      result = await AdminKycService.updateKyc(id, currentUser, payload);
    } else {
      throw ApiError.unauthorized("Invalid role");
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(result, "KYC application updated successfully", 200)
      );
  });

  static verifyKyc = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const payload = req.body;

    let result;

    if (currentUser.role === "ROOT") {
      result = await RootKycService.verifyKyc(currentUser, payload);
    } else if (currentUser.role === "ADMIN") {
      result = await AdminKycService.verifyKyc(currentUser, payload);
    } else if (
      currentUser.userType === "EMPLOYEE" &&
      (currentUser.creator === "ADMIN" || currentUser.creator === "ROOT")
    ) {
      result = await EmployeeKycService.verifyKyc(currentUser, payload);
    } else {
      throw ApiError.unauthorized("Only Root and Admin can verify KYC");
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          `KYC ${payload.status.toLowerCase()} successfully`,
          200
        )
      );
  });
}

export default KycController;
