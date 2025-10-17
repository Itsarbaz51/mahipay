import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { LedgerEntryType, ReferenceType } from "@prisma/client";
import logger from "../utils/WinstonLogger.js";

export class WalletService {
  static async getWalletByUserId(userId: string) {
    const wallet = await Prisma.wallet.findUnique({
      where: { userId },
      include: {
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!wallet) {
      throw ApiError.notFound("Wallet not found for user");
    }

    // Get latest balance from ledger for consistency
    const latestLedger = await Prisma.ledgerEntry.findFirst({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      select: { runningBalance: true },
    });

    const currentBalance = latestLedger
      ? latestLedger.runningBalance
      : wallet.balance;

    return {
      ...wallet,
      balance: currentBalance,
    };
  }

  static async getWalletBalance(userId: string) {
    const wallet = await Prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw ApiError.notFound("Wallet not found for user");
    }

    // Get latest balance from ledger for accuracy
    const latestLedger = await Prisma.ledgerEntry.findFirst({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      select: { runningBalance: true },
    });

    return latestLedger ? latestLedger.runningBalance : wallet.balance;
  }

  static async creditWallet(
    userId: string,
    amount: number,
    narration?: string,
    createdBy?: string,
    idempotencyKey?: string
  ) {
    if (amount <= 0) throw ApiError.badRequest("Amount must be greater than 0");

    return await Prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        select: { id: true, balance: true, userId: true },
      });

      if (!wallet) throw ApiError.notFound("Wallet not found");

      const currentBalance = BigInt(wallet.balance?.toString() || "0");
      const creditAmount = BigInt(amount);
      const newBalance = currentBalance + creditAmount;

      // Create ledger entry
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          entryType: LedgerEntryType.CREDIT,
          referenceType: ReferenceType.ADJUSTMENT,
          amount: creditAmount,
          runningBalance: newBalance,
          narration: narration || "Wallet credit",
          createdBy: createdBy || userId,
          idempotencyKey: idempotencyKey ?? null,
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      logger.info("Wallet credited successfully", {
        walletId: wallet.id,
        userId,
        amount,
        idempotencyKey,
      });

      return {
        walletId: wallet.id,
        userId: wallet.userId,
        previousBalance: Number(currentBalance),
        creditAmount: amount,
        newBalance: Number(newBalance),
        ledgerEntryId: ledgerEntry.id,
        timestamp: new Date(),
      };
    });
  }

  static async debitWallet(
    userId: string,
    amount: number,
    narration?: string,
    createdBy?: string,
    idempotencyKey?: string
  ) {
    if (amount <= 0) throw ApiError.badRequest("Amount must be greater than 0");

    return await Prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        select: { id: true, balance: true, userId: true },
      });

      if (!wallet) throw ApiError.notFound("Wallet not found");

      const currentBalance = BigInt(wallet.balance?.toString() || "0");
      const debitAmount = BigInt(amount);

      if (currentBalance < debitAmount) {
        throw ApiError.badRequest("Insufficient balance");
      }

      const newBalance = currentBalance - debitAmount;

      // Create ledger entry
      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          entryType: LedgerEntryType.DEBIT,
          referenceType: ReferenceType.ADJUSTMENT,
          amount: debitAmount,
          runningBalance: newBalance,
          narration: narration || "Wallet debit",
          createdBy: createdBy || userId,
          idempotencyKey: idempotencyKey || null,
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      logger.info("Wallet debited successfully", {
        walletId: wallet.id,
        userId,
        amount,
        idempotencyKey,
      });

      return {
        walletId: wallet.id,
        userId: wallet.userId,
        previousBalance: Number(currentBalance),
        debitAmount: amount,
        newBalance: Number(newBalance),
        ledgerEntryId: ledgerEntry.id,
        timestamp: new Date(),
      };
    });
  }

  static async getWalletTransactions(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const wallet = await Prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!wallet) throw ApiError.notFound("Wallet not found");

    const skip = (page - 1) * limit;

    const [ledgerEntries, total] = await Promise.all([
      Prisma.ledgerEntry.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          transaction: {
            select: {
              id: true,
              service: { select: { name: true, code: true } },
              status: true,
            },
          },
        },
      }),
      Prisma.ledgerEntry.count({ where: { walletId: wallet.id } }),
    ]);

    return {
      data: ledgerEntries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
