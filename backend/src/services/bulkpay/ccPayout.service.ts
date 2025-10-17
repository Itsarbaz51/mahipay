import Prisma from "../../db/db.js";
import type {
  CCBeneficiary,
  CCCollection,
  CCSender,
  CreateBeneficiaryInput,
  CreateCollectionInput,
  CreateSenderInput,
  ListBeneficiariesQuery,
  ListCollectionsQuery,
  ListSendersQuery,
} from "../../types/bulkpay/ccPayout.types.js";
import { ApiError } from "../../utils/ApiError.js";
import { BulkpeAPIClient } from "../../utils/BulkpeAPIClient.js";

class CCPayoutServices {
  private static bulkpeClient = new BulkpeAPIClient();
  private static async generateSequentialReferenceId(
    prefix: string
  ): Promise<string> {
    // Find the highest existing reference ID with this prefix
    const latestSender = await Prisma.cCSender.findFirst({
      where: {
        referenceId: {
          startsWith: prefix,
        },
      },
      orderBy: {
        referenceId: "desc",
      },
      select: {
        referenceId: true,
      },
    });

    let nextNumber = 1;

    if (latestSender && latestSender.referenceId) {
      // Extract the number part from reference ID (e.g., "ref003" -> 3)
      const match = latestSender.referenceId.match(
        new RegExp(`${prefix}(\\d+)`)
      );
      if (match && match[1]) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format with leading zeros (ref001, ref002, ..., ref010, etc.)
    const sequence = nextNumber.toString().padStart(3, "0");
    return `${prefix}${sequence}`;
  }
  
  // Sender Services
  static async createSender(
    userId: string,
    payload: CreateSenderInput
  ): Promise<CCSender> {
    // Check if referenceId already exists
    let referenceId = payload.referenceId;

    if (!referenceId) {
      referenceId = await this.generateSequentialReferenceId("ref");
    } else {
      // Check if provided referenceId already exists
      const existingSender = await Prisma.cCSender.findUnique({
        where: { cardNo: payload.cardNo, pan: payload.pan },
      });

      if (existingSender) {
        throw ApiError.conflict("Sender with this pan & card already exists");
      }
    }

    // Call Bulkpe API
    const bulkpeResponse = await this.bulkpeClient.createSender(payload);

    // Create sender in database
    const sender = await Prisma.cCSender.create({
      data: {
        senderId: bulkpeResponse.senderId,
        referenceId: payload.referenceId,
        userId,
        name: payload.name,
        nameInPan: bulkpeResponse.nameInPan,
        pan: payload.pan,
        aadhar: payload.aadhar || null,
        phone: payload.phone,
        cardNo: payload.cardNo,
        cvv: payload.cvv,
        expiry: payload.expiry,
        cardType: this.mapCardType(payload.cardNo),
        charge: bulkpeResponse.charge,
        gst: bulkpeResponse.gst,
        isActive: bulkpeResponse.isActive,
        status: bulkpeResponse.isActive ? "ACTIVE" : "PENDING",
      },
    });

    return sender;
  }

  static async uploadCardImage(
    senderId: string,
    cardImageType: "front" | "back",
    file: Express.Multer.File
  ): Promise<CCSender> {
    const sender = await Prisma.cCSender.findUnique({
      where: { id: senderId },
    });

    if (!sender) {
      throw ApiError.notFound("Sender not found");
    }

    // Upload to Bulkpe API
    const uploadResponse = await this.bulkpeClient.uploadCardImage(
      sender.senderId,
      cardImageType,
      file
    );

    // Update sender with image URL
    const updatedSender = await Prisma.cCSender.update({
      where: { id: senderId },
      data: {
        ...(cardImageType === "front" && {
          cardFrontImage: uploadResponse.cardFrontImage,
        }),
        ...(cardImageType === "back" && {
          cardBackImage: uploadResponse.cardBackImage,
        }),
      },
    });

    return updatedSender;
  }

  static async listSenders(
    userId: string,
    query: ListSendersQuery
  ): Promise<{ senders: CCSender[]; total: number }> {
    const { page = 1, limit = 10, referenceId, senderId } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(referenceId && { referenceId }),
      ...(senderId && { senderId }),
    };

    const [senders, total] = await Promise.all([
      Prisma.cCSender.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      Prisma.cCSender.count({ where }),
    ]);

    return { senders, total };
  }

  // Beneficiary Services
  static async createBeneficiary(
    userId: string,
    payload: CreateBeneficiaryInput
  ): Promise<CCBeneficiary> {
    // Check if reference already exists
    const existingBeneficiary = await Prisma.cCBeneficiary.findUnique({
      where: { reference: payload.reference },
    });

    if (existingBeneficiary) {
      throw ApiError.conflict("Beneficiary with this reference already exists");
    }

    // Call Bulkpe API
    const bulkpeResponse = await this.bulkpeClient.createBeneficiary(payload);

    // Create beneficiary in database
    const beneficiary = await Prisma.cCBeneficiary.create({
      data: {
        beneficiaryId: bulkpeResponse.beneficiaryId,
        reference: payload.reference,
        userId,
        name: payload.name,
        accountNumber: payload.accountNumber,
        ifsc: payload.ifsc,
        status: this.mapBeneficiaryStatus(bulkpeResponse.status),
        message: bulkpeResponse.message,
      },
    });

    return beneficiary;
  }

  static async listBeneficiaries(
    userId: string,
    query: ListBeneficiariesQuery
  ): Promise<{ beneficiaries: CCBeneficiary[]; total: number }> {
    const { page = 1, limit = 10, status, reference, beneficiaryId } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
      ...(reference && { reference }),
      ...(beneficiaryId && { beneficiaryId }),
    };

    const [beneficiaries, total] = await Promise.all([
      Prisma.cCBeneficiary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      Prisma.cCBeneficiary.count({ where }),
    ]);

    return { beneficiaries, total };
  }

  // Collection Services
  static async createCollection(
    userId: string,
    payload: CreateCollectionInput
  ): Promise<CCCollection> {
    // Verify sender and beneficiary belong to user
    const [sender, beneficiary] = await Promise.all([
      Prisma.cCSender.findFirst({
        where: { id: payload.senderId, userId },
      }),
      Prisma.cCBeneficiary.findFirst({
        where: { id: payload.beneficiaryId, userId },
      }),
    ]);

    if (!sender) {
      throw ApiError.notFound("Sender not found or access denied");
    }

    if (!beneficiary) {
      throw ApiError.notFound("Beneficiary not found or access denied");
    }

    // Check if reference already exists
    const existingCollection = await Prisma.cCCollection.findUnique({
      where: { reference: payload.reference },
    });

    if (existingCollection) {
      throw ApiError.conflict("Collection with this reference already exists");
    }

    // Call Bulkpe API
    const bulkpeResponse = await this.bulkpeClient.createCollection({
      reference: payload.reference,
      beneficiaryId: beneficiary.beneficiaryId,
      senderId: sender.senderId,
      amount: payload.amount,
      type: payload.type,
      redirectUrl: payload.redirectUrl,
      cardType: payload.cardType,
      additionalCharge: payload.additionalCharge,
    });

    // Create collection in database
    const collection = await Prisma.cCCollection.create({
      data: {
        collectionId: bulkpeResponse.collectionId,
        reference: payload.reference,
        userId,
        senderId: payload.senderId,
        beneficiaryId: payload.beneficiaryId,
        amount: payload.amount,
        type: payload?.type === 1 ? "INSTANT" : "T_PLUS_1",
        redirectUrl: payload.redirectUrl,
        cardType: payload.cardType.toUpperCase() as any,
        additionalCharge: payload.additionalCharge,
        collectionUrl: bulkpeResponse.collectionUrl,
        status: this.mapCollectionStatus(bulkpeResponse.status),
        message: bulkpeResponse.message,
        charge: bulkpeResponse.charge,
        gst: bulkpeResponse.gst,
      },
      include: {
        payouts: true,
      },
    });

    // Create payouts
    if (bulkpeResponse.payouts && bulkpeResponse.payouts.length > 0) {
      await Prisma.cCPayout.createMany({
        data: bulkpeResponse.payouts.map((payout) => ({
          collectionId: collection.id,
          transactionId: payout.transactionId,
          amount: payout.amount,
          accountNumber: payout.accountNumber,
          ifsc: payout.ifsc,
          beneficiaryName: payout.beneficiaryName,
          status: this.mapTxStatus(payout.status),
          message: payout.message,
          paymentMode: payout.paymentMode,
          utr: payout.utr,
          holderName: payout.holderName,
        })),
      });
    }

    return this.getCollectionWithPayouts(collection.id);
  }

  static async listCollections(
    userId: string,
    query: ListCollectionsQuery
  ): Promise<{ collections: CCCollection[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      beneficiaryId,
      reference,
      collectionId,
    } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(beneficiaryId && { beneficiaryId }),
      ...(reference && { reference }),
      ...(collectionId && { collectionId }),
    };

    const [collections, total] = await Promise.all([
      Prisma.cCCollection.findMany({
        where,
        skip,
        take: limit,
        include: {
          payouts: true,
          sender: true,
          beneficiary: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      Prisma.cCCollection.count({ where }),
    ]);

    return { collections, total };
  }

  // Helper methods
  private static async getCollectionWithPayouts(
    collectionId: string
  ): Promise<CCCollection> {
    return Prisma.cCCollection.findUnique({
      where: { id: collectionId },
      include: {
        payouts: true,
        sender: true,
        beneficiary: true,
      },
    }) as Promise<CCCollection>;
  }

  private static mapCardType(cardNo: string): "VISA" | "RUPAY" | "MASTER" {
    if (cardNo.startsWith("4")) return "VISA";
    if (cardNo.startsWith("6")) return "RUPAY";
    return "MASTER";
  }

  private static mapBeneficiaryStatus(
    status: string
  ): "PENDING" | "ACTIVE" | "FAILED" | "SUCCESS" {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "ACTIVE";
      case "FAILED":
        return "FAILED";
      case "SUCCESS":
        return "SUCCESS";
      default:
        return "PENDING";
    }
  }

  private static mapCollectionStatus(
    status: string
  ): "PENDING" | "SUCCESS" | "FAILED" | "PROCESSING" | "CANCELLED" {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "SUCCESS";
      case "FAILED":
        return "FAILED";
      case "PROCESSING":
        return "PROCESSING";
      case "CANCELLED":
        return "CANCELLED";
      default:
        return "PENDING";
    }
  }

  private static mapTxStatus(
    status: string
  ): "PENDING" | "SUCCESS" | "FAILED" | "REVERSED" | "REFUNDED" | "CANCELLED" {
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return "SUCCESS";
      case "FAILED":
        return "FAILED";
      case "REVERSED":
        return "REVERSED";
      case "REFUNDED":
        return "REFUNDED";
      case "CANCELLED":
        return "CANCELLED";
      default:
        return "PENDING";
    }
  }
}

export default CCPayoutServices;
