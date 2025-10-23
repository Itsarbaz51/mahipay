// src/services/commission.distribution.service.ts
import {
  LedgerEntryType,
  ReferenceType,
  CommissionType,
  CommissionScope,
  Prisma,
  type CommissionEarning,
  type CommissionSetting,
} from "@prisma/client";
import PrismaClient from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/WinstonLogger.js";

// Define role hierarchy constants based on your roles array
const ROLE_HIERARCHY = {
  ADMIN: 0,
  STATE_HEAD: 1,
  MASTER_DISTRIBUTOR: 2,
  DISTRIBUTOR: 3,
  RETAILER: 4,
} as const;

interface CommissionChainMember {
  userId: string;
  roleId: string;
  roleName: string;
  commissionType: CommissionType;
  commissionValue: any;
  level: number;
}

interface CommissionPayout {
  fromUserId: string;
  toUserId: string;
  amount: bigint;
  level: number;
  roleName: string;
  commissionType: CommissionType;
  commissionValue: any;
  narration: string;
}

interface TransactionForCommission {
  id: string;
  userId: string;
  serviceId: string;
  amount: bigint;
  channel?: string | null;
  providerCharge?: bigint;
}

interface UserChain {
  id: string;
  parentId: string | null;
  roleId: string;
  role: {
    name: string;
  } | null;
  hierarchyLevel: number;
  hierarchyPath: string;
}

interface CommissionCalculation {
  userId: string;
  roleName: string;
  amount: bigint;
  level: number;
  commissionType: CommissionType;
  commissionValue: any;
}

export class CommissionDistributionService {
  /**
   * ✅ CORRECTED: Hierarchy resolution with proper role-based ordering
   */
  static async getCommissionChain(
    userId: string,
    serviceId: string,
    channel: string | null = null
  ): Promise<CommissionChainMember[]> {
    // Get user with hierarchy path and role information
    const userWithPath = await PrismaClient.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        parentId: true,
        roleId: true,
        role: {
          select: {
            name: true,
          },
        },
        hierarchyPath: true,
        hierarchyLevel: true,
      },
    });

    if (!userWithPath) throw ApiError.notFound("User not found");

    // Extract all user IDs from hierarchy path
    const hierarchyIds = userWithPath.hierarchyPath.split("/").filter(Boolean);

    if (hierarchyIds.length === 0) {
      hierarchyIds.push(userId);
    }

    // Get all users in hierarchy with their roles
    const chainUsers = await PrismaClient.user.findMany({
      where: {
        id: { in: hierarchyIds },
      },
      select: {
        id: true,
        parentId: true,
        roleId: true,
        role: {
          select: {
            name: true,
          },
        },
        hierarchyLevel: true,
        hierarchyPath: true,
      },
      orderBy: { hierarchyLevel: "asc" },
    });

    // Validate we have the complete chain
    if (chainUsers.length !== hierarchyIds.length) {
      logger.warn("Incomplete hierarchy chain found", {
        userId,
        expected: hierarchyIds.length,
        found: chainUsers.length,
        missing: hierarchyIds.filter(
          (id) => !chainUsers.find((u) => u.id === id)
        ),
      });
    }

    // Validate hierarchy order
    this.validateHierarchyOrder(chainUsers);

    return await this.resolveCommissionSettings(chainUsers, serviceId, channel);
  }

  /**
   * ✅ ADDED: Validate hierarchy follows correct role order
   */
  private static validateHierarchyOrder(chainUsers: UserChain[]): void {
    const roleLevels = chainUsers.map((user) => {
      const roleName =
        user.role?.name?.toUpperCase().replace(/\s+/g, "_") || "";
      return ROLE_HIERARCHY[roleName as keyof typeof ROLE_HIERARCHY] ?? 999;
    });

    // Check if hierarchy levels are in correct order (Admin=0 to Retailer=4)
    for (let i = 1; i < roleLevels.length; i++) {
      if (roleLevels[i]! <= roleLevels[i - 1]!) {
        logger.warn("Invalid hierarchy order detected", {
          chain: chainUsers.map((u) => ({
            userId: u.id,
            role: u.role?.name,
            level:
              ROLE_HIERARCHY[
                u.role?.name
                  ?.toUpperCase()
                  .replace(/\s+/g, "_") as keyof typeof ROLE_HIERARCHY
              ],
          })),
        });
        break;
      }
    }
  }

  /**
   * ✅ CORRECTED: Batch commission settings with role hierarchy awareness
   */
  private static async resolveCommissionSettings(
    chainUsers: UserChain[],
    serviceId: string,
    channel: string | null
  ): Promise<CommissionChainMember[]> {
    const results: CommissionChainMember[] = [];
    const roleCommissionCache = new Map<string, CommissionSetting | null>();
    const now = new Date();

    // Batch load all user-specific settings
    const userIds = chainUsers.map((u) => u.id);
    const userSettings = await PrismaClient.commissionSetting.findMany({
      where: {
        scope: CommissionScope.USER,
        targetUserId: { in: userIds },
        serviceId,
        isActive: true,
        ...(channel !== null ? { channel } : { channel: null }),
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { effectiveFrom: "desc" },
    });

    // Create map for quick user setting lookup
    const userSettingsMap = new Map(
      userSettings.map((setting) => [setting.targetUserId!, setting])
    );

    // Process each user in hierarchy from Admin (level 0) to Retailer (level 4)
    for (const user of chainUsers) {
      const roleName = user.role?.name || "UNKNOWN";

      // Priority 1: User-specific commission
      const userSetting = userSettingsMap.get(user.id);
      if (userSetting) {
        results.push({
          userId: user.id,
          roleId: user.roleId,
          roleName: roleName,
          commissionType: userSetting.commissionType,
          commissionValue: userSetting.commissionValue,
          level: user.hierarchyLevel,
        });
        continue;
      }

      // Priority 2: Role-based commission (with cache)
      if (user.roleId) {
        let roleSetting = roleCommissionCache.get(user.roleId);

        if (roleSetting === undefined) {
          roleSetting = await PrismaClient.commissionSetting.findFirst({
            where: {
              scope: CommissionScope.ROLE,
              roleId: user.roleId,
              serviceId,
              isActive: true,
              ...(channel !== null ? { channel } : { channel: null }),
              effectiveFrom: { lte: now },
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
            },
            orderBy: { effectiveFrom: "desc" },
          });

          roleCommissionCache.set(user.roleId, roleSetting);
        }

        if (roleSetting) {
          results.push({
            userId: user.id,
            roleId: user.roleId,
            roleName: roleName,
            commissionType: roleSetting.commissionType,
            commissionValue: roleSetting.commissionValue,
            level: user.hierarchyLevel,
          });
          continue;
        }
      }

      // Fallback: Zero commission
      results.push({
        userId: user.id,
        roleId: user.roleId,
        roleName: roleName,
        commissionType: CommissionType.FLAT,
        commissionValue: 0,
        level: user.hierarchyLevel,
      });
    }

    // Validate commission chain
    this.validateCommissionChain(results);

    return results;
  }

  /**
   * ✅ IMPROVED: Decimal precision handling
   */
  static calculateCommissionAmount(
    baseAmount: bigint,
    commissionType: CommissionType,
    commissionValue: Prisma.Decimal | number | string
  ): bigint {
    if (commissionType === CommissionType.FLAT) {
      const decimalValue = new Prisma.Decimal(commissionValue);
      const amountInPaise = decimalValue.times(100);
      return BigInt(amountInPaise.toFixed(0));
    } else {
      const decimalValue = new Prisma.Decimal(commissionValue);
      const percentage = decimalValue.div(100);
      const commission = new Prisma.Decimal(baseAmount.toString()).times(
        percentage
      );
      return BigInt(commission.toFixed(0));
    }
  }

  /**
   * ✅ ADDED: Commission chain validation
   */
  private static validateCommissionChain(chain: CommissionChainMember[]): void {
    if (chain.length === 0) return;

    // Check for duplicate users in chain
    const userIds = new Set();
    for (const member of chain) {
      if (userIds.has(member.userId)) {
        throw ApiError.internal(
          `Duplicate user ${member.userId} in commission chain`
        );
      }
      userIds.add(member.userId);
    }

    // Validate commission values
    for (const member of chain) {
      const value = new Prisma.Decimal(member.commissionValue);

      if (member.commissionType === CommissionType.PERCENTAGE) {
        if (value.lessThan(0) || value.greaterThan(100)) {
          throw ApiError.internal(
            `Invalid percentage ${value} for user ${member.userId}`
          );
        }
      } else {
        if (value.lessThan(0)) {
          throw ApiError.internal(
            `Negative flat commission ${value} for user ${member.userId}`
          );
        }
      }
    }

    logger.debug("Commission chain validation passed", {
      chainLength: chain.length,
      userIds: Array.from(userIds),
    });
  }

  /**
   * ✅ CORRECTED: Commission calculation with proper hierarchy flow
   * Admin (level 0) gets commission from transaction, then distributes down the chain
   */
  static calculateHierarchicalCommissions(
    chain: CommissionChainMember[],
    baseAmount: bigint
  ): CommissionCalculation[] {
    const commissions: CommissionCalculation[] = [];

    if (chain.length === 0) return commissions;

    // Sort chain by level ascending (Admin first, then State Head, etc.)
    const sortedChain = [...chain].sort((a, b) => a.level - b.level);

    // Admin (level 0) calculates commission from transaction
    const adminMember = sortedChain.find((member) => member.level === 0);

    if (!adminMember) {
      logger.warn("No ADMIN found in commission chain, using first member");
      const firstMember = sortedChain[0];
      if (firstMember) {
        const totalCommissionPool = this.calculateCommissionAmount(
          baseAmount,
          firstMember.commissionType,
          firstMember.commissionValue
        );

        return this.distributeCommissionPool(sortedChain, totalCommissionPool);
      }
      return commissions;
    }

    // Calculate total commission pool from Admin's perspective
    const totalCommissionPool = this.calculateCommissionAmount(
      baseAmount,
      adminMember.commissionType,
      adminMember.commissionValue
    );

    logger.debug("Total commission pool calculated by ADMIN", {
      adminUserId: adminMember.userId,
      totalCommissionPool: Number(totalCommissionPool) / 100,
      baseAmount: Number(baseAmount) / 100,
      commissionType: adminMember.commissionType,
      commissionValue: adminMember.commissionValue,
    });

    // Distribute the total commission pool among hierarchy members
    return this.distributeCommissionPool(sortedChain, totalCommissionPool);
  }

  /**
   * ✅ ADDED: Distribute commission pool according to hierarchy
   */
  private static distributeCommissionPool(
    chain: CommissionChainMember[],
    totalCommissionPool: bigint
  ): CommissionCalculation[] {
    const commissions: CommissionCalculation[] = [];
    let remainingPool = totalCommissionPool;

    // Process from top to bottom (Admin to Retailer)
    for (let i = 0; i < chain.length; i++) {
      const member = chain[i];
      if (!member) continue;

      let memberCommission: bigint;

      if (i === chain.length - 1) {
        // Last member (Retailer) gets remaining amount
        memberCommission = remainingPool;
      } else {
        // Calculate member's share from the remaining pool
        memberCommission = this.calculateCommissionAmount(
          remainingPool,
          member.commissionType,
          member.commissionValue
        );

        // Ensure we don't exceed remaining pool
        if (memberCommission > remainingPool) {
          memberCommission = remainingPool;
        }
      }

      commissions.push({
        userId: member.userId,
        roleName: member.roleName,
        amount: memberCommission,
        level: member.level,
        commissionType: member.commissionType,
        commissionValue: member.commissionValue,
      });

      remainingPool -= memberCommission;

      logger.debug("Member commission allocated", {
        userId: member.userId,
        role: member.roleName,
        level: member.level,
        commission: Number(memberCommission) / 100,
        remainingPool: Number(remainingPool) / 100,
      });

      if (remainingPool <= 0) break;
    }

    // Verify total distribution
    const totalDistributed = commissions.reduce(
      (sum, c) => sum + c.amount,
      BigInt(0)
    );

    if (totalDistributed !== totalCommissionPool) {
      logger.warn("Commission distribution mismatch", {
        totalPool: Number(totalCommissionPool) / 100,
        totalDistributed: Number(totalDistributed) / 100,
        difference: Number(totalCommissionPool - totalDistributed) / 100,
      });

      // Auto-correct minor rounding differences
      if (Math.abs(Number(totalCommissionPool - totalDistributed)) <= 1) {
        logger.info("Minor rounding difference auto-corrected");
        if (commissions.length > 0) {
          const lastCommission = commissions[commissions.length - 1];
          if (lastCommission) {
            lastCommission.amount += totalCommissionPool - totalDistributed;
          }
        }
      } else {
        throw ApiError.internal(
          `Commission distribution mismatch: Pool ${totalCommissionPool} vs Distributed ${totalDistributed}`
        );
      }
    }

    return commissions;
  }

  /**
   * ✅ CORRECTED: Payout flow following hierarchy
   * SYSTEM → Admin → State Head → Master Distributor → Distributor → Retailer
   */
  static calculateCommissionPayouts(
    commissions: CommissionCalculation[],
    transactionId: string
  ): CommissionPayout[] {
    const payouts: CommissionPayout[] = [];

    if (commissions.length === 0) return payouts;

    // Sort by level ascending (Admin first, Retailer last)
    const sortedCommissions = [...commissions].sort(
      (a, b) => a.level - b.level
    );

    // SYSTEM pays total commission to Admin (level 0)
    const totalCommissionPool = sortedCommissions.reduce(
      (sum, c) => sum + c.amount,
      BigInt(0)
    );

    const adminCommission = sortedCommissions[0];
    if (adminCommission && totalCommissionPool > 0) {
      payouts.push({
        fromUserId: "SYSTEM",
        toUserId: adminCommission.userId,
        amount: totalCommissionPool,
        level: adminCommission.level,
        roleName: adminCommission.roleName,
        commissionType: adminCommission.commissionType,
        commissionValue: adminCommission.commissionValue,
        narration: `Total commission pool for transaction ${transactionId}`,
      });

      logger.debug("SYSTEM payout to ADMIN", {
        toUserId: adminCommission.userId,
        amount: Number(totalCommissionPool) / 100,
      });
    }

    // Hierarchical payouts: each level pays the next level down
    for (let i = 0; i < sortedCommissions.length - 1; i++) {
      const payer = sortedCommissions[i];
      const receiver = sortedCommissions[i + 1];

      if (payer && receiver && receiver.amount > 0) {
        payouts.push({
          fromUserId: payer.userId,
          toUserId: receiver.userId,
          amount: receiver.amount,
          level: receiver.level,
          roleName: receiver.roleName,
          commissionType: receiver.commissionType,
          commissionValue: receiver.commissionValue,
          narration: `Commission share for transaction ${transactionId} (${payer.roleName} → ${receiver.roleName})`,
        });

        logger.debug("Inter-level payout", {
          fromUserId: payer.userId,
          fromRole: payer.roleName,
          toUserId: receiver.userId,
          toRole: receiver.roleName,
          amount: Number(receiver.amount) / 100,
        });
      }
    }

    return payouts;
  }

  /**
   * ✅ MAIN DISTRIBUTION METHOD
   */
  static async distribute(
    transaction: TransactionForCommission,
    createdBy: string
  ): Promise<CommissionEarning[]> {
    const { id: transactionId, serviceId, amount: txAmount } = transaction;
    const baseAmount = BigInt(txAmount);

    logger.info("Starting commission distribution", {
      transactionId,
      userId: transaction.userId,
      serviceId,
      amount: Number(baseAmount) / 100,
    });

    const chain = await this.getCommissionChain(
      transaction.userId,
      serviceId,
      transaction.channel
    );

    if (chain.length === 0) {
      logger.info("No commission chain found", { transactionId });
      return [];
    }

    logger.info("Commission chain found", {
      transactionId,
      chainLength: chain.length,
      userIds: chain.map((m) => m.userId),
      roles: chain.map((m) => m.roleName),
      levels: chain.map((m) => m.level),
    });

    const hierarchicalCommissions = this.calculateHierarchicalCommissions(
      chain,
      baseAmount
    );

    const totalCommission = hierarchicalCommissions.reduce(
      (sum, c) => sum + c.amount,
      BigInt(0)
    );
    if (totalCommission === BigInt(0)) {
      logger.info("No commission to distribute", { transactionId });
      return [];
    }

    logger.info("Hierarchical commissions calculated", {
      transactionId,
      totalCommissionPool: Number(totalCommission) / 100,
      commissions: hierarchicalCommissions.map((c) => ({
        userId: c.userId,
        role: c.roleName,
        level: c.level,
        amount: Number(c.amount) / 100,
        type: c.commissionType,
        value: c.commissionValue,
      })),
    });

    const payouts = this.calculateCommissionPayouts(
      hierarchicalCommissions,
      transactionId
    );

    if (payouts.length === 0) {
      logger.info("No commission payouts calculated", { transactionId });
      return [];
    }

    logger.info("Commission payouts calculated", {
      transactionId,
      totalPayouts: payouts.length,
      payouts: payouts.map((p) => ({
        from: p.fromUserId,
        to: p.toUserId,
        fromRole: p.roleName,
        amount: Number(p.amount) / 100,
        level: p.level,
      })),
    });

    // Execute all payouts atomically
    const createdEarnings = await PrismaClient.$transaction(async (tx) => {
      const earnings: CommissionEarning[] = [];

      for (const payout of payouts) {
        if (payout.fromUserId === "SYSTEM") {
          // SYSTEM payout - only credit the receiver
          await this.creditUserWallet(
            tx,
            payout.toUserId,
            payout.amount,
            transactionId,
            payout.narration,
            createdBy
          );
        } else {
          // Regular payout - debit from payer and credit to receiver
          await this.debitUserWallet(
            tx,
            payout.fromUserId,
            payout.amount,
            transactionId,
            `Commission paid to ${payout.toUserId} for transaction ${transactionId}`,
            createdBy
          );

          await this.creditUserWallet(
            tx,
            payout.toUserId,
            payout.amount,
            transactionId,
            payout.narration,
            createdBy
          );
        }

        // Record commission earning
        const earningData: Prisma.CommissionEarningCreateInput = {
          user: { connect: { id: payout.toUserId } },
          service: { connect: { id: serviceId } },
          transactionId,
          amount: payout.amount,
          commissionAmount: payout.amount,
          commissionType: payout.commissionType,
          level: payout.level,
          createdByUser: { connect: { id: createdBy } },
          metadata: {
            grossAmount: Number(payout.amount) / 100,
            commissionValue: payout.commissionValue,
            narration: payout.narration,
            fromUserId: payout.fromUserId,
            roleName: payout.roleName,
            poolDistribution: true,
            distributedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        };

        // Add fromUserId only if it's not SYSTEM
        if (payout.fromUserId !== "SYSTEM") {
          earningData.fromUser = { connect: { id: payout.fromUserId } };
        }

        const earning = await tx.commissionEarning.create({
          data: earningData,
        });

        earnings.push(earning);

        logger.debug("Commission earning recorded", {
          transactionId,
          earningId: earning.id,
          from: payout.fromUserId,
          to: payout.toUserId,
          role: payout.roleName,
          amount: Number(payout.amount) / 100,
        });
      }

      return earnings;
    });

    // Calculate total commission distributed from SYSTEM
    const totalSystemCommission = payouts
      .filter((p) => p.fromUserId === "SYSTEM")
      .reduce((sum, payout) => sum + payout.amount, BigInt(0));

    logger.info("Commission distribution completed successfully", {
      transactionId,
      distributedCount: createdEarnings.length,
      totalSystemCommission: Number(totalSystemCommission) / 100,
      payoutFlow: payouts.map(
        (p) =>
          `${p.fromUserId} (${p.roleName}) → ${p.toUserId} (₹${Number(p.amount) / 100})`
      ),
      netResult: this.calculateNetEarnings(payouts),
    });

    return createdEarnings;
  }

  /**
   * ✅ ADDED: Bulk distribution for multiple transactions
   */
  static async distributeBulk(
    transactions: TransactionForCommission[],
    createdBy: string
  ): Promise<Map<string, CommissionEarning[]>> {
    const results = new Map<string, CommissionEarning[]>();

    if (transactions.length === 0) return results;

    logger.info("Starting bulk commission distribution", {
      transactionCount: transactions.length,
    });

    // Group by user for batch chain lookup
    const userTransactions = new Map<string, TransactionForCommission[]>();
    transactions.forEach((tx) => {
      if (!userTransactions.has(tx.userId)) {
        userTransactions.set(tx.userId, []);
      }
      const userTxs = userTransactions.get(tx.userId);
      if (userTxs) {
        userTxs.push(tx);
      }
    });

    // Process in batches
    for (const [userId, userTxs] of userTransactions) {
      if (!userTxs || userTxs.length === 0) continue;

      try {
        // Get chain once for all user transactions (assuming same service/channel)
        const chain = await this.getCommissionChain(
          userId,
          userTxs[0]!.serviceId,
          userTxs[0]!.channel
        );

        for (const tx of userTxs) {
          try {
            const earnings = await this.distributeSingle(tx, chain, createdBy);
            results.set(tx.id, earnings);
          } catch (error) {
            logger.error(`Failed to distribute commission for tx ${tx.id}`, {
              error,
              userId: tx.userId,
              transactionId: tx.id,
            });
            results.set(tx.id, []);
          }
        }
      } catch (error) {
        logger.error(`Failed to process commission chain for user ${userId}`, {
          error,
        });
        // Mark all transactions for this user as failed
        const userTxsArray = userTransactions.get(userId);
        if (userTxsArray) {
          userTxsArray.forEach((tx) => results.set(tx.id, []));
        }
      }
    }

    logger.info("Bulk commission distribution completed", {
      successful: Array.from(results.values()).filter(
        (earnings) => earnings.length > 0
      ).length,
      failed: Array.from(results.values()).filter(
        (earnings) => earnings.length === 0
      ).length,
    });

    return results;
  }

  /**
   * ✅ ADDED: Single distribution with pre-loaded chain
   */
  private static async distributeSingle(
    transaction: TransactionForCommission,
    chain: CommissionChainMember[],
    createdBy: string
  ): Promise<CommissionEarning[]> {
    const { id: transactionId, serviceId, amount: txAmount } = transaction;
    const baseAmount = BigInt(txAmount);

    const hierarchicalCommissions = this.calculateHierarchicalCommissions(
      chain,
      baseAmount
    );

    const totalCommission = hierarchicalCommissions.reduce(
      (sum, c) => sum + c.amount,
      BigInt(0)
    );
    if (totalCommission === BigInt(0)) {
      return [];
    }

    const payouts = this.calculateCommissionPayouts(
      hierarchicalCommissions,
      transactionId
    );

    if (payouts.length === 0) {
      return [];
    }

    // Execute payouts atomically
    return await PrismaClient.$transaction(async (tx) => {
      const earnings: CommissionEarning[] = [];

      for (const payout of payouts) {
        if (payout.fromUserId === "SYSTEM") {
          await this.creditUserWallet(
            tx,
            payout.toUserId,
            payout.amount,
            transactionId,
            payout.narration,
            createdBy
          );
        } else {
          await this.debitUserWallet(
            tx,
            payout.fromUserId,
            payout.amount,
            transactionId,
            `Commission paid to ${payout.toUserId} for transaction ${transactionId}`,
            createdBy
          );

          await this.creditUserWallet(
            tx,
            payout.toUserId,
            payout.amount,
            transactionId,
            payout.narration,
            createdBy
          );
        }

        const earningData: Prisma.CommissionEarningCreateInput = {
          user: { connect: { id: payout.toUserId } },
          service: { connect: { id: serviceId } },
          transactionId,
          amount: payout.amount,
          commissionAmount: payout.amount,
          commissionType: payout.commissionType,
          level: payout.level,
          createdByUser: { connect: { id: createdBy } },
          metadata: {
            grossAmount: Number(payout.amount) / 100,
            commissionValue: payout.commissionValue,
            narration: payout.narration,
            fromUserId: payout.fromUserId,
            roleName: payout.roleName,
            poolDistribution: true,
            distributedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        };

        if (payout.fromUserId !== "SYSTEM") {
          earningData.fromUser = { connect: { id: payout.fromUserId } };
        }

        const earning = await tx.commissionEarning.create({
          data: earningData,
        });

        earnings.push(earning);
      }

      return earnings;
    });
  }

  /**
   * ✅ ADDED: Commission reversal handling
   */
  static async reverseCommission(
    originalTransactionId: string,
    reversalTransactionId: string,
    createdBy: string
  ): Promise<void> {
    logger.info("Starting commission reversal", {
      originalTransactionId,
      reversalTransactionId,
    });

    const originalEarnings = await PrismaClient.commissionEarning.findMany({
      where: { transactionId: originalTransactionId },
    });

    if (originalEarnings.length === 0) {
      logger.info("No commission earnings found to reverse", {
        originalTransactionId,
      });
      return;
    }

    await PrismaClient.$transaction(async (tx) => {
      for (const earning of originalEarnings) {
        // Create a safe metadata object
        const safeMetadata = earning.metadata
          ? {
              ...(earning.metadata as Record<string, unknown>),
              isReversal: true,
              originalEarningId: earning.id,
              reversedAt: new Date().toISOString(),
            }
          : {
              isReversal: true,
              originalEarningId: earning.id,
              reversedAt: new Date().toISOString(),
            };

        // Only reverse if commission was actually paid (not SYSTEM payouts)
        if (earning.fromUserId && earning.fromUserId !== "SYSTEM") {
          await this.debitUserWallet(
            tx,
            earning.userId,
            earning.commissionAmount,
            reversalTransactionId,
            `Commission reversal for transaction ${originalTransactionId}`,
            createdBy
          );

          await this.creditUserWallet(
            tx,
            earning.fromUserId,
            earning.commissionAmount,
            reversalTransactionId,
            `Commission reversal refund for transaction ${originalTransactionId}`,
            createdBy
          );
        } else {
          // For SYSTEM payouts, just debit the receiver
          await this.debitUserWallet(
            tx,
            earning.userId,
            earning.commissionAmount,
            reversalTransactionId,
            `Commission reversal for transaction ${originalTransactionId}`,
            createdBy
          );
        }

        // Create reversal commission earning record
        await tx.commissionEarning.create({
          data: {
            userId: earning.userId,
            fromUserId: earning.fromUserId,
            serviceId: earning.serviceId,
            transactionId: reversalTransactionId,
            amount: BigInt(0) - earning.amount,
            commissionAmount: BigInt(0) - earning.commissionAmount,
            commissionType: earning.commissionType,
            level: earning.level,
            metadata: safeMetadata,
            createdBy: createdBy,
            createdAt: new Date(),
          },
        });

        logger.debug("Commission earning reversed", {
          originalEarningId: earning.id,
          userId: earning.userId,
          amount: Number(earning.commissionAmount) / 100,
        });
      }
    });

    logger.info("Commission reversal completed successfully", {
      originalTransactionId,
      reversalTransactionId,
      reversedEarnings: originalEarnings.length,
    });
  }

  /**
   * ✅ TEST METHOD - Correct hierarchy commission distribution
   */
  static testCommissionScenario() {
    const baseAmount = BigInt(10000); // ₹100 in paise
    const transactionId = "test-tx-123";

    // Correct hierarchy based on your roles
    const testChain: CommissionChainMember[] = [
      {
        userId: "admin1",
        roleId: "admin-role",
        roleName: "ADMIN",
        commissionType: CommissionType.PERCENTAGE,
        commissionValue: 2, // Admin gets 2% of transaction
        level: 0,
      },
      {
        userId: "state1",
        roleId: "state-head-role",
        roleName: "STATE HEAD",
        commissionType: CommissionType.PERCENTAGE,
        commissionValue: 25, // 25% of commission pool
        level: 1,
      },
      {
        userId: "master1",
        roleId: "master-distributor-role",
        roleName: "MASTER DISTRIBUTOR",
        commissionType: CommissionType.PERCENTAGE,
        commissionValue: 50, // 50% of remaining pool
        level: 2,
      },
      {
        userId: "distributor1",
        roleId: "distributor-role",
        roleName: "DISTRIBUTOR",
        commissionType: CommissionType.PERCENTAGE,
        commissionValue: 20, // 20% of remaining pool
        level: 3,
      },
      {
        userId: "retailer1",
        roleId: "retailer-role",
        roleName: "RETAILER",
        commissionType: CommissionType.PERCENTAGE,
        commissionValue: 5, // 5% of remaining pool
        level: 4,
      },
    ];

    console.log("=== CORRECT HIERARCHY COMMISSION SCENARIO ===");
    console.log("Base Amount: ₹", Number(baseAmount) / 100);
    console.log(
      "Hierarchy: ADMIN → STATE HEAD → MASTER DISTRIBUTOR → DISTRIBUTOR → RETAILER"
    );
    console.log("Commission Structure:");
    console.log("- Total Commission Pool: Admin's 2% of ₹100 = ₹2");
    console.log("- Distribution from ₹2 pool:");
    console.log("  • STATE HEAD: 25% of ₹2 = ₹0.50");
    console.log("  • MASTER DISTRIBUTOR: 50% of remaining ₹1.50 = ₹0.75");
    console.log("  • DISTRIBUTOR: 20% of remaining ₹0.75 = ₹0.15");
    console.log("  • RETAILER: Remaining ₹0.60");
    console.log(
      "Expected Flow: SYSTEM → Admin (₹2) → State Head (₹0.50) → Master Distributor (₹0.75) → Distributor (₹0.15) → Retailer (₹0.60)"
    );

    const commissions = this.calculateHierarchicalCommissions(
      testChain,
      baseAmount
    );

    console.log("\n=== COMMISSION DISTRIBUTION FROM ₹2 POOL ===");
    commissions.forEach((commission) => {
      console.log(
        `${commission.roleName} (${commission.userId}): ₹${Number(commission.amount) / 100}`
      );
    });

    const payouts = this.calculateCommissionPayouts(commissions, transactionId);

    console.log("\n✅ CORRECTED PAYOUT FLOW ===");
    payouts.forEach((payout) => {
      const from =
        payout.fromUserId === "SYSTEM"
          ? "SYSTEM"
          : `${payout.roleName} (${payout.fromUserId})`;
      const to = `${payout.roleName} (${payout.toUserId})`;
      console.log(`${from} → ${to}: ₹${Number(payout.amount) / 100}`);
    });

    // Calculate net earnings
    const netEarnings = this.calculateNetEarnings(payouts);

    console.log("\n=== NET EARNINGS ===");
    Object.entries(netEarnings).forEach(([userId, amount]) => {
      const user = testChain.find((u) => u.userId === userId);
      const roleName = user?.roleName || userId;
      const net = Number(amount) / 100;
      console.log(`${roleName} (${userId}): ₹${net}`);
    });

    const totalDistributed = payouts
      .filter((p) => p.fromUserId === "SYSTEM")
      .reduce((sum, p) => sum + p.amount, BigInt(0));

    console.log(
      "\n💰 Total Commission Pool: ₹",
      Number(totalDistributed) / 100
    );

    return {
      commissions,
      payouts,
      netEarnings,
    };
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private static calculateNetEarnings(
    payouts: CommissionPayout[]
  ): Record<string, bigint> {
    const netEarnings = new Map<string, bigint>();

    payouts.forEach((payout) => {
      // Add credits to receiver
      const currentToBalance = netEarnings.get(payout.toUserId) || BigInt(0);
      netEarnings.set(payout.toUserId, currentToBalance + payout.amount);

      // Subtract debits from payer (if not SYSTEM)
      if (payout.fromUserId !== "SYSTEM") {
        const currentFromBalance =
          netEarnings.get(payout.fromUserId) || BigInt(0);
        netEarnings.set(payout.fromUserId, currentFromBalance - payout.amount);
      }
    });

    return Object.fromEntries(netEarnings);
  }

  private static async creditUserWallet(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: bigint,
    transactionId: string,
    narration: string,
    createdBy: string
  ): Promise<void> {
    // Use optimistic concurrency control
    const wallet = await tx.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true, version: true },
    });

    if (!wallet) {
      throw ApiError.internal(`Wallet not found for user ${userId}`);
    }

    const currentBalance = BigInt(wallet.balance ?? 0);
    const newBalance = currentBalance + amount;

    // Atomic update with version check
    const updatedWallet = await tx.wallet.update({
      where: {
        id: wallet.id,
        version: wallet.version,
      },
      data: {
        balance: newBalance,
        version: { increment: 1 },
      },
    });

    if (!updatedWallet) {
      throw ApiError.internal(`Wallet update conflict for user ${userId}`);
    }

    // Create ledger entry
    const ledgerData: Prisma.LedgerEntryCreateInput = {
      wallet: { connect: { id: wallet.id } },
      transaction: { connect: { id: transactionId } },
      entryType: LedgerEntryType.CREDIT,
      referenceType: ReferenceType.COMMISSION,
      amount: amount,
      runningBalance: newBalance,
      narration: narration,
      createdBy: createdBy,
    };

    await tx.ledgerEntry.create({
      data: ledgerData,
    });

    logger.debug("Wallet credited", {
      userId,
      amount: Number(amount) / 100,
      newBalance: Number(newBalance) / 100,
      transactionId,
    });
  }

  private static async debitUserWallet(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: bigint,
    transactionId: string,
    narration: string,
    createdBy: string
  ): Promise<void> {
    // Use optimistic concurrency control
    const wallet = await tx.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true, version: true },
    });

    if (!wallet) {
      throw ApiError.internal(`Wallet not found for user ${userId}`);
    }

    const currentBalance = BigInt(wallet.balance ?? 0);
    if (currentBalance < amount) {
      throw ApiError.internal(
        `Insufficient funds in wallet ${userId} for commission payout. Balance: ₹${Number(currentBalance) / 100}, Required: ₹${Number(amount) / 100}`
      );
    }

    const newBalance = currentBalance - amount;

    // Atomic update with version check
    const updatedWallet = await tx.wallet.update({
      where: {
        id: wallet.id,
        version: wallet.version,
      },
      data: {
        balance: newBalance,
        version: { increment: 1 },
      },
    });

    if (!updatedWallet) {
      throw ApiError.internal(`Wallet update conflict for user ${userId}`);
    }

    // Create ledger entry
    const ledgerData: Prisma.LedgerEntryCreateInput = {
      wallet: { connect: { id: wallet.id } },
      transaction: { connect: { id: transactionId } },
      entryType: LedgerEntryType.DEBIT,
      referenceType: ReferenceType.COMMISSION,
      amount: amount,
      runningBalance: newBalance,
      narration: narration,
      createdBy: createdBy,
    };

    await tx.ledgerEntry.create({
      data: ledgerData,
    });

    logger.debug("Wallet debited", {
      userId,
      amount: Number(amount) / 100,
      newBalance: Number(newBalance) / 100,
      transactionId,
    });
  }
}

export default CommissionDistributionService;
