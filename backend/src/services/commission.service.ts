// services/commission.service.ts
import Prisma from "../db/db.js";
import type {
  CreateCommissionEarning,
  CreateOrUpdateCommissionSetting,
} from "../types/commission.types.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import { CommissionType, CommissionScope } from "@prisma/client";

export class CommissionSettingService {
  static async createOrUpdateCommissionSetting(
    data: CreateOrUpdateCommissionSetting,
    createdBy: string
  ) {
    const {
      scope,
      roleId,
      targetUserId,
      serviceId,
      commissionType,
      commissionValue,
      minAmount,
      maxAmount,
      applyTDS,
      tdsPercent,
      applyGST,
      gstPercent,
      effectiveFrom,
      effectiveTo,
    } = data;

    // 1️⃣ Validate scope IDs
    if (scope === CommissionScope.ROLE && !roleId) {
      throw ApiError.badRequest("roleId is required for ROLE scope");
    }
    if (scope === CommissionScope.USER && !targetUserId) {
      throw ApiError.badRequest("targetUserId is required for USER scope");
    }

    // 2️⃣ Validate related entities
    if (serviceId) {
      const service = await Prisma.serviceProvider.findUnique({
        where: { id: serviceId },
      });
      if (!service) throw ApiError.notFound("Service not found");
    }

    if (roleId) {
      const roleExists = await Prisma.role.findUnique({
        where: { id: roleId },
      });
      if (!roleExists) throw ApiError.notFound("Role not found");
    }

    if (targetUserId) {
      const userExists = await Prisma.user.findUnique({
        where: { id: targetUserId },
      });
      if (!userExists) throw ApiError.notFound("Target user not found");
    }

    // 3️⃣ Check if record already exists for same scope + role/user + service
    const existing = await Prisma.commissionSetting.findFirst({
      where: {
        scope,
        roleId: roleId ?? null,
        targetUserId: targetUserId ?? null,
        serviceId: serviceId ?? null,
        isActive: true,
      },
    });

    // ✅ Prepare payload with proper data types
    const payload = {
      scope,
      roleId: roleId ?? null,
      targetUserId: targetUserId ?? null,
      serviceId: serviceId ?? null,
      commissionType,
      commissionValue,
      minAmount: minAmount ? BigInt(minAmount) : null,
      maxAmount: maxAmount ? BigInt(maxAmount) : null,
      applyTDS: applyTDS ?? false,
      tdsPercent: tdsPercent ?? null,
      applyGST: applyGST ?? false,
      gstPercent: gstPercent ?? null,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      createdBy,
      isActive: true,
    };

    let result;
    if (existing) {
      result = await Prisma.commissionSetting.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      result = await Prisma.commissionSetting.create({ data: payload });
    }

    const safeResult = Helper.serializeCommisssion(result);
    return safeResult;
  }

  static async getCommissionSettingsByRoleOrUser(userId?: string) {
    if (!userId) {
      throw ApiError.unauthorized("User ID is required");
    }

    // Get user's role first
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true, hierarchyPath: true }
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Get settings for user's role and any user-specific settings
    const settings = await Prisma.commissionSetting.findMany({
      where: {
        OR: [
          { targetUserId: userId },
          { 
            scope: CommissionScope.ROLE, 
            roleId: user.roleId 
          }
        ],
        isActive: true,
      },
      include: {
        service: {
          select: { id: true, code: true, name: true, isActive: true },
        },
        role: { select: { id: true, name: true, level: true } },
        targetUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const safeResult = Helper.serializeCommisssion(settings);
    return safeResult;
  }

  static async getCommissionSettingsByCreatedBy(userId: string) {
    const settings = await Prisma.commissionSetting.findMany({
      where: {
        createdBy: userId,
        isActive: true,
      },
      include: {
        service: {
          select: {
            id: true,
            type: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const safeResult = Helper.serializeCommisssion(settings);
    return safeResult;
  }

  static async getCommissionSettings(filters: {
    scope?: CommissionScope;
    roleId?: string;
    targetUserId?: string;
    serviceId?: string;
    isActive?: boolean;
  }) {
    const { scope, roleId, targetUserId, serviceId, isActive = true } = filters;

    const settings = await Prisma.commissionSetting.findMany({
      where: {
        ...(scope ? { scope } : {}),
        ...(roleId ? { roleId } : {}),
        ...(targetUserId ? { targetUserId } : {}),
        ...(serviceId ? { serviceId } : {}),
        isActive,
      },
      include: {
        service: {
          select: { id: true, code: true, name: true, isActive: true },
        },
        role: { select: { id: true, name: true, level: true } },
        targetUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const safeResult = Helper.serializeCommisssion(settings);
    return safeResult;
  }

  static async deactivateCommissionSetting(id: string) {
    const setting = await Prisma.commissionSetting.findUnique({
      where: { id },
    });

    if (!setting) {
      throw ApiError.notFound("Commission setting not found");
    }

    const updated = await Prisma.commissionSetting.update({
      where: { id },
      data: { isActive: false },
    });

    return updated;
  }
}

export class CommissionEarningService {
  static async createCommissionEarning(data: CreateCommissionEarning) {
    const {
      userId,
      fromUserId,
      serviceId,
      transactionId,
      amount,
      commissionAmount,
      commissionType,
      tdsAmount = 0,
      gstAmount = 0,
      netAmount,
      metadata,
      createdBy,
    } = data;

    // 1️⃣ Validate existence of referenced records
    const [user, transaction, createdByUser] = await Promise.all([
      Prisma.user.findUnique({ where: { id: userId } }),
      Prisma.transaction.findUnique({ where: { id: transactionId } }),
      Prisma.user.findUnique({ where: { id: createdBy } }),
    ]);

    if (!user) throw ApiError.notFound("User not found");
    if (!transaction) throw ApiError.notFound("Transaction not found");
    if (!createdByUser) throw ApiError.notFound("Created by user not found");

    // Validate fromUser if provided
    if (fromUserId) {
      const fromUser = await Prisma.user.findUnique({
        where: { id: fromUserId },
      });
      if (!fromUser) throw ApiError.notFound("From user not found");
    }

    // Validate service if provided
    if (serviceId) {
      const service = await Prisma.serviceProvider.findUnique({
        where: { id: serviceId },
      });
      if (!service) throw ApiError.notFound("Service not found");
    }

    // 2️⃣ Create record with proper BigInt conversion
    const earning = await Prisma.commissionEarning.create({
      data: {
        userId,
        fromUserId: fromUserId ?? null,
        serviceId: serviceId ?? null,
        transactionId,
        amount: BigInt(amount),
        commissionAmount: BigInt(commissionAmount),
        commissionType,
        tdsAmount: BigInt(tdsAmount),
        gstAmount: BigInt(gstAmount),
        netAmount: BigInt(netAmount),
        metadata: metadata ?? null,
        createdBy,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        fromUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            id: true,
            type: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        transaction: {
          select: {
            id: true,
            referenceId: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    const safeResult = Helper.serializeCommisssion(earning);
    return safeResult;
  }

  static async getCommissionEarnings(filters: {
    userId?: string;
    fromUserId?: string;
    serviceId?: string;
    transactionId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { userId, fromUserId, serviceId, transactionId, startDate, endDate } =
      filters;

    const whereClause: any = {
      ...(userId ? { userId } : {}),
      ...(fromUserId ? { fromUserId } : {}),
      ...(serviceId ? { serviceId } : {}),
      ...(transactionId ? { transactionId } : {}),
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const earnings = await Prisma.commissionEarning.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        fromUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            id: true,
            type: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        transaction: {
          select: {
            id: true,
            referenceId: true,
            amount: true,
            status: true,
            paymentType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const safeResult = Helper.serializeCommisssion(earnings);
    return safeResult;
  }

  static async getCommissionSummary(
    userId: string,
    period?: { startDate: string; endDate: string }
  ) {
    const whereClause: any = { userId };

    if (period) {
      whereClause.createdAt = {
        gte: new Date(period.startDate),
        lte: new Date(period.endDate),
      };
    }

    const earnings = await Prisma.commissionEarning.findMany({
      where: whereClause,
      select: {
        commissionAmount: true,
        tdsAmount: true,
        gstAmount: true,
        netAmount: true,
        commissionType: true,
        createdAt: true,
        service: {
          select: {
            type: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert BigInt to Number for summary calculations
    const totalCommission = earnings.reduce(
      (sum, earning) => sum + Number(earning.commissionAmount),
      0
    );
    const totalTDS = earnings.reduce(
      (sum, earning) => sum + Number(earning.tdsAmount || BigInt(0)),
      0
    );
    const totalGST = earnings.reduce(
      (sum, earning) => sum + Number(earning.gstAmount || BigInt(0)),
      0
    );
    const totalNet = earnings.reduce(
      (sum, earning) => sum + Number(earning.netAmount),
      0
    );

    const summary = {
      totalCommission,
      totalTDS,
      totalGST,
      totalNet,
      transactionCount: earnings.length,
      earningsByService: earnings.reduce(
        (acc, earning) => {
          const serviceType = earning.service?.type || "Unknown";
          acc[serviceType] = (acc[serviceType] || 0) + Number(earning.netAmount);
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return summary;
  }
}