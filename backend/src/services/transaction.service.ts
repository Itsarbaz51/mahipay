import Prisma from "../db/db.js";
import {
  Prisma as prisma,
  TxStatus,
  LedgerEntryType,
  ReferenceType,
  PaymentType,
  Currency,
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
      serviceId, // Yahan serviceId use karenge moduleType ki jagah
      apiEntityId,
      amount,
      currency = "INR",
      paymentType,
      commissionAmount = 0,
      taxAmount = 0,
      feeAmount = 0,
      cashbackAmount = 0,
      idempotencyKey,
      referenceId,
      externalRefId,
      requestPayload,
      metadata,
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

    // Service verify karenge agar serviceId diya hai to
    let service = null;
    if (serviceId) {
      service = await Prisma.serviceProvider.findUnique({
        where: { id: serviceId },
      });
      if (!service) throw ApiError.notFound("Service not found");
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
    const taxAmountBigInt = BigInt(taxAmount);
    const feeAmountBigInt = BigInt(feeAmount);
    const cashbackAmountBigInt = BigInt(cashbackAmount);

    // Calculate net amount
    const netAmount =
      amountBigInt -
      commissionAmountBigInt -
      taxAmountBigInt -
      feeAmountBigInt +
      cashbackAmountBigInt;

    if (wallet.balance < amountBigInt) {
      throw ApiError.badRequest("Insufficient balance");
    }

    const transaction = await Prisma.$transaction(async (tx) => {
      // Create transaction data object
      const txData: any = {
        userId,
        walletId,
        amount: amountBigInt,
        currency: currency as Currency,
        netAmount,
        status: TxStatus.PENDING,
        paymentType: paymentType as PaymentType,
        commissionAmount: commissionAmountBigInt,
        taxAmount: taxAmountBigInt,
        feeAmount: feeAmountBigInt,
        cashbackAmount: cashbackAmountBigInt,
        initiatedAt: new Date(),
      };

      // Add optional fields
      if (serviceId) txData.serviceId = serviceId;
      if (apiEntityId) txData.apiEntityId = apiEntityId;
      if (referenceId) txData.referenceId = referenceId;
      if (externalRefId) txData.externalRefId = externalRefId;
      if (idempotencyKey) txData.idempotencyKey = idempotencyKey;
      if (requestPayload)
        txData.requestPayload = requestPayload as prisma.InputJsonValue;
      if (metadata) txData.metadata = metadata as prisma.InputJsonValue;

      // Create transaction
      const newTx = await tx.transaction.create({
        data: txData,
        include: {
          service: { select: { name: true, code: true, type: true } },
          apiEntity: { select: { entityType: true, entityId: true } },
          user: {
            select: { firstName: true, lastName: true, phoneNumber: true },
          },
          wallet: { select: { currency: true } },
        },
      });

      // Calculate new balance
      const newBalance = wallet.balance - amountBigInt;

      // Narration mein service type use karenge
      const serviceType = service?.type || "GENERAL";
      const serviceName = service?.name || serviceType;

      // Create ledger entry
      await tx.ledgerEntry.create({
        data: {
          walletId,
          transactionId: newTx.id,
          entryType: LedgerEntryType.DEBIT,
          referenceType: ReferenceType.TRANSACTION,
          serviceId: serviceId || null,
          amount: amountBigInt,
          runningBalance: newBalance,
          narration: `Transaction initiated for ${serviceName} - ${paymentType}`,
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
        serviceType,
        serviceName,
        amount: Number(amountBigInt),
        idempotencyKey,
      });

      return newTx;
    });

    return transaction;
  }

  // ---------------- REFUND TRANSACTION ----------------
  static async refundTransaction(data: RefundTransactionDTO) {
    const { transactionId, initiatedBy, amount, reason, metadata } = data;

    const transaction = await Prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: true,
        service: { select: { name: true, type: true } },
      },
    });

    if (!transaction) throw ApiError.notFound("Transaction not found");
    if (transaction.status !== TxStatus.SUCCESS) {
      throw ApiError.badRequest("Only successful transactions can be refunded");
    }

    const amountBigInt = BigInt(amount);
    const serviceName =
      transaction.service?.name ||
      transaction.service?.type ||
      "Unknown Service";

    const refund = await Prisma.$transaction(async (tx) => {
      // Create refund record
      const refundData: any = {
        transactionId,
        initiatedBy,
        amount: amountBigInt,
        status: TxStatus.REFUNDED,
      };

      if (reason) refundData.reason = reason;
      if (metadata) refundData.metadata = metadata as prisma.InputJsonValue;

      const refundRecord = await tx.refund.create({
        data: refundData,
      });

      // Get latest ledger entry for running balance
      const latestLedger = await tx.ledgerEntry.findFirst({
        where: { walletId: transaction.walletId },
        orderBy: { createdAt: "desc" },
      });

      const runningBalance =
        (latestLedger?.runningBalance || transaction.wallet.balance) +
        amountBigInt;

      // Create ledger entry for refund
      await tx.ledgerEntry.create({
        data: {
          walletId: transaction.walletId,
          transactionId,
          entryType: LedgerEntryType.CREDIT,
          referenceType: ReferenceType.REFUND,
          serviceId: transaction.serviceId,
          amount: amountBigInt,
          runningBalance,
          narration: `Refund for ${serviceName} transaction - ${reason || "No reason provided"}`,
          createdBy: initiatedBy,
        },
      });

      // Update wallet balance
      await tx.wallet.update({
        where: { id: transaction.walletId },
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
        serviceName,
        amount: Number(amountBigInt),
      });

      return {
        ...refundRecord,
        transactionReference: transaction.referenceId,
        serviceName,
      };
    });

    return refund;
  }

  // ---------------- GET TRANSACTIONS ----------------
  static async getTransactions(filters: GetTransactionsFilters) {
    const { userId, status, serviceId, apiEntityId, paymentType, page, limit } =
      filters;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status as TxStatus;
    if (serviceId) where.serviceId = serviceId;
    if (apiEntityId) where.apiEntityId = apiEntityId;
    if (paymentType) where.paymentType = paymentType as PaymentType;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          service: { select: { name: true, code: true, type: true } },
          apiEntity: { select: { entityType: true, entityId: true } },
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
        service: { select: { name: true, code: true, type: true } },
        apiEntity: { select: { entityType: true, entityId: true } },
        user: {
          select: { firstName: true, lastName: true, phoneNumber: true },
        },
        wallet: { select: { id: true, currency: true } },
        ledgerEntries: {
          orderBy: { createdAt: "asc" },
          take: 10,
        },
        refunds: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        commissionEarnings: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            fromUser: { select: { firstName: true, lastName: true } },
          },
          take: 10,
        },
      },
    });

    if (!transaction) throw ApiError.notFound("Transaction not found");
    return transaction;
  }

  // ---------------- UPDATE TRANSACTION STATUS ----------------
  static async updateTransactionStatus(data: UpdateTransactionStatusDTO) {
    const {
      transactionId,
      status,
      providerReference,
      providerResponse,
      responsePayload,
    } = data;

    const transaction = await Prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: true,
        service: { select: { name: true, type: true } },
      },
    });

    if (!transaction) throw ApiError.notFound("Transaction not found");

    const updateData: any = {
      status: status as TxStatus,
    };

    // Set timestamps based on status
    if (status === TxStatus.SUCCESS) {
      updateData.processedAt = new Date();
      updateData.completedAt = new Date();
    } else if (status === TxStatus.FAILED) {
      updateData.processedAt = new Date();
    }

    // Add optional fields
    if (providerReference) updateData.providerReference = providerReference;
    if (providerResponse)
      updateData.providerResponse = providerResponse as prisma.InputJsonValue;
    if (responsePayload)
      updateData.responsePayload = responsePayload as prisma.InputJsonValue;

    const serviceName =
      transaction.service?.name ||
      transaction.service?.type ||
      "Unknown Service";

    const updatedTx = await Prisma.$transaction(async (tx) => {
      // Update transaction
      const txUpdate = await tx.transaction.update({
        where: { id: transactionId },
        data: updateData,
        include: {
          service: { select: { name: true, type: true } },
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
          (latestLedger?.runningBalance || transaction.wallet.balance) +
          transaction.amount;

        await tx.ledgerEntry.create({
          data: {
            walletId: transaction.walletId,
            transactionId,
            entryType: LedgerEntryType.CREDIT,
            referenceType: ReferenceType.REFUND,
            serviceId: transaction.serviceId,
            amount: transaction.amount,
            runningBalance,
            narration: `${serviceName} transaction failed - amount refunded`,
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
        serviceName,
        oldStatus: transaction.status,
        newStatus: status,
      });

      return txUpdate;
    });

    return updatedTx;
  }
}
