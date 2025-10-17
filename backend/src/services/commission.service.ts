import Prisma from "../db/db.js";
import type {
  CreateCommissionEarning,
  CreateOrUpdateCommissionSetting,
} from "../types/commission.types.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";

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
    if (scope === "ROLE" && !roleId) {
      throw ApiError.badRequest("roleId is required for ROLE scope");
    }
    if (scope === "USER" && !targetUserId) {
      throw ApiError.badRequest("targetUserId is required for USER scope");
    }

    // 2️⃣ Validate related entities
    const service = await Prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw ApiError.notFound("Service not found");

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
        serviceId,
      },
    });

    // ✅ Normalize undefined → null
    const payload = {
      scope,
      roleId: roleId ?? null,
      targetUserId: targetUserId ?? null,
      serviceId,
      commissionType,
      commissionValue,
      minAmount: minAmount ?? null,
      maxAmount: maxAmount ?? null,
      applyTDS: applyTDS ?? false,
      tdsPercent: tdsPercent ?? null,
      applyGST: applyGST ?? false,
      gstPercent: gstPercent ?? null,
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

  static async getCommissionSettingsByRoleOrUser(
    roleId?: string,
    userId?: string
  ) {
    const settings = await Prisma.commissionSetting.findMany({
      where: {
        OR: [
          ...(roleId ? [{ roleId }] : []),
          ...(userId ? [{ targetUserId: userId }] : []),
        ],
        isActive: true,
      },
      include: {
        service: { select: { id: true, name: true, code: true, status: true } },
        role: { select: { id: true, name: true } },
        targetUser: { select: { id: true, username: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
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
      amount,
      commissionAmount,
      commissionType,
      level,
      createdBy,
    } = data;

    // 1️⃣ Validate existence of referenced records
    const [user, fromUser, service, createdByUser] = await Promise.all([
      Prisma.user.findUnique({ where: { id: userId } }),
      Prisma.user.findUnique({ where: { id: fromUserId } }),
      Prisma.service.findUnique({ where: { id: serviceId } }),
      Prisma.user.findUnique({ where: { id: createdBy } }),
    ]);

    if (!user) throw ApiError.notFound("User not found");
    if (!fromUser) throw ApiError.notFound("From user not found");
    if (!service) throw ApiError.notFound("Service not found");
    if (!createdByUser) throw ApiError.notFound("Created by user not found");

    // 2️⃣ Prevent duplicate record for same transaction + level
    const existing = await Prisma.commissionEarning.findFirst({
      where: {
        userId,
        fromUserId,
        serviceId,
        transactionId,
        level,
      },
    });

    if (existing) {
      throw ApiError.badRequest(
        "Commission earning already recorded for this transaction and level"
      );
    }

    // 3️⃣ Create record (ensure BigInt conversion)
    const earning = await Prisma.commissionEarning.create({
      data: {
        userId,
        fromUserId,
        serviceId,
        transactionId,
        amount: BigInt(amount),
        commissionAmount: BigInt(commissionAmount),
        commissionType,
        level,
        createdBy,
      },
      include: {
        user: { select: { id: true, username: true, email: true } },
        fromUser: { select: { id: true, username: true, email: true } },
        service: { select: { id: true, name: true, code: true } },
        createdByUser: { select: { id: true, username: true } },
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
  }) {
    const { userId, fromUserId, serviceId, transactionId } = filters;

    const earnings = await Prisma.commissionEarning.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(fromUserId ? { fromUserId } : {}),
        ...(serviceId ? { serviceId } : {}),
        ...(transactionId ? { transactionId } : {}),
      },
      include: {
        user: { select: { id: true, username: true, email: true } },
        fromUser: { select: { id: true, username: true, email: true } },
        service: { select: { id: true, name: true, code: true } },
        createdByUser: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const safeResult = Helper.serializeUser(earnings);
    return safeResult;
  }
}
