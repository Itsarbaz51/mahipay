import asyncHandler from "../utils/AsyncHandler.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class AuditLogService {
  // Get all audit logs with filters and pagination
  static async getAuditLogs({ page = 1, limit = 10, filters = {} } = {}) {
    try {
      const skip = (page - 1) * limit;

      const where = this.buildWhereClause(filters);

      const [auditLogs, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        auditLogs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }
  }

  // Get audit log by ID
  static async getAuditLogById(id) {
    try {
      return await prisma.auditLog.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch audit log: ${error.message}`);
    }
  }

  // Create new audit log
  static async createAuditLog(auditLogData) {
    try {
      const { userId, action, entityType, entityId, ipAddress, metadata } =
        auditLogData;

      return await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          ipAddress,
          metadata: metadata || {},
          createdAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to create audit log: ${error.message}`);
    }
  }

  // Delete specific audit log
  static async deleteAuditLog(id) {
    try {
      return await prisma.auditLog.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null; // Record not found
      }
      throw new Error(`Failed to delete audit log: ${error.message}`);
    }
  }

  // Delete old audit logs (for your 30-day auto cleanup)
  static async deleteOldAuditLogs(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return {
        deletedCount: result.count,
        cutoffDate: cutoffDate.toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to delete old audit logs: ${error.message}`);
    }
  }

  // Get audit logs by user
  static async getAuditLogsByUser(userId, { page = 1, limit = 10 } = {}) {
    return await this.getAuditLogs({
      page,
      limit,
      filters: { userId },
    });
  }

  // Get audit logs by entity
  static async getAuditLogsByEntity(
    entityType,
    entityId,
    { page = 1, limit = 10 } = {}
  ) {
    return await this.getAuditLogs({
      page,
      limit,
      filters: { entityType, entityId },
    });
  }

  // Get audit logs by action
  static async getAuditLogsByAction(action, { page = 1, limit = 10 } = {}) {
    return await this.getAuditLogs({
      page,
      limit,
      filters: { action },
    });
  }

  // Build where clause for Prisma
  static buildWhereClause(filters) {
    const where = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = filters.action;
    if (filters.ipAddress) where.ipAddress = filters.ipAddress;

    if (filters.createdAt) {
      where.createdAt = {};
      if (filters.createdAt.gte)
        where.createdAt.gte = new Date(filters.createdAt.gte);
      if (filters.createdAt.lte)
        where.createdAt.lte = new Date(filters.createdAt.lte);
    }

    return where;
  }

  // Utility method to log actions (use this throughout your app)
  static async logAction({
    userId,
    action,
    entityType,
    entityId,
    ipAddress,
    metadata = {},
  }) {
    try {
      return await this.createAuditLog({
        userId,
        action,
        entityType,
        entityId,
        ipAddress,
        metadata,
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Don't throw error to avoid breaking main operations
      return null;
    }
  }
}

export default AuditLogService;
