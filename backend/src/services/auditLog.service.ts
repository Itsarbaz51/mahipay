// src/services/CCPayoutService.ts
import { BulkpeAPIClient } from "./BulkpeAPIClient.js";
import Prisma from "../../db/db.js";
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
                moduleType: "CC_PAYOUT",
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
                    moduleType: "CC_PAYOUT",
                    status: "PENDING",
                    metadata: this.safeJsonParse({
                        encryptedData: encryptedData,
                        name: payload.name,
                        nameInPan: bulkpeResponse.nameInPan,
                        charge: bulkpeResponse.charge,
                        gst: bulkpeResponse.gst,
                        isActive: bulkpeResponse.isActive,
                        bulkpeData: this.convertToJsonCompatible(bulkpeResponse),
                    }),
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
            // Step 1: Verify sender exists and belongs to user
            const senderEntity = await tx.apiEntity.findFirst({
                where: {
                    entityType: "cc_sender",
                    entityId: senderId,
                    userId: userId,
                    moduleType: "CC_PAYOUT",
                },
            });

            if (!senderEntity) {
                throw ApiError.notFound("Sender not found");
            }

            // Step 2: Upload to Bulkpe API
            const uploadResponse = await this.bulkpeClient.uploadCardImage(
                senderId,
                cardImageType,
                file
            );

            // Step 3: Update ApiEntity with image URLs
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
                    status: hasBothImages ? "ACTIVE" : "PENDING",
                },
            });

            // Step 4: Audit log
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

    /**
     * ✅ List Senders with Dynamically Masked Data
     */
    async listSenders(userId: string, query: any) {
        const { page = 1, limit = 10, referenceId, senderId } = query;

        const where: any = {
            entityType: "cc_sender",
            userId: userId,
            moduleType: "CC_PAYOUT",
        };

        if (referenceId) where.reference = referenceId;
        if (senderId) where.entityId = senderId;

        const [senders, total] = await Promise.all([
            Prisma.apiEntity.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            Prisma.apiEntity.count({ where }),
        ]);

        // Generate masked data dynamically from encrypted data
        const formattedSenders = senders.map((entity) => {
            const metadata = entity.metadata as any;
            const encryptedData = metadata?.encryptedData || {};

            // Decrypt and mask data for display
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
                    : "", // Don't decrypt aadhar for display
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

    /**
     * ✅ Create Beneficiary with Encrypted Data (Only encrypted data stored)
     */
    async createBeneficiary(userId: string, payload: any) {
        return await Prisma.$transaction(async (tx) => {
            const reference =
                payload.reference || (await this.generateSequentialReferenceId("bene"));

            // Step 1: Create in Bulkpe API
            const bulkpeResponse = await this.bulkpeClient.createBeneficiary({
                ...payload,
                reference: reference,
            });

            // Step 2: Encrypt sensitive beneficiary data
            const encryptedData = {
                accountNumber: CryptoService.encrypt(payload.accountNumber),
                ifsc: CryptoService.encrypt(payload.ifsc),
            };

            // Step 3: Store ONLY encrypted data in database
            const apiEntity = await tx.apiEntity.create({
                data: {
                    entityType: "cc_beneficiary",
                    entityId: bulkpeResponse.beneficiaryId,
                    reference: reference,
                    userId: userId,
                    moduleType: "CC_PAYOUT",
                    status: "PENDING",
                    metadata: this.safeJsonParse({
                        // Store ONLY encrypted data
                        encryptedData: encryptedData,

                        // Store basic non-sensitive info
                        name: payload.name,
                        accountHolderName: bulkpeResponse.accountHolderName,
                        status: bulkpeResponse.status,
                        message: bulkpeResponse.message,
                        bulkpeData: this.convertToJsonCompatible(bulkpeResponse),
                    }),
                },
            });

            // Step 4: Audit log
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
                },
            });

            // Step 5: Return masked data in response (dynamically generated)
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
                    ifsc: bulkpeResponse.ifsc, // IFSC is public, no need to mask
                    status: bulkpeResponse.status,
                    message: bulkpeResponse.message,
                    createdAt: bulkpeResponse.createdAt,
                    updatedAt: bulkpeResponse.updatedAt,
                },
                message: "We will process and add your beneficiary!",
            };
        });
    }

    /**
     * ✅ List Beneficiaries with Dynamically Masked Data
     */
    async listBeneficiaries(userId: string, query: any) {
        const { page = 1, limit = 10, status, reference, beneficiaryId } = query;

        const where: any = {
            entityType: "cc_beneficiary",
            userId: userId,
            moduleType: "CC_PAYOUT",
        };

        if (status) where.status = status;
        if (reference) where.reference = reference;
        if (beneficiaryId) where.entityId = beneficiaryId;

        const [beneficiaries, total] = await Promise.all([
            Prisma.apiEntity.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            Prisma.apiEntity.count({ where }),
        ]);

        // Generate masked data dynamically from encrypted data
        const formattedBeneficiaries = beneficiaries.map((entity) => {
            const metadata = entity.metadata as any;
            const encryptedData = metadata?.encryptedData || {};

            // Decrypt and mask account number for display
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
                ifsc: metadata?.ifsc, // IFSC stored as plain text since it's public
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

    /**
     * ✅ Create Card Collection
     */
    async createCardCollection(userId: string, payload: any) {
        return await Prisma.$transaction(async (tx) => {
            const reference =
                payload.reference || (await this.generateSequentialReferenceId("coll"));

            // Step 1: Validate sender and beneficiary
            const [sender, beneficiary] = await Promise.all([
                tx.apiEntity.findFirst({
                    where: {
                        entityType: "cc_sender",
                        entityId: payload.senderId,
                        userId: userId,
                        moduleType: "CC_PAYOUT",
                        status: "ACTIVE",
                    },
                }),
                tx.apiEntity.findFirst({
                    where: {
                        entityType: "cc_beneficiary",
                        entityId: payload.beneficiaryId,
                        userId: userId,
                        moduleType: "CC_PAYOUT",
                        status: "ACTIVE",
                    },
                }),
            ]);

            if (!sender) throw ApiError.notFound("Sender not found or inactive");
            if (!beneficiary)
                throw ApiError.notFound("Beneficiary not found or inactive");

            // Step 2: Get user's wallet
            const wallet = await tx.wallet.findFirst({
                where: {
                    userId: userId,
                    walletType: "PRIMARY",
                    isActive: true,
                },
            });

            if (!wallet) throw ApiError.notFound("Wallet not found");

            // Step 3: Validate wallet balance
            const amountInPaise = BigInt(payload.amount * 100);
            if (wallet.balance < amountInPaise) {
                throw ApiError.insufficientFunds("Insufficient wallet balance");
            }

            // Step 4: Create collection in Bulkpe API
            const bulkpeResponse = await this.bulkpeClient.createCollection({
                ...payload,
                reference: reference,
            });

            // Step 5: Create main transaction record
            const transaction = await tx.transaction.create({
                data: {
                    userId: userId,
                    walletId: wallet.id,
                    moduleType: "CC_PAYOUT",
                    subModule: "COLLECTION",
                    paymentType: "COLLECTION",
                    amount: amountInPaise,
                    netAmount: amountInPaise,
                    status: "PENDING",
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
                },
            });

            // Step 6: Create collection entity
            const collectionEntity = await tx.apiEntity.create({
                data: {
                    entityType: "cc_collection",
                    entityId: bulkpeResponse.collectionId,
                    reference: reference,
                    userId: userId,
                    moduleType: "CC_PAYOUT",
                    status: "PENDING",
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
                },
            });

            // Step 7: Create ledger entry for collection
            await tx.ledgerEntry.create({
                data: {
                    transactionId: transaction.id,
                    walletId: wallet.id,
                    entryType: "DEBIT",
                    referenceType: "COLLECTION",
                    moduleType: "CC_PAYOUT",
                    amount: amountInPaise,
                    runningBalance: wallet.balance - amountInPaise,
                    narration: `CC Collection initiated - ${reference}`,
                    createdBy: userId,
                    metadata: this.safeJsonParse({
                        collectionId: bulkpeResponse.collectionId,
                        senderId: payload.senderId,
                        beneficiaryId: payload.beneficiaryId,
                    }),
                },
            });

            // Step 8: Update wallet balance
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: wallet.balance - amountInPaise,
                    version: { increment: 1 },
                },
            });

            // Step 9: Audit log
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

    /**
     * ✅ List Collections
     */
    async listCollections(userId: string, query: any) {
        const {
            page = 1,
            limit = 10,
            beneficiaryId,
            reference,
            collectionId,
        } = query;

        // Build where clause for transactions
        const transactionWhere: any = {
            userId: userId,
            moduleType: "CC_PAYOUT",
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
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            Prisma.transaction.count({ where: transactionWhere }),
        ]);

        // Format response
        const formattedCollections = await Promise.all(
            transactions.map(async (tx) => {
                const metadata = tx.metadata as any;

                // Get latest webhook status if available
                const latestWebhook = tx.apiWebhooks[0];
                const webhookStatus = latestWebhook?.payload as any;

                return {
                    collectionId: tx.externalRefId,
                    reference: tx.referenceId,
                    amount: Number(tx.amount) / 100,
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

        // Filter by beneficiaryId if provided
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

    /**
     * ✅ Handle Webhook - Update transaction and distribute commission
     */
    async handleWebhook(payload: any) {
        return await Prisma.$transaction(async (tx) => {
            const { collectionId, status, message, utr, payouts } = payload;

            // Step 1: Find collection transaction
            const transaction = await tx.transaction.findFirst({
                where: {
                    externalRefId: collectionId,
                    moduleType: "CC_PAYOUT",
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

            // Step 2: Update transaction status
            const updatedTransaction = await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: status === "SUCCESS" ? "SUCCESS" : "FAILED",
                    completedAt: new Date(),
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

            // Step 3: Update collection entity
            await tx.apiEntity.updateMany({
                where: {
                    entityType: "cc_collection",
                    entityId: collectionId,
                    moduleType: "CC_PAYOUT",
                },
                data: {
                    status: status === "SUCCESS" ? "ACTIVE" : "INACTIVE",
                    metadata: this.safeJsonParse({
                        ...(transaction.metadata as any),
                        status: status,
                        message: message,
                        utr: utr,
                        completedAt: new Date().toISOString(),
                    }),
                },
            });

            // Step 4: If successful, distribute commissions
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

            // Step 5: Create ledger entry for completion
            if (status === "SUCCESS") {
                await tx.ledgerEntry.create({
                    data: {
                        transactionId: transaction.id,
                        walletId: transaction.walletId,
                        entryType: "CREDIT",
                        referenceType: "COLLECTION",
                        moduleType: "CC_PAYOUT",
                        amount: transaction.amount,
                        runningBalance: transaction.wallet.balance + transaction.amount,
                        narration: `CC Collection completed - UTR: ${utr}`,
                        createdBy: "SYSTEM",
                        metadata: this.safeJsonParse({
                            collectionId: collectionId,
                            utr: utr,
                            status: status,
                        }),
                    },
                });

                // Update wallet balance for successful collection
                await tx.wallet.update({
                    where: { id: transaction.walletId },
                    data: {
                        balance: transaction.wallet.balance + transaction.amount,
                        version: { increment: 1 },
                    },
                });
            } else if (status === "FAILED") {
                // Refund amount for failed collection
                await tx.ledgerEntry.create({
                    data: {
                        transactionId: transaction.id,
                        walletId: transaction.walletId,
                        entryType: "CREDIT",
                        referenceType: "REFUND",
                        moduleType: "CC_PAYOUT",
                        amount: transaction.amount,
                        runningBalance: transaction.wallet.balance + transaction.amount,
                        narration: `CC Collection failed - Amount refunded`,
                        createdBy: "SYSTEM",
                        metadata: this.safeJsonParse({
                            collectionId: collectionId,
                            status: status,
                            message: message,
                        }),
                    },
                });

                await tx.wallet.update({
                    where: { id: transaction.walletId },
                    data: {
                        balance: transaction.wallet.balance + transaction.amount,
                        version: { increment: 1 },
                    },
                });
            }

            // Step 6: Store webhook
            await tx.apiWebhook.create({
                data: {
                    transactionId: transaction.id,
                    provider: "BULKPE",
                    eventType: "COLLECTION_STATUS_UPDATE",
                    payload: this.safeJsonParse(payload),
                    status: "PROCESSED",
                    response: this.safeJsonParse({ success: true }),
                },
            });

            // Step 7: Audit log
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
                },
            });

            return {
                success: true,
                message: `Webhook processed for collection ${collectionId}`,
            };
        });
    }

    /**
     * ✅ Get Dashboard Stats
     */
    async getDashboardStats(userId: string) {
        const [
            totalCollections,
            successfulCollections,
            pendingCollections,
            totalAmount,
            recentCollections,
        ] = await Promise.all([
            // Total collections count
            Prisma.transaction.count({
                where: {
                    userId: userId,
                    moduleType: "CC_PAYOUT",
                    subModule: "COLLECTION",
                },
            }),

            // Successful collections
            Prisma.transaction.count({
                where: {
                    userId: userId,
                    moduleType: "CC_PAYOUT",
                    subModule: "COLLECTION",
                    status: "SUCCESS",
                },
            }),

            // Pending collections
            Prisma.transaction.count({
                where: {
                    userId: userId,
                    moduleType: "CC_PAYOUT",
                    subModule: "COLLECTION",
                    status: "PENDING",
                },
            }),

            // Total amount processed
            Prisma.transaction.aggregate({
                where: {
                    userId: userId,
                    moduleType: "CC_PAYOUT",
                    subModule: "COLLECTION",
                    status: "SUCCESS",
                },
                _sum: {
                    amount: true,
                },
            }),

            // Recent collections
            Prisma.transaction.findMany({
                where: {
                    userId: userId,
                    moduleType: "CC_PAYOUT",
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
            totalAmount: Number(totalAmount._sum.amount || 0) / 100,
            successRate:
                totalCollections > 0
                    ? (successfulCollections / totalCollections) * 100
                    : 0,
            recentCollections: recentCollections.map((tx) => ({
                collectionId: tx.externalRefId,
                reference: tx.referenceId,
                amount: Number(tx.amount) / 100,
                status: tx.status,
                createdAt: tx.createdAt,
            })),
        };
    }

    /**
     * ✅ Get Decrypted Sender Data (for internal use only)
     */
    async getDecryptedSenderData(userId: string, senderId: string) {
        const senderEntity = await Prisma.apiEntity.findFirst({
            where: {
                entityType: "cc_sender",
                entityId: senderId,
                userId: userId,
                moduleType: "CC_PAYOUT",
            },
        });

        if (!senderEntity) {
            throw ApiError.notFound("Sender not found");
        }

        const metadata = senderEntity.metadata as any;
        const encryptedData = metadata?.encryptedData || {};

        // Decrypt all sensitive data
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

    /**
     * ✅ Get Decrypted Beneficiary Data (for internal use only)
     */
    async getDecryptedBeneficiaryData(userId: string, beneficiaryId: string) {
        const beneficiaryEntity = await Prisma.apiEntity.findFirst({
            where: {
                entityType: "cc_beneficiary",
                entityId: beneficiaryId,
                userId: userId,
                moduleType: "CC_PAYOUT",
            },
        });

        if (!beneficiaryEntity) {
            throw ApiError.notFound("Beneficiary not found");
        }

        const metadata = beneficiaryEntity.metadata as any;
        const encryptedData = metadata?.encryptedData || {};

        // Decrypt sensitive data
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

    /**
     * ✅ UTILITY METHODS
     */

    // Convert objects to JSON-compatible format
    private convertToJsonCompatible(obj: any): any {
        return JSON.parse(JSON.stringify(obj));
    }

    // Safe JSON parse for Prisma metadata
    private safeJsonParse(data: any): any {
        try {
            return JSON.parse(JSON.stringify(data));
        } catch (error) {
            logger.error("JSON conversion error", { error, data });
            return {};
        }
    }

    // Convert payouts to JSON-compatible format
    private convertPayoutsToJson(payouts: PayoutDetail[]): any[] {
        return payouts.map((payout) => this.convertToJsonCompatible(payout));
    }
}

export default CCPayoutService;
