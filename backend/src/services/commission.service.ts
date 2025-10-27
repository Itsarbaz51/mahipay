import Prisma from "../db/db.js";
import type {
  CreateCommissionEarning,
  CreateOrUpdateCommissionSetting,
} from "../types/commission.types.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import { CommissionScope, ModuleType } from "@prisma/client";

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
      moduleType,
      subModule,
      commissionType,
      commissionValue,
      minAmount,
      maxAmount,
      minUserLevel,
      applyTDS,
      tdsPercent,
      applyGST,
      gstPercent,
      channel,
      userLevel,
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

    // 3️⃣ Validate and convert moduleType to enum
    const validatedModuleType = moduleType as ModuleType;
    if (!Object.values(ModuleType).includes(validatedModuleType)) {
      throw ApiError.badRequest(`Invalid moduleType: ${moduleType}`);
    }

    // 4️⃣ Check if record already exists for same scope + role/user + service + module
    const existing = await Prisma.commissionSetting.findFirst({
      where: {
        scope,
        roleId: roleId ?? null,
        targetUserId: targetUserId ?? null,
        serviceId: serviceId ?? null,
        moduleType: validatedModuleType,
        subModule: subModule ?? null,
      },
    });

    // ✅ Prepare payload with proper enum types
    const payload = {
      scope,
      roleId: roleId ?? null,
      targetUserId: targetUserId ?? null,
      serviceId: serviceId ?? null,
      moduleType: validatedModuleType,
      subModule: subModule ?? null,
      commissionType,
      commissionValue,
      minAmount: minAmount ? BigInt(minAmount) : null,
      maxAmount: maxAmount ? BigInt(maxAmount) : null,
      minUserLevel: minUserLevel ?? null,
      applyTDS: applyTDS ?? false,
      tdsPercent: tdsPercent ?? null,
      applyGST: applyGST ?? false,
      gstPercent: gstPercent ?? null,
      channel: channel ?? null,
      userLevel: userLevel ?? null,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      createdBy,
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

    const safeResult = Helper.serializeUser(result);
    return safeResult;
  }

  static async getCommissionSettingsByRoleOrUser(userId?: string) {
    const whereClause: any = {
      isActive: true,
    };

    if (userId) {
      whereClause.OR = [
        { targetUserId: userId },
        {
          scope: CommissionScope.ROLE,
          role: {
            users: {
              some: { id: userId },
            },
          },
        },
      ];
    }

    const settings = await Prisma.commissionSetting.findMany({
      where: whereClause,
      include: {
        service: {
          select: { id: true, code: true, type: true, isActive: true },
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

    const safeResult = Helper.serializeUser(settings);
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

    const safeResult = Helper.serializeUser(settings);
    return safeResult;
  }
}

export class CommissionEarningService {
  static async createCommissionEarning(data: CreateCommissionEarning) {
    const {
      userId,
      fromUserId,
      serviceId,
      transactionId,
      moduleType,
      subModule,
      amount,
      commissionAmount,
      commissionType,
      level,
      tdsAmount,
      gstAmount,
      netAmount,
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

    // Validate optional relations
    if (fromUserId) {
      const fromUser = await Prisma.user.findUnique({
        where: { id: fromUserId },
      });
      if (!fromUser) throw ApiError.notFound("From user not found");
    }

    if (serviceId) {
      const service = await Prisma.serviceProvider.findUnique({
        where: { id: serviceId },
      });
      if (!service) throw ApiError.notFound("Service not found");
    }

    // 2️⃣ Validate and convert moduleType to enum
    const validatedModuleType = moduleType as ModuleType;
    if (!Object.values(ModuleType).includes(validatedModuleType)) {
      throw ApiError.badRequest(`Invalid moduleType: ${moduleType}`);
    }

    // 3️⃣ Prevent duplicate record for same transaction + level + user
    const existing = await Prisma.commissionEarning.findFirst({
      where: {
        userId,
        transactionId,
        level,
      },
    });

    if (existing) {
      throw ApiError.badRequest(
        "Commission earning already recorded for this transaction, user and level"
      );
    }

    // 4️⃣ Create record with proper enum types
    const earning = await Prisma.commissionEarning.create({
      data: {
        userId,
        fromUserId: fromUserId ?? null,
        serviceId: serviceId ?? null,
        transactionId,
        moduleType: validatedModuleType,
        subModule: subModule ?? null,
        amount: BigInt(amount),
        commissionAmount: BigInt(commissionAmount),
        commissionType,
        level,
        tdsAmount: tdsAmount ? BigInt(tdsAmount) : null,
        gstAmount: gstAmount ? BigInt(gstAmount) : null,
        netAmount: BigInt(netAmount),
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
          select: { id: true, type: true, code: true, isActive: true },
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
          select: { id: true, referenceId: true, amount: true, status: true },
        },
      },
    });

    const safeResult = Helper.serializeUser(earning);
    return safeResult;
  }

  static async getCommissionEarnings(filters: {
    userId?: string;
    fromUserId?: string;
    serviceId?: string;
    transactionId?: string;
    moduleType?: ModuleType;
  }) {
    const { userId, fromUserId, serviceId, transactionId, moduleType } =
      filters;

    const whereClause: any = {};

    if (userId) whereClause.userId = userId;
    if (fromUserId) whereClause.fromUserId = fromUserId;
    if (serviceId) whereClause.serviceId = serviceId;
    if (transactionId) whereClause.transactionId = transactionId;
    if (moduleType) whereClause.moduleType = moduleType;

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
          select: { id: true, type: true, code: true, isActive: true },
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
            moduleType: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const safeResult = Helper.serializeUser(earnings);
    return safeResult;
  }
}
