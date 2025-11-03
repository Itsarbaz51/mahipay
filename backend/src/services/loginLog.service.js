import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import UserAgentParser from "../utils/UserAgentParser.js";

export class LoginLogService {
  async getAllLoginLogs(payload, currentUser) {
    const {
      page = 1,
      limit = 10,
      userId,
      roleId,
      startDate,
      endDate,
      search,
      deviceType,
      browser,
      os,
      sort = "desc",
      sortBy = "createdAt",
    } = payload;

    console.log("=== DEBUG: Starting getAllLoginLogs ===");
    console.log("Payload:", payload);
    console.log("Current User:", currentUser);

    const skip = (page - 1) * limit;

    // SIMPLE FIX: Use direct approach
    const where = {};

    // 1. First handle user access
    if (currentUser.role !== "ADMIN") {
      where.userId = currentUser.id;
      console.log(
        "DEBUG: Non-admin access - filtering by user ID:",
        currentUser.id
      );
    }

    // 2. Then handle role filter - SIMPLIFIED
    if (roleId && roleId !== "all") {
      console.log("DEBUG: Applying role filter:", roleId);

      // Direct approach - use AND condition
      if (where.userId) {
        // If we already have userId filter, use AND
        where.AND = [
          { userId: where.userId },
          {
            user: {
              roleId: roleId,
            },
          },
        ];
        delete where.userId; // Remove the direct userId
      } else {
        // No userId filter, just apply role filter
        where.user = {
          roleId: roleId,
        };
      }
    }

    console.log(
      "DEBUG: Where clause after role filter:",
      JSON.stringify(where, null, 2)
    );

    // 3. Date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // 4. Search - handle separately to avoid conflicts
    if (search) {
      const searchCondition = {
        OR: [
          { ipAddress: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          {
            user: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      };

      // If we have existing conditions, wrap in AND
      if (Object.keys(where).length > 0) {
        where.AND = where.AND || [];
        if (Array.isArray(where.AND)) {
          where.AND.push(searchCondition);
        } else {
          where.AND = [where, searchCondition];
        }
      } else {
        Object.assign(where, searchCondition);
      }
    }

    console.log("DEBUG: Final WHERE clause:", JSON.stringify(where, null, 2));

    // Build orderBy
    const orderBy = this.buildOrderByClause(sortBy, sort);

    try {
      console.log("DEBUG: Executing Prisma query...");

      const [loginLogs, total] = await Promise.all([
        Prisma.loginLogs.findMany({
          where,
          include: {
            user: {
              include: {
                role: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        Prisma.loginLogs.count({ where }),
      ]);

      console.log("DEBUG: Query results -", {
        logsFound: loginLogs.length,
        totalCount: total,
        roleFilterApplied: !!(roleId && roleId !== "all"),
      });

      // Check if we're getting any data
      if (loginLogs.length > 0) {
        console.log("DEBUG: First log user role:", loginLogs[0].user?.role);
      }

      // Process logs
      const processedLogs = loginLogs.map((log) => {
        const userAgentInfo = UserAgentParser.parse(log.userAgent);
        return {
          ...log,
          userAgentInfo: {
            browser: userAgentInfo.browserFull,
            os: userAgentInfo.osFull,
            device: userAgentInfo.device,
            engine: userAgentInfo.engine,
            isMobile: userAgentInfo.isMobile,
            isDesktop: userAgentInfo.isDesktop,
          },
          userAgentParsed: userAgentInfo,
          userAgentSimple: UserAgentParser.parseSimple(log.userAgent),
        };
      });

      // Apply user agent filters
      const filteredLogs = this.applyUserAgentFilters(processedLogs, {
        deviceType,
        browser,
        os,
      });

      const result = {
        success: true,
        data: filteredLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNext: parseInt(page) < Math.ceil(total / limit),
          hasPrev: parseInt(page) > 1,
          showingFrom: skip + 1,
          showingTo: Math.min(skip + parseInt(limit), total),
        },
        metadata: {
          appliedFilters: {
            roleId: roleId || null,
          },
          summary: {
            totalLogs: total,
            uniqueUsers: [...new Set(filteredLogs.map((log) => log.userId))]
              .length,
          },
        },
      };

      console.log("DEBUG: Final response summary:", {
        dataCount: result.data.length,
        totalLogs: result.pagination.totalItems,
        roleIdFilter: result.metadata.appliedFilters.roleId,
      });

      return this.safeJSONConvert(result);
    } catch (error) {
      console.error("ERROR in getAllLoginLogs:", error);
      throw error;
    }
  }
  // Helper method to build orderBy clause
  buildOrderByClause(sortBy, sort) {
    const order = sort === "asc" ? "asc" : "desc";

    switch (sortBy) {
      case "user":
        return [{ user: { firstName: order } }, { user: { lastName: order } }];
      case "ipAddress":
        return { ipAddress: order };
      case "location":
        return { location: order };
      case "createdAt":
      default:
        return { createdAt: order };
    }
  }

  // Apply user agent filters
  applyUserAgentFilters(logs, filters) {
    let filtered = logs;

    if (filters.deviceType) {
      filtered = filtered.filter(
        (log) =>
          log.userAgentInfo.device?.toLowerCase() ===
          filters.deviceType.toLowerCase()
      );
    }

    if (filters.browser) {
      filtered = filtered.filter((log) =>
        log.userAgentInfo.browser
          ?.toLowerCase()
          .includes(filters.browser.toLowerCase())
      );
    }

    if (filters.os) {
      filtered = filtered.filter((log) =>
        log.userAgentInfo.os?.toLowerCase().includes(filters.os.toLowerCase())
      );
    }

    return filtered;
  }

  // Helper methods for admin summary
  async getTotalUsersCount() {
    try {
      return await Prisma.user.count({
        where: {
          status: "ACTIVE",
        },
      });
    } catch (error) {
      console.error("Error getting total users count:", error);
      return 0;
    }
  }

  async getActiveUsersCountToday() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fixed: Use findMany with distinct instead of count with distinct
      const distinctUserLogs = await Prisma.loginLogs.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        distinct: ["userId"],
        select: {
          userId: true,
        },
      });

      return distinctUserLogs.length;
    } catch (error) {
      console.error("Error getting active users count:", error);
      return 0;
    }
  }

  getEmptyPagination(page = 1, limit = 10) {
    return {
      currentPage: parseInt(page),
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: parseInt(limit),
      hasNext: false,
      hasPrev: false,
      nextPage: null,
      prevPage: null,
      showingFrom: 0,
      showingTo: 0,
    };
  }

  safeJSONConvert(obj) {
    return JSON.parse(
      JSON.stringify(obj, (key, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      })
    );
  }

  async getLoginLogById(id) {
    const log = await Prisma.loginLogs.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return log;
  }

  async createLoginLog(payload) {
    const created = await Prisma.loginLogs.create({
      data: payload,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return created;
  }

  async deleteLoginLog(id) {
    const deleted = await Prisma.loginLogs.delete({ where: { id } });
    if (!deleted) {
      throw ApiError.internal("Login log not found");
    }

    return deleted;
  }
}

export default LoginLogService;
