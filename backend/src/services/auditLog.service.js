import { auditLogger } from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";
import fs from "fs";
import readline from "readline";
import path from "path";
import { v4 as uuidv4 } from "uuid";

class AuditLogService {
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

      // Apply user-based filtering
      if (userRole?.toUpperCase() !== "ADMIN" && userId) {
        filteredLogs = logs.filter((log) => {
          const logUserId = log.message?.userId || log.userId;
          return logUserId && logUserId.toString() === userId.toString();
        });
      }

      // Apply additional filters if provided
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

      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        filteredLogs = filteredLogs.filter((log) => {
          const logDate = new Date(log.timestamp);
          return logDate >= startDate && logDate <= endDate;
        });
      }

      let enrichedLogs = [...filteredLogs];

      // Sorting
      const sortBy = filters.sortBy || "timestamp";
      const sortOrder = filters.sortOrder || "desc";

      enrichedLogs.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        // Handle date sorting
        if (sortBy === "timestamp") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        // Handle string sorting case-insensitively
        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      // Pagination calculation
      const currentPage = Math.max(1, parseInt(page));
      const pageSize = Math.max(1, Math.min(parseInt(limit), 100));
      const totalItems = enrichedLogs.length;
      const totalPages = Math.ceil(totalItems / pageSize);

      const skip = (currentPage - 1) * pageSize;
      const paginatedLogs = enrichedLogs.slice(skip, skip + pageSize);

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

      // Return clean object without array index properties showing
      return {
        paginatedLogs,
        pagination,
      };
    } catch (error) {
      throw ApiError.internal(`Failed to fetch audit logs: ${error.message}`);
    }
  }
}

export default AuditLogService;
