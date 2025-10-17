import Prisma from "../db/db.js";
import {
  Prisma as prisma,
  TxStatus,
  LedgerEntryType,
  ReferenceType,
} from "@prisma/client";
import type {
  CreateTransactionDTO,
  GetTransactionsFilters,
  RefundTransactionDTO,
  UpdateTransactionStatusDTO,
} from "../types/transaction.types.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/WinstonLogger.js";

export class TransactionService {
  // ---------------- CREATE TRANSACTION ----------------
  static async createTransaction(data: CreateTransactionDTO) {
    const {
      userId,
      walletId,
      serviceId,
      providerId,
      amount,
      commissionAmount,
      idempotencyKey,
      referenceId,
      requestPayload,
    } = data;

    // Check for duplicate idempotency key
    if (idempotencyKey) {
      const existingTx = await Prisma.transaction.findFirst({
        where: { idempotencyKey },
      });
      if (existingTx) {
        logger.info("Returning existing transaction for idempotency key", {
          key: idempotencyKey,
          transactionId: existingTx.id,
        });
        return existingTx;
      }
    }

    const wallet = await Prisma.wallet.findUnique({
      where: { id: walletId },
      include: { user: true },
    });

    if (!wallet) throw ApiError.notFound("Wallet not found");
    if (wallet.userId !== userId)
      throw ApiError.badRequest("Wallet does not belong to user");

    const amountBigInt = BigInt(amount);
    const commissionAmountBigInt = BigInt(commissionAmount);

    if (wallet.balance < amountBigInt) {
      throw ApiError.badRequest("Insufficient balance");
    }

    const transaction = await Prisma.$transaction(async (tx) => {
      // Create transaction
      const newTx = await tx.transaction.create({
        data: {
          userId,
          walletId,
          serviceId,
          providerId: providerId || null,
          amount: amountBigInt,
          commissionAmount: commissionAmountBigInt,
          netAmount: amountBigInt - commissionAmountBigInt,
          providerCharge: BigInt(0),
          referenceId: referenceId || null,
          idempotencyKey: idempotencyKey || null,
          requestPayload: requestPayload
            ? (requestPayload as prisma.InputJsonValue)
            : prisma.JsonNull,
          status: TxStatus.PENDING,
        },
        include: {
          service: { select: { name: true, code: true } },
          provider: { select: { name: true, code: true } },
          user: {
            select: { firstName: true, lastName: true, phoneNumber: true },
          },
        },
      });

      // Calculate new balance
      const newBalance = wallet.balance - amountBigInt;

      // Create ledger entry
      await tx.ledgerEntry.create({
        data: {
          walletId,
          transactionId: newTx.id,
          entryType: LedgerEntryType.DEBIT,
          referenceType: ReferenceType.TRANSACTION,
          amount: amountBigInt,
          runningBalance: newBalance,
          narration: `Transaction initiated for ${newTx.service.name}`,
          createdBy: userId,
          idempotencyKey: idempotencyKey || null,
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: newBalance },
      });

      logger.info("Transaction created successfully", {
        transactionId: newTx.id,
        userId,
        amount: Number(amountBigInt),
        idempotencyKey,
      });

      return newTx;
    });

    return transaction;
  }

  // ---------------- REFUND TRANSACTION ----------------
  static async refundTransaction(data: RefundTransactionDTO) {
    const { transactionId, initiatedBy, amount, reason } = data;

    const transaction = await Prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: true,
        service: { select: { name: true } },
      },
    });

    if (!transaction) throw ApiError.notFound("Transaction not found");
    if (transaction.status !== TxStatus.SUCCESS) {
      throw ApiError.badRequest("Only successful transactions can be refunded");
    }

    const amountBigInt = BigInt(amount);

    const refund = await Prisma.$transaction(async (tx) => {
      // Create refund record
      const refundRecord = await tx.refund.create({
        data: {
          transactionId,
          initiatedBy,
          amount: amountBigInt,
          reason: reason || "Refund requested",
          status: TxStatus.REFUNDED,
        },
      });

      // Get latest ledger entry for running balance
      const latestLedger = await tx.ledgerEntry.findFirst({
        where: { walletId: transaction.walletId! },
        orderBy: { createdAt: "desc" },
      });

      const runningBalance =
        (latestLedger?.runningBalance || transaction.wallet!.balance) +
        amountBigInt;

      // Create ledger entry for refund
      await tx.ledgerEntry.create({
        data: {
          walletId: transaction.walletId!,
          transactionId,
          entryType: LedgerEntryType.CREDIT,
          referenceType: ReferenceType.REFUND,
          amount: amountBigInt,
          runningBalance,
          narration: `Refund for transaction ${transactionId} - ${reason || "No reason provided"}`,
          createdBy: initiatedBy,
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: transaction.walletId! },
        data: { balance: runningBalance },
      });

      // Update transaction status
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TxStatus.REFUNDED },
      });

      logger.info("Transaction refund processed", {
        transactionId,
        refundId: refundRecord.id,
        amount: Number(amountBigInt),
      });

      return {
        ...refundRecord,
        transactionReference: transaction.referenceId,
        serviceName: transaction.service.name,
      };
    });

    return refund;
  }

  // ---------------- GET TRANSACTIONS ----------------
  static async getTransactions(filters: GetTransactionsFilters) {
    const { userId, status, serviceId, page, limit } = filters;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (serviceId) where.serviceId = serviceId;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          service: { select: { name: true, code: true } },
          provider: { select: { name: true, code: true } },
          user: {
            select: { firstName: true, lastName: true, phoneNumber: true },
          },
          wallet: { select: { id: true, currency: true } },
        },
      }),
      Prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ---------------- GET TRANSACTION BY ID ----------------
  static async getTransactionById(id: string) {
    const transaction = await Prisma.transaction.findUnique({
      where: { id },
      include: {
        service: { select: { name: true, code: true } },
        provider: { select: { name: true, code: true } },
        user: {
          select: { firstName: true, lastName: true, phoneNumber: true },
        },
        wallet: { select: { id: true, currency: true } },
        ledgerEntries: {
          orderBy: { createdAt: "asc" },
          take: 10,
        },
        Refund: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!transaction) throw ApiError.notFound("Transaction not found");
    return transaction;
  }

  // ---------------- UPDATE TRANSACTION STATUS ----------------
  static async updateTransactionStatus(data: UpdateTransactionStatusDTO) {
    const { transactionId, status, responsePayload } = data;

    const transaction = await Prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction) throw ApiError.notFound("Transaction not found");
    if (transaction.status !== TxStatus.PENDING) {
      throw ApiError.badRequest("Only pending transactions can be updated");
    }

    const updatedTx = await Prisma.$transaction(async (tx) => {
      // Update transaction
      const txUpdate = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: status as TxStatus,
          responsePayload: responsePayload
            ? (responsePayload as prisma.InputJsonValue)
            : prisma.JsonNull,
          completedAt: status === TxStatus.SUCCESS ? new Date() : null,
        },
        include: {
          service: { select: { name: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      });

      // For failed transactions, refund the amount
      if (status === TxStatus.FAILED && transaction.walletId) {
        const latestLedger = await tx.ledgerEntry.findFirst({
          where: { walletId: transaction.walletId },
          orderBy: { createdAt: "desc" },
        });

        const runningBalance =
          (latestLedger?.runningBalance || transaction.wallet!.balance) +
          transaction.amount;

        await tx.ledgerEntry.create({
          data: {
            walletId: transaction.walletId,
            transactionId,
            entryType: LedgerEntryType.CREDIT,
            referenceType: ReferenceType.REFUND,
            amount: transaction.amount,
            runningBalance,
            narration: `Transaction failed - amount refunded`,
            createdBy: transaction.userId,
          },
        });

        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: runningBalance },
        });
      }

      logger.info("Transaction status updated", {
        transactionId,
        oldStatus: transaction.status,
        newStatus: status,
      });

      return txUpdate;
    });

    return updatedTx;
  }
}
