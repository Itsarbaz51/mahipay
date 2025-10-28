import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { WalletService } from "../services/wallet.service.js";
import { ApiError } from "../utils/ApiError.js";
import { WalletType, ReferenceType } from "@prisma/client";

export class WalletController {
  static getWallet = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { walletType } = req.query;

    if (!userId) {
      throw ApiError.badRequest("User ID is required");
    }

    const wallet = await WalletService.getWalletByUserId(
      userId,
      walletType as WalletType
    );

    return res
      .status(200)
      .json(ApiResponse.success(wallet, "Wallet fetched successfully", 200));
  });

  static getUserWallets = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      throw ApiError.badRequest("User ID is required");
    }

    const wallets = await WalletService.getUserWallets(userId);

    return res
      .status(200)
      .json(
        ApiResponse.success(wallets, "User wallets fetched successfully", 200)
      );
  });

  static creditWallet = asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      amount,
      narration,
      walletType,
      referenceType,
      serviceId, // ServiceId add kiya
    } = req.body;
    const idempotencyKey = req.idempotencyKey;

    const result = await WalletService.creditWallet(
      userId,
      Number(amount),
      narration,
      req.user?.id,
      idempotencyKey,
      walletType as WalletType,
      referenceType as ReferenceType,
      serviceId // ServiceId pass kiya
    );

    return res
      .status(200)
      .json(ApiResponse.success(result, "Wallet credited successfully", 200));
  });

  static debitWallet = asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      amount,
      narration,
      walletType,
      referenceType,
      serviceId, // ServiceId add kiya
    } = req.body;
    const idempotencyKey = req.idempotencyKey;

    const result = await WalletService.debitWallet(
      userId,
      Number(amount),
      narration,
      req.user?.id,
      idempotencyKey,
      walletType as WalletType,
      referenceType as ReferenceType,
      serviceId // ServiceId pass kiya
    );

    return res
      .status(200)
      .json(ApiResponse.success(result, "Wallet debited successfully", 200));
  });

  static holdAmount = asyncHandler(async (req: Request, res: Response) => {
    const { userId, amount, narration, walletType } = req.body;
    const idempotencyKey = req.idempotencyKey;

    const result = await WalletService.holdAmount(
      userId,
      Number(amount),
      narration,
      req.user?.id,
      idempotencyKey,
      walletType as WalletType
    );

    return res
      .status(200)
      .json(ApiResponse.success(result, "Amount held successfully", 200));
  });

  static releaseHoldAmount = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId, amount, narration, walletType } = req.body;
      const idempotencyKey = req.idempotencyKey;

      const result = await WalletService.releaseHoldAmount(
        userId,
        Number(amount),
        narration,
        req.user?.id,
        idempotencyKey,
        walletType as WalletType
      );

      return res
        .status(200)
        .json(
          ApiResponse.success(result, "Hold amount released successfully", 200)
        );
    }
  );

  static getWalletBalance = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = req.params;
      const { walletType } = req.query;

      if (!userId) {
        throw ApiError.badRequest("User ID is required");
      }

      const balance = await WalletService.getWalletBalance(
        userId,
        walletType as WalletType
      );

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { userId, ...balance },
            "Wallet balance fetched successfully",
            200
          )
        );
    }
  );

  static getWalletTransactions = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = req.params;
      const { page = 1, limit = 10, walletType } = req.query;

      if (!userId) {
        throw ApiError.badRequest("User ID is required");
      }

      const transactions = await WalletService.getWalletTransactions(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        walletType as WalletType
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
