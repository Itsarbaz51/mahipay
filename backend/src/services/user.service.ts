import { UserStatus } from "@prisma/client";
import Prisma from "../db/db.js";
import type { RegisterPayload, User } from "../types/auth.types.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import {
  getCache,
  setCache,
  cacheUser,
  getCachedUser,
  clearPattern,
} from "../utils/redisCasheHelper.js"; // Updated import path
import logger from "../utils/WinstonLogger.js";
import S3Service from "../utils/S3Service.js";

class UserServices {
  private static readonly USER_CACHE_TTL = 600; // 5 minutes

  // ===================== REGISTER =====================
  static async register(
    payload: RegisterPayload
  ): Promise<{ user: User; accessToken: string }> {
    const {
      username,
      firstName,
      lastName,
      profileImage,
      email,
      phoneNumber,
      transactionPin,
      password,
      roleId,
      parentId,
    } = payload;

    const cacheKey = `user_check:${email}:${phoneNumber}:${username}`;
    let profileImageUrl = "";

    try {
      // Check cache first
      const cachedCheck = await getCache(cacheKey);

      if (!cachedCheck) {
        const existingUser = await Prisma.user.findFirst({
          where: {
            OR: [{ email }, { phoneNumber }, { username }],
          },
        });

        if (existingUser) {
          await setCache(cacheKey, "exists", 60);
          throw ApiError.badRequest("User already exists");
        }

        await setCache(cacheKey, "not_exists", 60);
      } else if (cachedCheck === "exists") {
        throw ApiError.badRequest("User already exists");
      }

      // Validate role
      const role = await Prisma.role.findUnique({ where: { id: roleId } });
      if (!role) throw ApiError.badRequest("Invalid roleId");

      const hashedPassword = await Helper.hashPassword(password);
      const hashedPin = await Helper.hashPassword(transactionPin);

      // Parent hierarchy setup
      let hierarchyLevel = 0;
      let hierarchyPath = "";

      if (parentId) {
        const parent = await Prisma.user.findUnique({
          where: { id: parentId },
        });
        if (!parent) throw ApiError.badRequest("Invalid parentId");
        hierarchyLevel = parent.hierarchyLevel + 1;
        hierarchyPath = parent.hierarchyPath
          ? `${parent.hierarchyPath}/${parentId}`
          : `${parentId}`;
      }

      // Upload profile image if present
      if (profileImage) {
        try {
          profileImageUrl =
            (await S3Service.upload(profileImage, "profile")) ?? "";
        } catch (uploadErr) {
          console.warn("Profile image upload failed:", uploadErr);
        }
      }

      // Apply proper casing to names
      const formattedFirstName = this.formatName(firstName);
      const formattedLastName = this.formatName(lastName);

      // Create user
      const user = await Prisma.user.create({
        data: {
          username,
          firstName: formattedFirstName,
          lastName: formattedLastName,
          profileImage: profileImageUrl,
          email,
          phoneNumber,
          roleId,
          password: hashedPassword,
          transactionPin: hashedPin,
          isAuthorized: false,
          isKycVerified: false,
          status: "ACTIVE",
          hierarchyLevel,
          hierarchyPath,
          parentId,
          refreshToken: null,
        },
        include: {
          role: { select: { id: true, name: true, level: true } },
          wallets: true,
          parent: { select: { id: true, username: true } },
          children: { select: { id: true, username: true } },
        },
      });

      // Create primary wallet
      await Prisma.wallet.create({
        data: {
          userId: user.id,
          balance: BigInt(0),
          currency: "INR",
          isPrimary: true,
        },
      });

      const accessToken = Helper.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role.name,
        roleLevel: user.role.level,
      });

      // Cache user using your existing utility
      await cacheUser(user.id, Helper.serializeUser(user), this.USER_CACHE_TTL);

      // Clear relevant cache patterns
      await this.clearUserRelatedCache(user.id, parentId, roleId);

      // Audit log
      await Prisma.auditLog.create({
        data: { userId: user.id, action: "REGISTER", metadata: {} },
      });

      logger.info("User registered successfully", { userId: user.id, email });

      return { user, accessToken };
    } catch (err: any) {
      logger.error("Registration error", {
        email,
        error: err.message,
        stack: err.stack,
      });

      if (err instanceof ApiError) throw err;
      throw ApiError.internal("Failed to register user. Please try again.");
    } finally {
      Helper.deleteOldImage(profileImage);
    }
  }

  // ===================== UPDATE PROFILE =====================
  static async updateProfile(
    userId: string,
    updateData: {
      username?: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    }
  ): Promise<User> {
    const { username, phoneNumber, firstName, lastName } = updateData;

    // Check if username or phoneNumber already exists (excluding current user)
    if (username || phoneNumber) {
      const existingUser = await Prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(username ? [{ username }] : []),
                ...(phoneNumber ? [{ phoneNumber }] : []),
              ],
            },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.username === username) {
          throw ApiError.badRequest("Username already taken");
        }
        if (existingUser.phoneNumber === phoneNumber) {
          throw ApiError.badRequest("Phone number already registered");
        }
      }
    }

    // Apply proper casing to names if provided
    const formattedData = { ...updateData };
    if (firstName) {
      formattedData.firstName = this.formatName(firstName);
    }
    if (lastName) {
      formattedData.lastName = this.formatName(lastName);
    }

    const updatedUser = await Prisma.user.update({
      where: { id: userId },
      data: formattedData,
      include: {
        role: { select: { id: true, name: true, level: true } },
        wallets: true,
        parent: { select: { id: true, username: true } },
        children: { select: { id: true, username: true } },
      },
    });

    // Update cache and clear related cache
    await cacheUser(
      userId,
      Helper.serializeUser(updatedUser),
      this.USER_CACHE_TTL
    );

    await this.clearUserRelatedCache(
      userId,
      updatedUser.parentId,
      updatedUser.roleId
    );

    await Prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE_PROFILE",
        metadata: { updatedFields: Object.keys(updateData) },
      },
    });

    logger.info("Profile updated successfully", { userId });

    return updatedUser;
  }

  // ===================== UPDATE PROFILE IMAGE =====================
  static async updateProfileImage(
    userId: string,
    profileImagePath: string
  ): Promise<User> {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: { select: { id: true, name: true, level: true } },
          wallets: true,
        },
      });

      if (!user) {
        throw ApiError.notFound("User not found");
      }

      // Delete old profile image from S3 if exists
      if (user.profileImage) {
        try {
          await S3Service.delete({ fileUrl: user.profileImage });
        } catch (error) {
          logger.error("Failed to delete old profile image", {
            userId,
            profileImage: user.profileImage,
            error,
          });
        }
      }

      // Upload new profile image
      const profileImageUrl =
        (await S3Service.upload(profileImagePath, "profile")) ?? "";

      const updatedUser = await Prisma.user.update({
        where: { id: userId },
        data: { profileImage: profileImageUrl },
        include: {
          role: { select: { id: true, name: true, level: true } },
          wallets: true,
          parent: { select: { id: true, username: true } },
          children: { select: { id: true, username: true } },
        },
      });

      // Update cache and clear related cache
      await cacheUser(
        userId,
        Helper.serializeUser(updatedUser),
        this.USER_CACHE_TTL
      );

      await this.clearUserRelatedCache(
        userId,
        updatedUser.parentId,
        updatedUser.roleId
      );

      await Prisma.auditLog.create({
        data: {
          userId,
          action: "UPDATE_PROFILE_IMAGE",
          metadata: { newImage: profileImageUrl },
        },
      });

      logger.info("Profile image updated successfully", { userId });

      return updatedUser;
    } finally {
      Helper.deleteOldImage(profileImagePath);
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    // Try cache first using your existing utility
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

    // Cache the user using your existing utility
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
        status: "ACTIVE",
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

    // Cache the results using your existing utility
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

    const users = await Prisma.user.findMany({
      where: {
        hierarchyPath: {
          contains: userId,
        },
        status: "ACTIVE",
      },
      include: {
        role: { select: { id: true, name: true, level: true } },
        wallets: true,
        parent: { select: { id: true, username: true } },
        children: { select: { id: true, username: true } },
      },
      orderBy: { hierarchyLevel: "asc" },
    });

    const safeUsers = users.map((user) => Helper.serializeUser(user));

    // Cache the results using your existing utility
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
        status: "ACTIVE",
      },
    });

    // Cache the count using your existing utility
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
        status: "ACTIVE",
      },
    });

    // Cache the count using your existing utility
    await setCache(cacheKey, count, this.USER_CACHE_TTL);

    logger.debug("Children count fetched from database", {
      userId,
      count,
    });

    return { count };
  }

  // ===================== HELPER METHODS =====================

  /**
   * Format name with proper casing (First Letter Capital)
   */
  private static formatName(name: string): string {
    if (!name) return name;

    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim();
  }

  /**
   * Clear all cache related to user operations
   */
  private static async clearUserRelatedCache(
    userId: string,
    parentId: string | null,
    roleId: string
  ): Promise<void> {
    try {
      const patternsToClear = [
        "user_check:*",
        `users:role:${roleId}`,
        `users:children:${userId}`,
        `users:children:count:${userId}`,
      ];

      // Add parent-related cache patterns if parent exists
      if (parentId) {
        patternsToClear.push(
          `users:parent:${parentId}:*`,
          `users:parent:count:${parentId}`
        );
      }

      // Clear all patterns using your existing utility
      await Promise.all(
        patternsToClear.map((pattern) => clearPattern(pattern))
      );

      logger.debug("User-related cache cleared successfully", {
        userId,
        parentId,
        roleId,
        patternsCleared: patternsToClear,
      });
    } catch (error) {
      logger.error("Failed to clear user-related cache", {
        userId,
        parentId,
        roleId,
        error,
      });
    }
  }
}

export default UserServices;
