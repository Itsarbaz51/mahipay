import { auditLogger } from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";
import fs from "fs";
import readline from "readline";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import Prisma from "../db/db.js";

class AuditLogService {
  static async getAuditLogs({
    page = 1,
    limit = 10,
    filters = {},
    userRole = null,
    userId = null,
  } = {}) {
    try {
      const logFilePath = path.join(process.cwd(), "logs", "auditlogs.log");

      if (!fs.existsSync(logFilePath)) {
        return {
          result: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalCount: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
            showingFrom: 0,
            showingTo: 0,
            totalItems: 0,
          },
        };
      }

      const logs = [];
      const fileStream = fs.createReadStream(logFilePath, { encoding: "utf8" });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;
        try {
          const log = JSON.parse(line);
          logs.push(log);
        } catch {
          continue;
        }
      }

      let filteredLogs = logs;

      // 🔹 User-based filtering
      if (userRole?.toUpperCase() !== "ADMIN" && userId) {
        filteredLogs = logs.filter((log) => {
          const logUserId = log.message?.userId || log.userId;
          return logUserId && logUserId.toString() === userId.toString();
        });
      }

      // 🔹 Apply filters
      if (filters.action) {
        filteredLogs = filteredLogs.filter((log) =>
          log.action?.toLowerCase().includes(filters.action.toLowerCase())
        );
      }

      if (filters.resource) {
        filteredLogs = filteredLogs.filter((log) =>
          log.resource?.toLowerCase().includes(filters.resource.toLowerCase())
        );
      }

      if (filters.roleId) {
        filteredLogs = filteredLogs.filter(
          (log) =>
            log.message?.metadata?.roleId?.toString() ===
              filters.roleId.toString() ||
            log.user?.roleId?.toString() === filters.roleId.toString()
        );
      }

      if (filters.deviceType && filters.deviceType !== "all") {
        filteredLogs = filteredLogs.filter(
          (log) =>
            log.message?.metadata?.userAgent?.device?.type?.toLowerCase() ===
            filters.deviceType.toLowerCase()
        );
      }

      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        filteredLogs = filteredLogs.filter((log) => {
          const logDate = new Date(log.timestamp);
          return logDate >= startDate && logDate <= endDate;
        });
      }

      // 🔹 Sorting
      const sortBy = filters.sortBy || "timestamp";
      const sortOrder = filters.sortOrder || "desc";

      filteredLogs.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        if (sortBy === "timestamp") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      // 🔹 Pagination
      const currentPage = Math.max(1, parseInt(page));
      const pageSize = Math.max(1, Math.min(parseInt(limit), 100));
      const totalItems = filteredLogs.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const skip = (currentPage - 1) * pageSize;
      const enrichedLogs = filteredLogs.slice(skip, skip + pageSize);

      // 🔹 Enrich logs with user info from Prisma
      const uniqueUserIds = [
        ...new Set(
          enrichedLogs
            .map((log) => log.userId || log.message?.userId)
            .filter(Boolean)
        ),
      ];

      let users = [];
      if (uniqueUserIds.length > 0) {
        users = await Prisma.user.findMany({
          where: { id: { in: uniqueUserIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        });
      }

      // Map users to logs
      const paginatedLogs = enrichedLogs.map((log) => {
        const logUserId = log.userId || log.message?.userId;
        const user = users.find((u) => u.id === logUserId);
        return {
          ...log,
          user: user
            ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
              }
            : null,
        };
      });

      const pagination = {
        page: currentPage,
        limit: pageSize,
        totalCount: totalItems,
        totalPages: totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        showingFrom: totalItems > 0 ? skip + 1 : 0,
        showingTo: totalItems > 0 ? Math.min(skip + pageSize, totalItems) : 0,
        totalItems: totalItems,
      };

      return {
        paginatedLogs,
        pagination,
      };
    } catch (error) {
      throw ApiError.internal(`Failed to fetch audit logs: ${error.message}`);
    }
  }

  static async createAuditLog({
    userId = null,
    action,
    entityType = null,
    entityId = null,
    ipAddress = null,
    metadata = {},
  }) {
    try {
      const auditData = {
        id: uuidv4(),
        userId,
        action,
        entityType,
        entityId,
        ipAddress,
        metadata,
      };

      auditLogger.info(auditData);

      return {
        success: true,
        data: auditData,
        message: "Audit log created successfully",
      };
    } catch (error) {
      throw ApiError.internal("Failed to create audit log");
    }
  }
}

export default AuditLogService;
