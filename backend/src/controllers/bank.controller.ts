import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { BankDetailService } from "../services/bank.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import type { BankDetailInputVerify } from "../types/bank.types.js";


// ===================== USER BANK CONTROLLER =====================

export class AddBankController {
  static index = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId || !role)
      throw ApiError.unauthorized("User not authenticated or role missing");

    const { search, status, page = "1", limit = "10", sort = "desc" } = req.body;

    const sortOrder = sort === "asc" ? "asc" : "desc";

    const params = {
      userId,
      role: role as "ADMIN" | "STATE HEAD" | "MASTER DISTRIBUTOR" | "DISTRIBUTOR",
      page: Number(page),
      limit: Number(limit),
      sort: sortOrder as "asc" | "desc",
      status,
      search
    };

    const data = await BankDetailService.index(params);

    return res
      .status(200)
      .json(ApiResponse.success(data, "Bank details fetched successfully", 200));
  });

  static getAllMyBanks = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const data = await BankDetailService.getAllMy(userId);

    return res
      .status(200)
      .json(ApiResponse.success(data, "All bank details fetched successfully", 200));
  });

  static show = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    console.log("req.params", req.params)
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

  static verify = asyncHandler(async (req: Request, res: Response) => {

    const { id, status, bankRejectionReason } = req.body as BankDetailInputVerify & { id?: string };
    const userId = req.user?.id;

    if (!id) throw ApiError.badRequest("Bank ID is required");
    if (!userId) throw ApiError.unauthorized("User not authenticated");

    const updatedBank = await BankDetailService.verification(id, userId, {
      status,
      bankRejectionReason: bankRejectionReason ?? null,
    });

    return res.status(200).json(
      ApiResponse.success(updatedBank, "Bank verification updated successfully",)
    );
  });
}

export default { AddBankController };
