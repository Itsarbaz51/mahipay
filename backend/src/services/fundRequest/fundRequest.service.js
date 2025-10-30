import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import S3Service from "../utils/S3Service.js";
import Helper from "../utils/helper.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class FundRequestService {
  // List fund requests with filters - Transaction model use karenge
  static async listFundRequests(params, user) {
    const {
      status = "ALL",
      page = 1,
      limit = 10,
      sort = "desc",
      search,
      paymentType,
      startDate,
      endDate,
    } = params;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build where clause based on user role
    let where = {};

    if (user.role.name === "ADMIN") {
      // Admin can see all requests from their sub-users
      const childUsers = await Prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });

      const childUserIds = childUsers.map((u) => u.id);
      if (childUserIds.length === 0) {
        return {
          data: [],
          meta: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
        };
      }
      where.userId = { in: childUserIds };
    } else {
      // Regular users can only see their own requests
      where.userId = user.id;
    }

    // Fund requests ko filter karenge - FUND_REQ_BANK ya FUND_REQ_RAZORPAY paymentType wale
    where.paymentType = {
      in: ["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"],
    };

    // Apply filters
    if (status && status !== "ALL") {
      where.status = status;
    }

    if (paymentType) {
      where.paymentType = paymentType;
    }

    if (search) {
      where.OR = [
        { referenceId: { contains: search } },
        { externalRefId: { contains: search } },
        { providerReference: { contains: search } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
      ];
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch transactions as fund requests
    const fundRequests = await Prisma.transaction.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        wallet: {
          select: {
            id: true,
            walletType: true,
          },
        },
      },
    });

    const total = await Prisma.transaction.count({ where });

    // Format response
    const formattedData = fundRequests.map((request) => ({
      id: request.id,
      referenceId: request.referenceId,
      externalRefId: request.externalRefId,
      amount: Number(request.amount),
      netAmount: Number(request.netAmount),
      paymentType: request.paymentType,
      status: request.status,
      provider: request.service?.code || "MANUAL",
      providerReference: request.providerReference,
      user: {
        id: request.user.id,
        name: `${request.user.firstName} ${request.user.lastName}`,
        phone: request.user.phoneNumber,
        email: request.user.email,
      },
      wallet: {
        id: request.wallet.id,
        type: request.wallet.walletType,
      },
      metadata: request.metadata,
      createdAt: request.createdAt,
      processedAt: request.processedAt,
      completedAt: request.completedAt,
    }));

    return {
      data: formattedData,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // Get single fund request by ID
  static async getFundRequestById(id, user) {
    const fundRequest = await Prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        wallet: {
          select: {
            id: true,
            walletType: true,
            balance: true,
          },
        },
        service: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!fundRequest) {
      throw ApiError.notFound("Fund request not found");
    }

    // Check permissions
    if (user.role.name !== "ADMIN" && fundRequest.userId !== user.id) {
      throw ApiError.forbidden("Access denied");
    }

    // Check if it's a fund request type
    if (
      !["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"].includes(fundRequest.paymentType)
    ) {
      throw ApiError.badRequest("This is not a fund request");
    }

    return {
      id: fundRequest.id,
      referenceId: fundRequest.referenceId,
      externalRefId: fundRequest.externalRefId,
      amount: Number(fundRequest.amount),
      netAmount: Number(fundRequest.netAmount),
      paymentType: fundRequest.paymentType,
      status: fundRequest.status,
      provider: fundRequest.service?.code || "MANUAL",
      providerReference: fundRequest.providerReference,
      user: {
        id: fundRequest.user.id,
        name: `${fundRequest.user.firstName} ${fundRequest.user.lastName}`,
        phone: fundRequest.user.phoneNumber,
        email: fundRequest.user.email,
      },
      wallet: {
        id: fundRequest.wallet.id,
        type: fundRequest.wallet.walletType,
        balance: Number(fundRequest.wallet.balance),
      },
      metadata: fundRequest.metadata,
      requestPayload: fundRequest.requestPayload,
      responsePayload: fundRequest.responsePayload,
      createdAt: fundRequest.createdAt,
      processedAt: fundRequest.processedAt,
      completedAt: fundRequest.completedAt,
    };
  }

  // Create new fund request - Transaction model mein create karenge
  static async createFundRequest(payload, user, files) {
    const {
      amount,
      provider,
      paymentId,
      orderId,
      rrn,
      transactionDate,
      notes,
    } = payload;

    // Validation
    if (!amount || !provider) {
      throw ApiError.badRequest("Amount and provider are required");
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw ApiError.badRequest("Amount must be a valid number greater than 0");
    }

    // Get user's primary wallet
    const userWallet = await Prisma.wallet.findFirst({
      where: {
        userId: user.id,
        walletType: "PRIMARY",
      },
    });

    if (!userWallet) {
      throw ApiError.notFound("User wallet not found");
    }

    // Check for duplicates
    const existingRequest = await Prisma.transaction.findFirst({
      where: {
        OR: [
          { referenceId: paymentId || "" },
          { externalRefId: orderId || "" },
          { providerReference: rrn || "" },
        ].filter((condition) => Object.values(condition)[0] !== ""),
        paymentType: {
          in: ["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"],
        },
      },
    });

    if (existingRequest) {
      throw ApiError.conflict("This fund request already exists");
    }

    // Upload payment image if provided
    let paymentImageUrl = null;
    if (files?.paymentImage?.[0]) {
      paymentImageUrl = await S3Service.upload(
        files.paymentImage[0].path,
        "fund-requests"
      );
      await Helper.deleteOldImage(files.paymentImage[0].path);
    }

    // Determine payment type and service
    let paymentType, serviceCode, serviceId;

    if (provider === "BANK_TRANSFER") {
      paymentType = "FUND_REQ_BANK";
      serviceCode = "BANK_TRANSFER";
    } else if (provider === "RAZORPAY") {
      paymentType = "FUND_REQ_RAZORPAY";
      serviceCode = "RAZORPAY";
    }

    // Get or create service provider
    let service = await Prisma.serviceProvider.findFirst({
      where: { code: serviceCode },
    });

    if (!service) {
      service = await Prisma.serviceProvider.create({
        data: {
          type: "FUND_REQUEST",
          code: serviceCode,
          name: serviceCode,
          createdBy: user.id,
          isActive: true,
        },
      });
    }

    // Create transaction as fund request
    const fundRequest = await Prisma.transaction.create({
      data: {
        referenceId: paymentId || `FUND_${Date.now()}`,
        externalRefId: orderId,
        providerReference: rrn,
        amount: amountNum,
        netAmount: amountNum,
        currency: "INR",
        status: "PENDING",
        paymentType: paymentType,

        userId: user.id,
        walletId: userWallet.id,
        serviceId: service.id,

        requestPayload: {
          provider,
          amount: amountNum,
          rrn,
          transactionDate,
          notes,
          paymentImage: paymentImageUrl,
        },
        metadata: {
          provider,
          rrn,
          transactionDate: transactionDate || new Date().toISOString(),
          paymentImage: paymentImageUrl,
          createdAt: new Date().toISOString(),
        },

        initiatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        wallet: {
          select: {
            walletType: true,
          },
        },
      },
    });

    return {
      id: fundRequest.id,
      referenceId: fundRequest.referenceId,
      amount: Number(fundRequest.amount),
      paymentType: fundRequest.paymentType,
      status: fundRequest.status,
      provider: serviceCode,
      createdAt: fundRequest.createdAt,
    };
  }

  // Update fund request status (admin only) - Transaction status update karenge
  static async updateFundRequestStatus(id, payload, user) {
    if (user.role.name !== "ADMIN") {
      throw ApiError.forbidden("Only admins can update fund request status");
    }

    const { status, rejectionReason } = payload;

    const fundRequest = await Prisma.transaction.findUnique({
      where: { id },
      include: {
        user: true,
        wallet: true,
      },
    });

    if (!fundRequest) {
      throw ApiError.notFound("Fund request not found");
    }

    if (
      !["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"].includes(fundRequest.paymentType)
    ) {
      throw ApiError.badRequest("This is not a fund request");
    }

    if (fundRequest.status !== "PENDING") {
      throw ApiError.badRequest("This fund request is already processed");
    }

    const updateData = {
      status,
      ...(status === "SUCCESS"
        ? { processedAt: new Date(), completedAt: new Date() }
        : {}),
      ...(status === "FAILED" ? { processedAt: new Date() } : {}),
    };

    // If approved, update user wallet balance via ledger
    if (status === "SUCCESS") {
      // Update wallet balance
      await Prisma.wallet.update({
        where: { id: fundRequest.walletId },
        data: {
          balance: { increment: fundRequest.amount },
          availableBalance: { increment: fundRequest.amount },
        },
      });

      // Create ledger entry
      await Prisma.ledgerEntry.create({
        data: {
          transactionId: fundRequest.id,
          walletId: fundRequest.walletId,
          entryType: "CREDIT",
          referenceType: "TRANSACTION",
          amount: fundRequest.amount,
          runningBalance: fundRequest.wallet.balance + fundRequest.amount,
          narration: `Funds added via ${fundRequest.paymentType === "FUND_REQ_BANK" ? "Bank Transfer" : "Razorpay"}`,
          createdBy: user.id,
        },
      });

      // Update metadata with approval info
      updateData.metadata = {
        ...fundRequest.metadata,
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
        rejectionReason: null,
      };
    } else if (status === "FAILED") {
      updateData.metadata = {
        ...fundRequest.metadata,
        rejectedBy: user.id,
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectionReason || "Request rejected by admin",
      };
    }

    const updatedRequest = await Prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updatedRequest.id,
      status: updatedRequest.status,
      updatedAt: updatedRequest.updatedAt,
    };
  }

  // Verify Razorpay payment
  static async verifyRazorpayPayment(payload, user) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      payload;

    // Find the pending fund request
    const fundRequest = await Prisma.transaction.findFirst({
      where: {
        externalRefId: razorpay_order_id,
        userId: user.id,
        paymentType: "FUND_REQ_RAZORPAY",
        status: "PENDING",
      },
    });

    if (!fundRequest) {
      throw ApiError.notFound("Order not found or already processed");
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw ApiError.badRequest(
        "Invalid signature, payment verification failed"
      );
    }

    // Update fund request with payment ID
    await Prisma.transaction.update({
      where: { id: fundRequest.id },
      data: {
        referenceId: razorpay_payment_id,
        providerReference: razorpay_payment_id,
        metadata: {
          ...fundRequest.metadata,
          razorpayPaymentId: razorpay_payment_id,
          verifiedAt: new Date().toISOString(),
        },
      },
    });

    return {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      status: "PENDING", // Wait for admin approval
    };
  }

  // Create Razorpay order
  static async createRazorpayOrder(payload, user) {
    const { amount } = payload;

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      throw ApiError.badRequest("Amount must be greater than zero");
    }

    // Check user limits (if any)
    // You can implement limit checks here based on your business logic

    const options = {
      amount: amountNum * 100, // in paise
      currency: "INR",
      receipt: `wallet_${Date.now()}`,
      notes: { userId: user.id },
    };

    const order = await razorpay.orders.create(options);

    // Get user's primary wallet
    const userWallet = await Prisma.wallet.findFirst({
      where: {
        userId: user.id,
        walletType: "PRIMARY",
      },
    });

    if (!userWallet) {
      throw ApiError.notFound("User wallet not found");
    }

    // Get or create Razorpay service provider
    let service = await Prisma.serviceProvider.findFirst({
      where: { code: "RAZORPAY" },
    });

    if (!service) {
      service = await Prisma.serviceProvider.create({
        data: {
          type: "FUND_REQUEST",
          code: "RAZORPAY",
          name: "Razorpay",
          createdBy: user.id,
          isActive: true,
        },
      });
    }

    // Create pending fund request transaction
    await Prisma.transaction.create({
      data: {
        referenceId: `RZP_${Date.now()}`,
        externalRefId: order.id,
        amount: amountNum,
        netAmount: amountNum,
        currency: "INR",
        status: "PENDING",
        paymentType: "FUND_REQ_RAZORPAY",

        userId: user.id,
        walletId: userWallet.id,
        serviceId: service.id,

        requestPayload: {
          provider: "RAZORPAY",
          amount: amountNum,
          razorpayOrder: order,
        },
        metadata: {
          provider: "RAZORPAY",
          razorpayOrderId: order.id,
          createdAt: new Date().toISOString(),
        },

        initiatedAt: new Date(),
      },
    });

    return {
      id: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      receipt: order.receipt,
    };
  }

  // Get wallet balance
  static async getWalletBalance(user) {
    const wallet = await Prisma.wallet.findFirst({
      where: {
        userId: user.id,
        walletType: "PRIMARY",
      },
      select: {
        balance: true,
        availableBalance: true,
        holdBalance: true,
      },
    });

    if (!wallet) {
      throw ApiError.notFound("Wallet not found");
    }

    return {
      balance: Number(wallet.balance),
      availableBalance: Number(wallet.availableBalance),
      holdBalance: Number(wallet.holdBalance),
    };
  }

  // Get fund request statistics
  static async getFundRequestStats(user) {
    let userIds = [user.id];

    if (user.role.name === "ADMIN") {
      const childUsers = await Prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      userIds = childUsers.map((u) => u.id);
    }

    const stats = await Prisma.transaction.groupBy({
      by: ["status"],
      where: {
        userId: { in: userIds },
        paymentType: {
          in: ["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"],
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    const totalStats = await Prisma.transaction.aggregate({
      where: {
        userId: { in: userIds },
        paymentType: {
          in: ["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"],
        },
      },
      _count: { id: true },
      _sum: { amount: true },
    });

    return {
      total: totalStats._count.id,
      totalAmount: Number(totalStats._sum.amount || 0),
      byStatus: stats.map((stat) => ({
        status: stat.status,
        count: stat._count.id,
        amount: Number(stat._sum.amount || 0),
      })),
    };
  }

  // Delete fund request
  static async deleteFundRequest(id, user) {
    const fundRequest = await Prisma.transaction.findUnique({
      where: { id },
    });

    if (!fundRequest) {
      throw ApiError.notFound("Fund request not found");
    }

    if (
      !["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"].includes(fundRequest.paymentType)
    ) {
      throw ApiError.badRequest("This is not a fund request");
    }

    if (user.role.name !== "ADMIN" && fundRequest.userId !== user.id) {
      throw ApiError.forbidden("Access denied");
    }

    if (fundRequest.status !== "PENDING") {
      throw ApiError.badRequest("Only pending requests can be deleted");
    }

    await Prisma.transaction.delete({
      where: { id },
    });

    return { message: "Fund request deleted successfully" };
  }

  // Reject and refund topup (Razorpay specific)
  static async rejectAndRefundTopup(id, user) {
    if (user.role.name !== "ADMIN") {
      throw ApiError.forbidden("Only admins can reject and refund topups");
    }

    const fundRequest = await Prisma.transaction.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!fundRequest) {
      throw ApiError.notFound("Fund request not found");
    }

    if (fundRequest.paymentType !== "FUND_REQ_RAZORPAY") {
      throw ApiError.badRequest("Only Razorpay payments can be refunded");
    }

    if (fundRequest.status !== "PENDING") {
      throw ApiError.badRequest("This fund request is already processed");
    }

    // Process refund via Razorpay
    try {
      const refund = await razorpay.payments.refund(fundRequest.referenceId, {
        amount: fundRequest.amount * 100,
        speed: "normal",
      });

      // Update transaction status to REFUNDED
      await Prisma.transaction.update({
        where: { id },
        data: {
          status: "REFUNDED",
          metadata: {
            ...fundRequest.metadata,
            refundId: refund.id,
            refundedAt: new Date().toISOString(),
            refundedBy: user.id,
          },
        },
      });

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
      };
    } catch (error) {
      throw ApiError.badRequest(`Refund failed: ${error.message}`);
    }
  }
}

export default FundRequestService;
