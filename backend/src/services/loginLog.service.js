import { ApiError } from "../utils/ApiError.js";
import loginLogger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import Prisma from "../db/db.js";
import { UAParser } from "ua-parser-js";

export class LoginLogService {
  static async createLoginLog({
    userId,
    domainName,
    ipAddress,
    userAgent = "",
    roleType,
    latitude = null,
    longitude = null,
    location = null,
    accuracy = null,
  }) {
    try {
      const loginLogData = {
        id: uuidv4(),
        userId,
        domainName,
        ipAddress: String(ipAddress),
        userAgent,
        roleType,
        latitude,
        longitude,
        location,
        accuracy,
      };

      loginLogger.info("LOGIN_EVENT", loginLogData);

      return loginLogData;
    } catch (error) {
      throw ApiError.internal("Failed to create login log:", error.message);
    }
  }

  static async getAllLoginLogs(payload, currentUser) {
    const {
      page = 1,
      limit = 10,
      userId,
      roleId,
      search,
      deviceType,
      sort = "desc",
      sortBy = "createdAt",
    } = payload;

    const logFilePath = path.join(process.cwd(), "logs", "loginLogs.log");

    // ✅ If file does not exist
    if (!fs.existsSync(logFilePath)) {
      return {
        success: true,
        data: [],
        metadata: {
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
            hasNext: false,
            hasPrev: false,
            showingFrom: 0,
            showingTo: 0,
          },
        },
      };
    }

    // ✅ Read log file
    const logData = fs.readFileSync(logFilePath, "utf8");
    const logLines = logData.split("\n").filter((line) => line.trim());

    let allLogs = [];
    for (const line of logLines) {
      try {
        const logEntry = JSON.parse(line);

        if (logEntry.message === "LOGIN_EVENT" && logEntry.data) {
          allLogs.push({
            ...logEntry.data,
            createdAt: new Date(logEntry.timestamp || logEntry.data.createdAt),
          });
        } else if (logEntry.userId) {
          allLogs.push({
            ...logEntry,
            createdAt: new Date(logEntry.timestamp || logEntry.createdAt),
          });
        }
      } catch (err) {
        console.warn("Failed to parse log line:", line);
      }
    }

    // ✅ Role-based access
    if (currentUser.role !== "ADMIN") {
      allLogs = allLogs.filter((log) => log.userId === currentUser.id);
    }

    // ✅ Inline helper: Filtering
    const applyFilters = (logs) => {
      let filtered = [...logs];
      if (userId) filtered = filtered.filter((log) => log.userId == userId);
      if (roleId) filtered = filtered.filter((log) => log.roleId == roleId);
      if (deviceType) {
        filtered = filtered.filter((log) => {
          if (!log.userAgent) return false;
          const parser = new UAParser(log.userAgent);
          const result = parser.getResult();

          // Determine if this is mobile or desktop
          const isMobile =
            result.device.type === "mobile" || result.device.type === "tablet";
          const normalizedDevice = isMobile ? "mobile" : "desktop";

          return normalizedDevice.toLowerCase() === deviceType.toLowerCase();
        });
      }
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (log) =>
            log.ip?.toLowerCase().includes(s) ||
            log.deviceType?.toLowerCase().includes(s) ||
            log.userName?.toLowerCase().includes(s)
        );
      }
      return filtered;
    };

    // ✅ Inline helper: Sorting
    const applySorting = (logs) => {
      return logs.sort((a, b) => {
        const valA =
          a[sortBy] instanceof Date ? a[sortBy].getTime() : a[sortBy];
        const valB =
          b[sortBy] instanceof Date ? b[sortBy].getTime() : b[sortBy];
        if (valA < valB) return sort === "asc" ? -1 : 1;
        if (valA > valB) return sort === "asc" ? 1 : -1;
        return 0;
      });
    };

    // ✅ Apply filters & sorting
    let filteredLogs = applyFilters(allLogs);
    filteredLogs = applySorting(filteredLogs);

    // ✅ Pagination
    const total = filteredLogs.length;
    const skip = (page - 1) * limit;
    let paginatedLogs = filteredLogs.slice(skip, skip + parseInt(limit));

    // ✅ Add userAgentSimple
    paginatedLogs = paginatedLogs.map((log) => {
      let userAgentSimple = null;
      if (log.userAgent) {
        const parser = new UAParser(log.userAgent);
        const result = parser.getResult();
        userAgentSimple = {
          device:
            result.device.type ||
            (result.device.model ? result.device.model : "Desktop"),
          browser: result.browser.name || "Unknown",
          os: result.os.name || "Unknown",
        };
      }

      return { ...log, userAgentSimple };
    });

    // ✅ Fetch user details
    const userIds = [...new Set(paginatedLogs.map((log) => log.userId))];

    const users = await Prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: {
          select: {
            name: true,
            level: true,
          },
        },
      },
    });

    const userMap = {};
    for (const user of users) userMap[user.id] = user;

    // ✅ Merge user info
    paginatedLogs = paginatedLogs.map((log) => ({
      ...log,
      user: userMap[log.userId] || null,
    }));

    // ✅ Final response
    return {
      success: true,
      data: paginatedLogs,
      metadata: {
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
      },
    };
  }
}

export default LoginLogService;
