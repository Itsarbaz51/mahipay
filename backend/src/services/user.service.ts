import { UserStatus } from "@prisma/client";
import Prisma from "../db/db.js";
import type { User } from "../types/auth.types.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import {
  getCache,
  setCache,
  cacheUser,
  getCachedUser,
} from "../utils/redisCasheHelper.js";
import logger from "../utils/WinstonLogger.js";

class UserServices {
  private static readonly USER_CACHE_TTL = 600; // 5 minutes

  static async getUserById(userId: string): Promise<User | null> {
    // Try cache first
    const cachedUser = await getCachedUser<User>(userId);

    if (cachedUser) {
      logger.debug("User fetched from cache", { userId });
      return cachedUser;
    }

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { select: { id: true, name: true, level: true } },
        wallets: true,
        parent: { select: { id: true, username: true } },
        children: { select: { id: true, username: true } },
      },
    });

    if (!user) {
      logger.warn("User not found", { userId });
      throw ApiError.notFound("User not found");
    }

    const safeUser = Helper.serializeUser(user);

    // Cache the user
    await cacheUser(userId, safeUser, this.USER_CACHE_TTL);

    logger.debug("User fetched from database and cached", { userId });

    return safeUser;
  }

  static async getAllUsersByRole(roleId: string): Promise<User[]> {
    if (!roleId) {
      logger.warn("Get users by role attempted without role ID");
      throw ApiError.badRequest("roleId is required");
    }

    // Check cache first
    const cacheKey = `users:role:${roleId}`;
    const cachedUsers = await getCache<User[]>(cacheKey);

    if (cachedUsers) {
      logger.debug("Users by role fetched from cache", {
        roleId,
        count: cachedUsers.length,
      });
      return cachedUsers;
    }

    const users = await Prisma.user.findMany({
      where: {
        roleId,
        status: "ACTIVE", // Only active users
      },
      include: {
        role: { select: { id: true, name: true, level: true } },
        wallets: true,
        parent: { select: { id: true, username: true } },
        children: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const safeUsers = users.map((user) => Helper.serializeUser(user));

    // Cache the results for 5 minutes
    await setCache(cacheKey, safeUsers, this.USER_CACHE_TTL);

    logger.debug("Users by role fetched from database", {
      roleId,
      count: safeUsers.length,
    });

    return safeUsers;
  }

  static async getAllUsersByParentId(
    parentId: string,
    options: {
      page?: number;
      limit?: number;
      sort?: "asc" | "desc";
      status?: UserStatus | "ALL";
    } = {}
  ): Promise<{ users: User[]; total: number }> {
    const parent = await Prisma.user.findUnique({
      where: { id: parentId },
      select: { id: true },
    });

    if (!parent) {
      throw ApiError.notFound("Parent user not found");
    }

    const {
      page = 1,
      limit = 10,
      sort = "desc",
      status = UserStatus.ACTIVE,
    } = options;

    const skip = (page - 1) * limit;
    const isAll = status === "ALL";

    const queryWhere: any = {
      parentId,
      ...(isAll ? {} : { status }),
    };

    const cacheKey = `users:parent:${parentId}:page:${page}:limit:${limit}:sort:${sort}:status:${status}`;
    const cached = await getCache<{ users: User[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const [users, total] = await Promise.all([
      Prisma.user.findMany({
        where: queryWhere,
        include: {
          role: { select: { id: true, name: true, level: true } },
          wallets: true,
          parent: { select: { id: true, username: true } },
          children: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: sort },
        skip,
        take: limit,
      }),
      Prisma.user.count({ where: queryWhere }),
    ]);

    const safeUsers = users.map((user) => Helper.serializeUser(user));
    await setCache(cacheKey, { users: safeUsers, total }, this.USER_CACHE_TTL);

    return { users: safeUsers, total };
  }

  static async getAllUsersByChildrenId(userId: string): Promise<User[]> {
    if (!userId) {
      logger.warn("Get children users attempted without user ID");
      throw ApiError.badRequest("userId is required");
    }

    // Verify user exists
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, hierarchyPath: true },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Check cache first
    const cacheKey = `users:children:${userId}`;
    const cachedUsers = await getCache<User[]>(cacheKey);

    if (cachedUsers) {
      logger.debug("Children users fetched from cache", {
        userId,
        count: cachedUsers.length,
      });
      return cachedUsers;
    }

    // Get all users where hierarchyPath includes the current user's ID
    // This finds all descendants in the hierarchy
    const users = await Prisma.user.findMany({
      where: {
        hierarchyPath: {
          contains: userId,
        },
        status: "ACTIVE", // Only active users
      },
      include: {
        role: { select: { id: true, name: true, level: true } },
        wallets: true,
        parent: { select: { id: true, username: true } },
        children: { select: { id: true, username: true } },
      },
      orderBy: { hierarchyLevel: "asc" }, // Order by hierarchy level
    });

    const safeUsers = users.map((user) => Helper.serializeUser(user));

    // Cache the results for 5 minutes
    await setCache(cacheKey, safeUsers, this.USER_CACHE_TTL);

    logger.debug("Children users fetched from database", {
      userId,
      count: safeUsers.length,
    });

    return safeUsers;
  }

  static async getAllUsersCountByParentId(
    parentId: string
  ): Promise<{ count: number }> {
    if (!parentId) {
      logger.warn("Get users count by parent attempted without parent ID");
      throw ApiError.badRequest("parentId is required");
    }

    // Check cache first
    const cacheKey = `users:parent:count:${parentId}`;
    const cachedCount = await getCache<number>(cacheKey);

    if (cachedCount !== null) {
      logger.debug("Users count by parent fetched from cache", {
        parentId,
        count: cachedCount,
      });
      return { count: cachedCount };
    }

    const count = await Prisma.user.count({
      where: {
        parentId,
        status: "ACTIVE", // Only active users
      },
    });

    // Cache the count for 5 minutes
    await setCache(cacheKey, count, this.USER_CACHE_TTL);

    logger.debug("Users count by parent fetched from database", {
      parentId,
      count,
    });

    return { count };
  }

  static async getAllUsersCountByChildrenId(
    userId: string
  ): Promise<{ count: number }> {
    if (!userId) {
      logger.warn("Get children count attempted without user ID");
      throw ApiError.badRequest("userId is required");
    }

    // Check cache first
    const cacheKey = `users:children:count:${userId}`;
    const cachedCount = await getCache<number>(cacheKey);

    if (cachedCount !== null) {
      logger.debug("Children count fetched from cache", {
        userId,
        count: cachedCount,
      });
      return { count: cachedCount };
    }

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      select: { hierarchyPath: true },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const count = await Prisma.user.count({
      where: {
        hierarchyPath: {
          contains: userId,
        },
        status: "ACTIVE", // Only active users
      },
    });

    // Cache the count for 5 minutes
    await setCache(cacheKey, count, this.USER_CACHE_TTL);

    logger.debug("Children count fetched from database", {
      userId,
      count,
    });

    return { count };
  }
}

export default UserServices;
