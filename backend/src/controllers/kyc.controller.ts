import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import KycServices from "../services/kyc.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

class UserKycController {
  static index = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw ApiError.internal("User ID not found in request");
    }

    const { status, page = 1, limit = 10, sort = "desc" } = req.body;

    const allKyc = await KycServices.indexUserKyc({
      userId,
      status,
      page,
      limit,
      sort,
    });

    return res
      .status(200)
      .json(
        ApiResponse.success(allKyc, "User KYC list fetched successfully", 200)
      );
  });

  static show = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest("KYC ID is required");
    }

    const kycData = await KycServices.showUserKyc(userId, id);

    return res
      .status(200)
      .json(ApiResponse.success(kycData, "User KYC fetched successfully", 201));
  });

  static store = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const files = req.files as {
      panFile?: Express.Multer.File[];
      aadhaarFile?: Express.Multer.File[];
      addressProofFile?: Express.Multer.File[];
      photo?: Express.Multer.File[];
    };

    const panFile = files.panFile?.[0];
    const aadhaarFile = files.aadhaarFile?.[0];
    const addressProofFile = files.addressProofFile?.[0];
    const photo = files.photo?.[0];

    if (!panFile || !aadhaarFile || !addressProofFile || !photo) {
      throw ApiError.badRequest(
        "All KYC files are required (PAN, Aadhaar, Address Proof, Photo)."
      );
    }

    const dbStoreData = await KycServices.storeUserKyc({
      ...req.body,
      panFile,
      aadhaarFile,
      addressProofFile,
      photo,
      userId,
    });

    return res
      .status(201)
      .json(
        ApiResponse.success(
          dbStoreData,
          "User KYC submitted, waiting for approval",
          201
        )
      );
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { id } = req.params;
    if (!id) throw ApiError.badRequest("KYC ID is required in params");

    const files = req.files as {
      panFile?: Express.Multer.File[];
      aadhaarFile?: Express.Multer.File[];
      addressProofFile?: Express.Multer.File[];
      photo?: Express.Multer.File[];
    };

    const panFile = files.panFile?.[0];
    const aadhaarFile = files.aadhaarFile?.[0];
    const addressProofFile = files.addressProofFile?.[0];
    const photo = files.photo?.[0];

    const updateData: any = {
      ...req.body,
      userId,
    };

    if (panFile) updateData.panFile = panFile;
    if (aadhaarFile) updateData.aadhaarFile = aadhaarFile;
    if (addressProofFile) updateData.addressProofFile = addressProofFile;
    if (photo) updateData.photo = photo;

    const dbUpdateData = await KycServices.updateUserKyc(id, updateData);

    return res
      .status(200)
      .json(
        ApiResponse.success(dbUpdateData, "User KYC updated successfully", 200)
      );
  });

  static verification = asyncHandler(async (req: Request, res: Response) => {
    const dbStoreData = await KycServices.verifyUserKyc(req.body);

    return res
      .status(200)
      .json(
        ApiResponse.success(dbStoreData, "User KYC verified successfully", 200)
      );
  });
}


export { UserKycController };
