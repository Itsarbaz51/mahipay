import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";
import { CryptoService } from "../../utils/cryptoService.js";

class RootUserService {
  /**
   * Get All Users (Root can see all users across system)
   */
  static async getAllUsers(options = {}, rootUser, req = null) {
    const {
      page = 1,
      limit = 50,
      status = "ALL",
      userType = "ALL",
      search = "",
    } = options;

    const offset = (page - 1) * limit;

    const whereConditions = {};
    if (status !== "ALL") whereConditions.status = status;

    if (search.trim()) {
      const searchTerm = `%${search.toLowerCase()}%`;
      whereConditions[models.Sequelize.Op.or] = [
        { username: { [models.Sequelize.Op.iLike]: searchTerm } },
        { firstName: { [models.Sequelize.Op.iLike]: searchTerm } },
        { lastName: { [models.Sequelize.Op.iLike]: searchTerm } },
        { email: { [models.Sequelize.Op.iLike]: searchTerm } },
      ];
    }

    const users = await models.User.findAndCountAll({
      where: whereConditions,
      include: [
        { model: models.Role, as: "role" },
        { model: models.Wallet, as: "wallets" },
        { model: models.User, as: "parent" },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit: parseInt(limit),
    });

    await AuditService.createLog({
      action: "ALL_USERS_ACCESSED",
      entity: "USER",
      performedById: rootUser.id,
      performedByType: "ROOT",
      description: "Root accessed all users",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        totalUsers: users.count,
        filters: { status, userType, search },
      },
    });

    return {
      users: users.rows.map((user) => this.sanitizeUserData(user, true)),
      total: users.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(users.count / limit),
    };
  }

  /**
   * Get User by ID (Root can see any user)
   */
  static async getUserById(userId, rootUser, req = null) {
    const user = await models.User.findByPk(userId, {
      include: [
        { model: models.Role, as: "role" },
        { model: models.Wallet, as: "wallets" },
        { model: models.User, as: "parent" },
        { model: models.User, as: "children" },
        {
          model: models.UserKyc,
          as: "userKyc",
          include: [{ model: models.Address, as: "address" }],
        },
      ],
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    await AuditService.createLog({
      action: "USER_DETAILS_ACCESSED",
      entity: "USER",
      entityId: userId,
      performedById: rootUser.id,
      performedByType: "ROOT",
      description: "Root accessed user details",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: { userId, userEmail: user.email },
    });

    return this.sanitizeUserData(user, true);
  }

  /**
   * Force Update Any User (Root can update any field)
   */
  static async forceUpdateUser(userId, updateData, rootUser, req = null) {
    const user = await models.User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Root can update any field except sensitive ones without verification
    const sensitiveFields = ["password", "transactionPin"];
    const updatePayload = { ...updateData };

    // Handle password update
    if (updateData.password) {
      updatePayload.password = CryptoService.encrypt(updateData.password);
      updatePayload.refreshToken = null; // Invalidate all sessions
    }

    // Handle transaction pin update
    if (updateData.transactionPin) {
      updatePayload.transactionPin = CryptoService.encrypt(
        updateData.transactionPin
      );
    }

    await models.User.update(updatePayload, { where: { id: userId } });

    await AuditService.createLog({
      action: "USER_FORCE_UPDATED",
      entity: "USER",
      entityId: userId,
      performedById: rootUser.id,
      performedByType: "ROOT",
      description: "Root force updated user",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        userId,
        updatedFields: Object.keys(updateData),
        hasPasswordUpdate: !!updateData.password,
        hasPinUpdate: !!updateData.transactionPin,
      },
    });

    return await this.getUserById(userId, rootUser);
  }

  /**
   * Delete User (Root can delete any user)
   */
  static async deleteUser(
    userId,
    rootUser,
    reason = "No reason provided",
    req = null
  ) {
    const user = await models.User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    await models.User.update(
      {
        status: "DELETED",
        deactivationReason: reason,
        deletedAt: new Date(),
      },
      { where: { id: userId } }
    );

    await AuditService.createLog({
      action: "USER_DELETED",
      entity: "USER",
      entityId: userId,
      performedById: rootUser.id,
      performedByType: "ROOT",
      description: "Root deleted user",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        userId,
        userEmail: user.email,
        reason,
      },
    });

    return { message: "User deleted successfully", userId };
  }

  /**
   * Get User Login History
   */
  static async getUserLoginHistory(userId, options = {}, rootUser, req = null) {
    const { limit = 20, page = 1 } = options;
    const offset = (page - 1) * limit;

    const logs = await AuditService.getLogs({
      where: {
        entity: "AUTH",
        entityId: userId,
        action: {
          [models.Sequelize.Op.in]: ["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT"],
        },
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    const loginHistory = logs.rows.map((log) => ({
      id: log.id,
      action: log.action,
      timestamp: log.createdAt,
      ipAddress: log.ipAddress,
      location: log.metadata?.location,
      userAgent: log.metadata?.userAgent,
      status: log.action === "LOGIN_SUCCESS" ? "SUCCESS" : "FAILED",
      reason: log.metadata?.reason,
    }));

    return {
      loginHistory,
      total: logs.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(logs.count / limit),
    };
  }

  // ==================== HELPER METHODS ====================

  static sanitizeUserData(user, isRoot = false) {
    const serialized = user.toJSON ? user.toJSON() : user;

    if (isRoot) {
      // Root can see decrypted data
      if (serialized.password) {
        try {
          serialized.password = CryptoService.decrypt(serialized.password);
        } catch {
          serialized.password = "Encrypted";
        }
      }
      if (serialized.transactionPin) {
        try {
          serialized.transactionPin = CryptoService.decrypt(
            serialized.transactionPin
          );
        } catch {
          serialized.transactionPin = "Encrypted";
        }
      }
    }

    // Always remove refresh token
    const { refreshToken, ...safeData } = serialized;
    return safeData;
  }
}

export default RootUserService;
