// src/services/CCPayoutService.ts
import { BulkpeAPIClient } from "./BulkpeAPIClient.js";
import Prisma from "../../db/db.js";

import {
  ModuleType,
  EntityStatus,
  PaymentType,
  TxStatus,
  ReferenceType,
  LedgerEntryType,
  WalletType,
} from "@prisma/client";
import { ApiError } from "../../utils/ApiError.js";
import CommissionDistributionService from "../commission.distribution.service.js";
import logger from "../../utils/WinstonLogger.js";
import type { PayoutDetail } from "../../types/bulkpay/ccPayout.types.js";
import { CryptoService } from "../../utils/cryptoService.js";

export class CCPayoutService {
  private bulkpeClient: BulkpeAPIClient;

  constructor() {
    this.bulkpeClient = new BulkpeAPIClient();
  }

  private async generateSequentialReferenceId(
    prefix: string = "ref"
  ): Promise<string> {
    const latestEntity = await Prisma.apiEntity.findFirst({
      where: {
        reference: {
          startsWith: prefix,
        },
        moduleType: ModuleType.CC_PAYOUT,
      },
      orderBy: {
        reference: "desc",
      },
      select: {
        reference: true,
      },
    });

    let nextNumber = 1;

    if (latestEntity && latestEntity.reference) {
      const match = latestEntity.reference.match(new RegExp(`${prefix}(\\d+)`));
      if (match && match[1]) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const sequence = nextNumber.toString().padStart(3, "0");
    return `${prefix}${sequence}`;
  }

  async createSender(userId: string, reqIp: string, payload: any) {
    return await Prisma.$transaction(async (tx) => {
      const referenceId =
        payload.referenceId ||
        (await this.generateSequentialReferenceId("sender"));

      const bulkpeResponse = await this.bulkpeClient.createSender({
        ...payload,
        referenceId: referenceId,
      });

      const encryptedData = {
        pan: CryptoService.encrypt(payload.pan),
        aadhar: payload.aadhar ? CryptoService.encrypt(payload.aadhar) : null,
        phone: CryptoService.encrypt(payload.phone),
        cardNo: CryptoService.encrypt(payload.cardNo),
        cvv: CryptoService.encrypt(payload.cvv),
        expiry: CryptoService.encrypt(payload.expiry),
      };

      const apiEntity = await tx.apiEntity.create({
        data: {
          entityType: "cc_sender",
          entityId: bulkpeResponse.senderId,
          reference: referenceId,
          userId: userId,
          moduleType: ModuleType.CC_PAYOUT,
          status: EntityStatus.PENDING,
          provider: "BULKPE",
          metadata: this.safeJsonParse({
            encryptedData: encryptedData,
            name: payload.name,
            nameInPan: bulkpeResponse.nameInPan,
            charge: bulkpeResponse.charge,
            gst: bulkpeResponse.gst,
            isActive: bulkpeResponse.isActive,
            bulkpeData: this.convertToJsonCompatible(bulkpeResponse),
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId,
          action: "SENDER_CREATED",
          entityType: "cc_sender",
          entityId: apiEntity.id,
          ipAddress: reqIp,
          metadata: this.safeJsonParse({
            referenceId: referenceId,
            senderId: bulkpeResponse.senderId,
          }),
          createdAt: new Date(),
        },
      });

      return {
        status: true,
        statusCode: 200,
        data: {
          senderId: bulkpeResponse.senderId,
          referenceId: bulkpeResponse.referenceId,
          nameInPan: bulkpeResponse.nameInPan,
          pan: CryptoService.maskPAN(bulkpeResponse.pan),
          name: bulkpeResponse.name,
          aadharNumber: bulkpeResponse.aadharNumber
            ? CryptoService.maskAadhar(bulkpeResponse.aadharNumber)
            : "",
          mobile: CryptoService.maskPhone(bulkpeResponse.mobile),
          cardNumber: CryptoService.maskCardNumber(bulkpeResponse.cardNumber),
          charge: bulkpeResponse.charge,
          gst: bulkpeResponse.gst,
          isActive: bulkpeResponse.isActive,
        },
        message: "",
      };
    });
  }

  async uploadCardImage(
    userId: string,
    senderId: string,
    cardImageType: "front" | "back",
    file: Express.Multer.File
  ) {
    return await Prisma.$transaction(async (tx) => {
      const senderEntity = await tx.apiEntity.findFirst({
        where: {
          entityType: "cc_sender",
          entityId: senderId,
          userId: userId,
          moduleType: ModuleType.CC_PAYOUT,
        },
      });

      if (!senderEntity) {
        throw ApiError.notFound("Sender not found");
      }

      const uploadResponse = await this.bulkpeClient.uploadCardImage(
        senderId,
        cardImageType,
        file
      );

      const currentMetadata = (senderEntity.metadata as any) || {};

      const updatedMetadata = {
        ...currentMetadata,
        cardFrontImage: uploadResponse.cardFrontImage,
        cardBackImage: uploadResponse.cardBackImage,
        cardLastFour: uploadResponse.cardNo,
        imagesUpdatedAt: new Date().toISOString(),
      };

      const hasBothImages =
        updatedMetadata.cardFrontImage && updatedMetadata.cardBackImage;

      await tx.apiEntity.update({
        where: { id: senderEntity.id },
        data: {
          metadata: this.safeJsonParse(updatedMetadata),
          status: hasBothImages ? EntityStatus.ACTIVE : EntityStatus.PENDING,
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId,
          action: "CARD_IMAGE_UPLOADED",
          entityType: "cc_sender",
          entityId: senderEntity.id,
          ipAddress: "SYSTEM",
          metadata: this.safeJsonParse({
            senderId: senderId,
            cardImageType: cardImageType,
            cardLastFour: uploadResponse.cardNo,
          }),
          createdAt: new Date(),
        },
      });

      return {
        status: true,
        statusCode: 200,
        data: {
          cardFrontImage: uploadResponse.cardFrontImage,
          cardBackImage: uploadResponse.cardBackImage,
          cardNo: uploadResponse.cardNo,
        },
        message: "Uploaded",
      };
    });
  }

  async listSenders(userId: string, query: any) {
    const { page = 1, limit = 10, referenceId, senderId } = query;

    const where: any = {
      entityType: "cc_sender",
      userId: userId,
      moduleType: ModuleType.CC_PAYOUT,
    };

    if (referenceId) where.reference = referenceId;
    if (senderId) where.entityId = senderId;

    const [senders, total] = await Promise.all([
      Prisma.apiEntity.findMany({
        where,
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      Prisma.apiEntity.count({ where }),
    ]);

    const formattedSenders = senders.map((entity) => {
      const metadata = entity.metadata as any;
      const encryptedData = metadata?.encryptedData || {};

      let maskedPan = "*****";
      let maskedCardNumber = "**** **** **** ****";

      try {
        if (encryptedData.pan) {
          const decryptedPan = CryptoService.decrypt(encryptedData.pan);
          maskedPan = CryptoService.maskPAN(decryptedPan);
        }

        if (encryptedData.cardNo) {
          const decryptedCardNo = CryptoService.decrypt(encryptedData.cardNo);
          maskedCardNumber = CryptoService.maskCardNumber(decryptedCardNo);
        }
      } catch (error) {
        logger.error("Error decrypting data for display", {
          error,
          entityId: entity.id,
        });
      }

      return {
        senderId: entity.entityId,
        referenceId: entity.reference,
        nameInPan: metadata?.nameInPan,
        pan: maskedPan,
        name: metadata?.name,
        aadharNumber: encryptedData.aadhar
          ? CryptoService.maskAadhar("000000000000")
          : "",
        cardNumber: maskedCardNumber,
        isActive: metadata?.isActive || false,
        status: entity.status,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      };
    });

    return {
      status: true,
      statusCode: 200,
      data: formattedSenders,
      message: "",
      total: total,
    };
  }

  async createBeneficiary(userId: string, payload: any) {
    return await Prisma.$transaction(async (tx) => {
      const reference =
        payload.reference || (await this.generateSequentialReferenceId("bene"));

      const bulkpeResponse = await this.bulkpeClient.createBeneficiary({
        ...payload,
        reference: reference,
      });

      const encryptedData = {
        accountNumber: CryptoService.encrypt(payload.accountNumber),
        ifsc: CryptoService.encrypt(payload.ifsc),
      };

      const apiEntity = await tx.apiEntity.create({
        data: {
          entityType: "cc_beneficiary",
          entityId: bulkpeResponse.beneficiaryId,
          reference: reference,
          userId: userId,
          moduleType: ModuleType.CC_PAYOUT,
          status: EntityStatus.PENDING,
          provider: "BULKPE",
          metadata: this.safeJsonParse({
            encryptedData: encryptedData,
            name: payload.name,
            accountHolderName: bulkpeResponse.accountHolderName,
            status: bulkpeResponse.status,
            message: bulkpeResponse.message,
            bulkpeData: this.convertToJsonCompatible(bulkpeResponse),
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId,
          action: "BENEFICIARY_CREATED",
          entityType: "cc_beneficiary",
          entityId: apiEntity.id,
          ipAddress: "SYSTEM",
          metadata: this.safeJsonParse({
            reference: reference,
            beneficiaryId: bulkpeResponse.beneficiaryId,
          }),
          createdAt: new Date(),
        },
      });

      return {
        status: true,
        statusCode: 200,
        data: {
          reference: bulkpeResponse.reference,
          beneficiaryId: bulkpeResponse.beneficiaryId,
          beneficiaryName: bulkpeResponse.beneficiaryName,
          accountHolderName: bulkpeResponse.accountHolderName,
          accountNumber: CryptoService.maskAccountNumber(
            bulkpeResponse.accountNumber
          ),
          ifsc: bulkpeResponse.ifsc,
          status: bulkpeResponse.status,
          message: bulkpeResponse.message,
          createdAt: bulkpeResponse.createdAt,
          updatedAt: bulkpeResponse.updatedAt,
        },
        message: "We will process and add your beneficiary!",
      };
    });
  }

  async listBeneficiaries(userId: string, query: any) {
    const { page = 1, limit = 10, status, reference, beneficiaryId } = query;

    const where: any = {
      entityType: "cc_beneficiary",
      userId: userId,
      moduleType: ModuleType.CC_PAYOUT,
    };

    if (status) where.status = status;
    if (reference) where.reference = reference;
    if (beneficiaryId) where.entityId = beneficiaryId;

    const [beneficiaries, total] = await Promise.all([
      Prisma.apiEntity.findMany({
        where,
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      Prisma.apiEntity.count({ where }),
    ]);

    const formattedBeneficiaries = beneficiaries.map((entity) => {
      const metadata = entity.metadata as any;
      const encryptedData = metadata?.encryptedData || {};

      let maskedAccountNumber = "****";

      try {
        if (encryptedData.accountNumber) {
          const decryptedAccount = CryptoService.decrypt(
            encryptedData.accountNumber
          );
          maskedAccountNumber =
            CryptoService.maskAccountNumber(decryptedAccount);
        }
      } catch (error) {
        logger.error("Error decrypting account number for display", {
          error,
          entityId: entity.id,
        });
      }

      return {
        reference: entity.reference,
        beneficiaryId: entity.entityId,
        beneficiaryName: metadata?.name,
        accountHolderName: metadata?.accountHolderName,
        accountNumber: maskedAccountNumber,
        ifsc: metadata?.ifsc,
        status: entity.status,
        message: metadata?.message,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      };
    });

    return {
      status: true,
      statusCode: 200,
      data: formattedBeneficiaries,
      message: "",
      total: total,
    };
  }

  async createCardCollection(userId: string, payload: any) {
    return await Prisma.$transaction(async (tx) => {
      const reference =
        payload.reference || (await this.generateSequentialReferenceId("coll"));

      const [sender, beneficiary] = await Promise.all([
        tx.apiEntity.findFirst({
          where: {
            entityType: "cc_sender",
            entityId: payload.senderId,
            userId: userId,
            moduleType: ModuleType.CC_PAYOUT,
            status: EntityStatus.ACTIVE,
          },
        }),
        tx.apiEntity.findFirst({
          where: {
            entityType: "cc_beneficiary",
            entityId: payload.beneficiaryId,
            userId: userId,
            moduleType: ModuleType.CC_PAYOUT,
            status: EntityStatus.ACTIVE,
          },
        }),
      ]);

      if (!sender) throw ApiError.notFound("Sender not found or inactive");
      if (!beneficiary)
        throw ApiError.notFound("Beneficiary not found or inactive");

      const wallet = await tx.wallet.findFirst({
        where: {
          userId: userId,
          walletType: WalletType.PRIMARY,
          isActive: true,
        },
      });

      if (!wallet) throw ApiError.notFound("Wallet not found");

      const amountInPaise = this.convertToPaise(payload.amount);
      if (wallet.balance < amountInPaise) {
        throw ApiError.insufficientFunds("Insufficient wallet balance");
      }

      const bulkpeResponse = await this.bulkpeClient.createCollection({
        ...payload,
        reference: reference,
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: userId,
          walletId: wallet.id,
          moduleType: ModuleType.CC_PAYOUT,
          subModule: "COLLECTION",
          paymentType: PaymentType.COLLECTION,
          amount: amountInPaise,
          currency: "INR",
          netAmount: amountInPaise,
          status: TxStatus.PENDING,
          referenceId: reference,
          externalRefId: bulkpeResponse.collectionId,
          metadata: this.safeJsonParse({
            senderId: payload.senderId,
            beneficiaryId: payload.beneficiaryId,
            type: payload.type,
            redirectUrl: payload.redirectUrl,
            cardType: payload.cardType,
            additionalCharge: payload.additionalCharge,
            collectionUrl: bulkpeResponse.collectionUrl,
            charge: bulkpeResponse.charge,
            gst: bulkpeResponse.gst,
            payouts: this.convertPayoutsToJson(bulkpeResponse.payouts),
          }),
          initiatedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const collectionEntity = await tx.apiEntity.create({
        data: {
          entityType: "cc_collection",
          entityId: bulkpeResponse.collectionId,
          reference: reference,
          userId: userId,
          moduleType: ModuleType.CC_PAYOUT,
          status: EntityStatus.PENDING,
          provider: "BULKPE",
          metadata: this.safeJsonParse({
            amount: payload.amount,
            senderId: payload.senderId,
            beneficiaryId: payload.beneficiaryId,
            type: payload.type,
            collectionUrl: bulkpeResponse.collectionUrl,
            charge: bulkpeResponse.charge,
            gst: bulkpeResponse.gst,
            additionalCharge: payload.additionalCharge,
            payouts: this.convertPayoutsToJson(bulkpeResponse.payouts),
            transactionId: transaction.id,
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const newWalletBalance = wallet.balance - amountInPaise;

      await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          walletId: wallet.id,
          entryType: LedgerEntryType.DEBIT,
          referenceType: ReferenceType.COLLECTION,
          moduleType: ModuleType.CC_PAYOUT,
          amount: amountInPaise,
          runningBalance: newWalletBalance,
          narration: `CC Collection initiated - ${reference}`,
          createdBy: userId,
          metadata: this.safeJsonParse({
            collectionId: bulkpeResponse.collectionId,
            senderId: payload.senderId,
            beneficiaryId: payload.beneficiaryId,
          }),
          createdAt: new Date(),
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newWalletBalance,
          availableBalance: newWalletBalance - wallet.holdBalance,
          version: { increment: 1 },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId,
          action: "COLLECTION_CREATED",
          entityType: "cc_collection",
          entityId: collectionEntity.id,
          ipAddress: "SYSTEM",
          metadata: this.safeJsonParse({
            reference: reference,
            collectionId: bulkpeResponse.collectionId,
            amount: payload.amount,
            transactionId: transaction.id,
          }),
          createdAt: new Date(),
        },
      });

      return {
        status: true,
        statusCode: 200,
        data: {
          collectionId: bulkpeResponse.collectionId,
          reference: bulkpeResponse.reference,
          amount: bulkpeResponse.amount,
          status: bulkpeResponse.status,
          message: bulkpeResponse.message,
          utr: bulkpeResponse.utr,
          senderId: bulkpeResponse.senderId,
          collectionUrl: bulkpeResponse.collectionUrl,
          createdAt: bulkpeResponse.createdAt,
          updatedAt: bulkpeResponse.updatedAt,
          type: bulkpeResponse.type,
          charge: bulkpeResponse.charge,
          gst: bulkpeResponse.gst,
          payouts: bulkpeResponse.payouts,
        },
        message: "",
      };
    });
  }

  async listCollections(userId: string, query: any) {
    const {
      page = 1,
      limit = 10,
      beneficiaryId,
      reference,
      collectionId,
    } = query;

    const transactionWhere: any = {
      userId: userId,
      moduleType: ModuleType.CC_PAYOUT,
      subModule: "COLLECTION",
    };

    if (reference) transactionWhere.referenceId = reference;
    if (collectionId) transactionWhere.externalRefId = collectionId;

    const [transactions, total] = await Promise.all([
      Prisma.transaction.findMany({
        where: transactionWhere,
        include: {
          apiWebhooks: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        skip: (page - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      Prisma.transaction.count({ where: transactionWhere }),
    ]);

    const formattedCollections = await Promise.all(
      transactions.map(async (tx) => {
        const metadata = tx.metadata as any;

        const latestWebhook = tx.apiWebhooks[0];
        const webhookStatus = latestWebhook?.payload as any;

        return {
          collectionId: tx.externalRefId,
          reference: tx.referenceId,
          amount: this.convertToRupees(tx.amount),
          status: webhookStatus?.status || tx.status,
          message: webhookStatus?.message || metadata?.message,
          utr: metadata?.utr,
          senderId: metadata?.senderId,
          beneficiaryId: metadata?.beneficiaryId,
          collectionUrl: metadata?.collectionUrl,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
          type: metadata?.type,
          charge: metadata?.charge,
          gst: metadata?.gst,
          additionalCharge: metadata?.additionalCharge,
          payouts: metadata?.payouts || [],
        };
      })
    );

    const filteredCollections = beneficiaryId
      ? formattedCollections.filter((c) => c.beneficiaryId === beneficiaryId)
      : formattedCollections;

    return {
      status: true,
      statusCode: 200,
      data: filteredCollections,
      message: "",
      total: beneficiaryId ? filteredCollections.length : total,
    };
  }

  async handleWebhook(payload: any) {
    return await Prisma.$transaction(async (tx) => {
      const { collectionId, status, message, utr, payouts } = payload;

      const transaction = await tx.transaction.findFirst({
        where: {
          externalRefId: collectionId,
          moduleType: ModuleType.CC_PAYOUT,
        },
        include: {
          wallet: true,
        },
      });

      if (!transaction) {
        throw ApiError.notFound(
          `Transaction not found for collection: ${collectionId}`
        );
      }

      const txStatus = this.mapWebhookStatus(status);

      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: txStatus,
          completedAt: new Date(),
          updatedAt: new Date(),
          metadata: this.safeJsonParse({
            ...(transaction.metadata as any),
            utr: utr,
            webhookStatus: status,
            webhookMessage: message,
            payouts: this.convertPayoutsToJson(payouts),
            completedAt: new Date().toISOString(),
          }),
        },
      });

      await tx.apiEntity.updateMany({
        where: {
          entityType: "cc_collection",
          entityId: collectionId,
          moduleType: ModuleType.CC_PAYOUT,
        },
        data: {
          status:
            status === "SUCCESS" ? EntityStatus.ACTIVE : EntityStatus.INACTIVE,
          updatedAt: new Date(),
          metadata: this.safeJsonParse({
            ...(transaction.metadata as any),
            status: status,
            message: message,
            utr: utr,
            completedAt: new Date().toISOString(),
          }),
        },
      });

      if (status === "SUCCESS") {
        try {
          await CommissionDistributionService.distribute(
            {
              id: transaction.id,
              userId: transaction.userId,
              serviceId: transaction.serviceId || "cc_payout_service",
              amount: transaction.amount,
              channel: "CC_PAYOUT",
            },
            "SYSTEM"
          );

          logger.info("Commission distributed successfully", {
            transactionId: transaction.id,
            collectionId: collectionId,
          });
        } catch (commissionError) {
          logger.error("Commission distribution failed", {
            transactionId: transaction.id,
            error: commissionError,
            collectionId: collectionId,
          });
        }
      }

      if (status === "SUCCESS") {
        await tx.ledgerEntry.create({
          data: {
            transactionId: transaction.id,
            walletId: transaction.walletId,
            entryType: LedgerEntryType.CREDIT,
            referenceType: ReferenceType.COLLECTION,
            moduleType: ModuleType.CC_PAYOUT,
            amount: transaction.amount,
            runningBalance: transaction.wallet.balance + transaction.amount,
            narration: `CC Collection completed - UTR: ${utr}`,
            createdBy: "SYSTEM",
            metadata: this.safeJsonParse({
              collectionId: collectionId,
              utr: utr,
              status: status,
            }),
            createdAt: new Date(),
          },
        });

        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: transaction.wallet.balance + transaction.amount,
            availableBalance:
              transaction.wallet.balance +
              transaction.amount -
              transaction.wallet.holdBalance,
            version: { increment: 1 },
          },
        });
      } else if (status === "FAILED") {
        await tx.ledgerEntry.create({
          data: {
            transactionId: transaction.id,
            walletId: transaction.walletId,
            entryType: LedgerEntryType.CREDIT,
            referenceType: ReferenceType.REFUND,
            moduleType: ModuleType.CC_PAYOUT,
            amount: transaction.amount,
            runningBalance: transaction.wallet.balance + transaction.amount,
            narration: `CC Collection failed - Amount refunded`,
            createdBy: "SYSTEM",
            metadata: this.safeJsonParse({
              collectionId: collectionId,
              status: status,
              message: message,
            }),
            createdAt: new Date(),
          },
        });

        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: transaction.wallet.balance + transaction.amount,
            availableBalance:
              transaction.wallet.balance +
              transaction.amount -
              transaction.wallet.holdBalance,
            version: { increment: 1 },
          },
        });
      }

      await tx.apiWebhook.create({
        data: {
          transactionId: transaction.id,
          provider: "BULKPE",
          eventType: "COLLECTION_STATUS_UPDATE",
          payload: this.safeJsonParse(payload),
          status: "PROCESSED",
          response: this.safeJsonParse({ success: true }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: transaction.userId,
          action: "COLLECTION_STATUS_UPDATED",
          entityType: "cc_collection",
          entityId: collectionId,
          ipAddress: "SYSTEM",
          metadata: this.safeJsonParse({
            collectionId: collectionId,
            status: status,
            utr: utr,
            transactionId: transaction.id,
          }),
          createdAt: new Date(),
        },
      });

      return {
        success: true,
        message: `Webhook processed for collection ${collectionId}`,
      };
    });
  }

  async getDashboardStats(userId: string) {
    const [
      totalCollections,
      successfulCollections,
      pendingCollections,
      totalAmount,
      recentCollections,
    ] = await Promise.all([
      Prisma.transaction.count({
        where: {
          userId: userId,
          moduleType: ModuleType.CC_PAYOUT,
          subModule: "COLLECTION",
        },
      }),

      Prisma.transaction.count({
        where: {
          userId: userId,
          moduleType: ModuleType.CC_PAYOUT,
          subModule: "COLLECTION",
          status: TxStatus.SUCCESS,
        },
      }),

      Prisma.transaction.count({
        where: {
          userId: userId,
          moduleType: ModuleType.CC_PAYOUT,
          subModule: "COLLECTION",
          status: TxStatus.PENDING,
        },
      }),

      Prisma.transaction.aggregate({
        where: {
          userId: userId,
          moduleType: ModuleType.CC_PAYOUT,
          subModule: "COLLECTION",
          status: TxStatus.SUCCESS,
        },
        _sum: {
          amount: true,
        },
      }),

      Prisma.transaction.findMany({
        where: {
          userId: userId,
          moduleType: ModuleType.CC_PAYOUT,
          subModule: "COLLECTION",
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          referenceId: true,
          externalRefId: true,
          metadata: true,
        },
      }),
    ]);

    return {
      totalCollections,
      successfulCollections,
      pendingCollections,
      failedCollections:
        totalCollections - successfulCollections - pendingCollections,
      totalAmount: this.convertToRupees(totalAmount._sum.amount || BigInt(0)),
      successRate:
        totalCollections > 0
          ? (successfulCollections / totalCollections) * 100
          : 0,
      recentCollections: recentCollections.map((tx) => ({
        collectionId: tx.externalRefId,
        reference: tx.referenceId,
        amount: this.convertToRupees(tx.amount),
        status: tx.status,
        createdAt: tx.createdAt,
      })),
    };
  }

  async getDecryptedSenderData(userId: string, senderId: string) {
    const senderEntity = await Prisma.apiEntity.findFirst({
      where: {
        entityType: "cc_sender",
        entityId: senderId,
        userId: userId,
        moduleType: ModuleType.CC_PAYOUT,
      },
    });

    if (!senderEntity) {
      throw ApiError.notFound("Sender not found");
    }

    const metadata = senderEntity.metadata as any;
    const encryptedData = metadata?.encryptedData || {};

    const decryptedData = {
      pan: encryptedData.pan ? CryptoService.decrypt(encryptedData.pan) : null,
      aadhar: encryptedData.aadhar
        ? CryptoService.decrypt(encryptedData.aadhar)
        : null,
      phone: encryptedData.phone
        ? CryptoService.decrypt(encryptedData.phone)
        : null,
      cardNo: encryptedData.cardNo
        ? CryptoService.decrypt(encryptedData.cardNo)
        : null,
      cvv: encryptedData.cvv ? CryptoService.decrypt(encryptedData.cvv) : null,
      expiry: encryptedData.expiry
        ? CryptoService.decrypt(encryptedData.expiry)
        : null,
    };

    return {
      senderId: senderEntity.entityId,
      reference: senderEntity.reference,
      decryptedData: decryptedData,
      basicInfo: {
        name: metadata?.name,
        nameInPan: metadata?.nameInPan,
        isActive: metadata?.isActive,
      },
      status: senderEntity.status,
    };
  }

  async getDecryptedBeneficiaryData(userId: string, beneficiaryId: string) {
    const beneficiaryEntity = await Prisma.apiEntity.findFirst({
      where: {
        entityType: "cc_beneficiary",
        entityId: beneficiaryId,
        userId: userId,
        moduleType: ModuleType.CC_PAYOUT,
      },
    });

    if (!beneficiaryEntity) {
      throw ApiError.notFound("Beneficiary not found");
    }

    const metadata = beneficiaryEntity.metadata as any;
    const encryptedData = metadata?.encryptedData || {};

    const decryptedData = {
      accountNumber: encryptedData.accountNumber
        ? CryptoService.decrypt(encryptedData.accountNumber)
        : null,
      ifsc: encryptedData.ifsc
        ? CryptoService.decrypt(encryptedData.ifsc)
        : null,
    };

    return {
      beneficiaryId: beneficiaryEntity.entityId,
      reference: beneficiaryEntity.reference,
      decryptedData: decryptedData,
      basicInfo: {
        name: metadata?.name,
        accountHolderName: metadata?.accountHolderName,
        status: metadata?.status,
      },
      status: beneficiaryEntity.status,
    };
  }

  private convertToJsonCompatible(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  private safeJsonParse(data: any): any {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      logger.error("JSON conversion error", { error, data });
      return {};
    }
  }

  private convertPayoutsToJson(payouts: PayoutDetail[]): any[] {
    return payouts.map((payout) => this.convertToJsonCompatible(payout));
  }

  private convertToPaise(amount: number): bigint {
    return BigInt(Math.round(amount * 100));
  }

  private convertToRupees(amount: bigint): number {
    return Number(amount) / 100;
  }

  private mapWebhookStatus(webhookStatus: string): TxStatus {
    const statusMap: { [key: string]: TxStatus } = {
      SUCCESS: TxStatus.SUCCESS,
      FAILED: TxStatus.FAILED,
      PENDING: TxStatus.PENDING,
      PROCESSING: TxStatus.PENDING,
    };
    return statusMap[webhookStatus] || TxStatus.FAILED;
  }

  async disconnect() {
    await Prisma.$disconnect();
  }
}

export default CCPayoutService;
