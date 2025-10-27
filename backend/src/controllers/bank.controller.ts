import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { BankDetailService } from "../services/bank.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// ===================== USER BANK CONTROLLER =====================

export class AddBankController {
  static index = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { isVerified, page = "1", limit = "10", sort = "desc" } = req.body;

    const params: {
      userId: string;
      isVerified?: boolean;
      page?: number;
      limit?: number;
      sort?: string;
    } = {
      userId,
      page: Number(page),
      limit: Number(limit),
      sort: sort as string,
    };

    if (typeof isVerified === "boolean") {
      params.isVerified = isVerified;
    }

    const data = await BankDetailService.index(params);

    return res
      .status(200)
      .json(
        ApiResponse.success(data, "Bank details fetched successfully", 200)
      );
  });

  static show = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { id } = req.params;
    if (!id) throw ApiError.badRequest("ID missing");

    const data = await BankDetailService.show(id, userId);
    return res
      .status(200)
      .json(ApiResponse.success(data, "Bank detail fetched successfully", 200));
  });

  static store = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const file = req.file as Express.Multer.File | undefined;

    const data = await BankDetailService.store({
      ...req.body,
      bankProofFile: file,
      userId,
    });

    return res
      .status(201)
      .json(ApiResponse.success(data, "Bank detail added successfully", 201));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { id } = req.params;
    if (!id) throw ApiError.badRequest("ID missing");

    if (!id) throw ApiError.internal("Bank detail ID is required");

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const data = await BankDetailService.update(id, userId, {
      ...req.body,
      bankProofFile: files?.bankProofFile?.[0],
    });

    return res
      .status(200)
      .json(ApiResponse.success(data, "Bank detail updated successfully", 200));
  });

  static destroy = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { id } = req.params;
    if (!id) throw ApiError.badRequest("ID missing");

    if (!id) throw ApiError.internal("Bank detail ID is required");

    const result = await BankDetailService.destroy(id, userId);
    return res
      .status(200)
      .json(
        ApiResponse.success(result, "Bank detail deleted successfully", 200)
      );
  });
}

export default { AddBankController };
