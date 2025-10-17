import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { WalletService } from "../services/wallet.service.js";
import { ApiError } from "../utils/ApiError.js";

export class WalletController {
  static getWallet = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      throw ApiError.badRequest("User ID is required");
    }

    const wallet = await WalletService.getWalletByUserId(userId);

    return res
      .status(200)
      .json(ApiResponse.success(wallet, "Wallet fetched successfully", 200));
  });

  static creditWallet = asyncHandler(async (req: Request, res: Response) => {
    const { userId, amount, narration } = req.body;
    const idempotencyKey = req.idempotencyKey;

    const result = await WalletService.creditWallet(
      userId,
      Number(amount),
      narration,
      req.user?.id,
      idempotencyKey
    );

    return res
      .status(200)
      .json(ApiResponse.success(result, "Wallet credited successfully", 200));
  });

  static debitWallet = asyncHandler(async (req: Request, res: Response) => {
    const { userId, amount, narration } = req.body;
    const idempotencyKey = req.idempotencyKey;

    const result = await WalletService.debitWallet(
      userId,
      Number(amount),
      narration,
      req.user?.id,
      idempotencyKey
    );

    return res
      .status(200)
      .json(ApiResponse.success(result, "Wallet debited successfully", 200));
  });

  static getWalletBalance = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = req.params;

      if (!userId) {
        throw ApiError.badRequest("User ID is required");
      }

      const balance = await WalletService.getWalletBalance(userId);

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { userId, balance: Number(balance) },
            "Wallet balance fetched successfully",
            200
          )
        );
    }
  );

  static getWalletTransactions = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        throw ApiError.badRequest("User ID is required");
      }

      const transactions = await WalletService.getWalletTransactions(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res
        .status(200)
        .json(
          ApiResponse.success(
            transactions,
            "Wallet transactions fetched successfully",
            200
          )
        );
    }
  );
}
