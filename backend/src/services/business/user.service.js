import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";
import { CryptoService } from "../../utils/cryptoService.js";
import Helper from "../../utils/helper.js";

class BusinessUserService {
  /**
   * Get All Business Users (Admin can see all business users except other admins)
   */
  static async getAllBusinessUsers(options = {}, adminUser, req = null) {
    const { page = 1, limit = 20, status = "ALL", search = "" } = options;

    const offset = (page - 1) * limit;

    // Get business roles (exclude ADMIN)
    const businessRoles = await models.Role.findAll({
      where: {
        type: "business",
        name: { [models.Sequelize.Op.ne]: "ADMIN" },
      },
    });

    const businessRoleIds = businessRoles.map((role) => role.id);

    const whereConditions = {
      roleId: { [models.Sequelize.Op.in]: businessRoleIds },
    };

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
      action: "BUSINESS_USERS_ACCESSED",
      entity: "USER",
      performedById: adminUser.id,
      performedByType: "ADMIN",
      description: "Admin accessed business users",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        totalUsers: users.count,
        filters: { status, search },
      },
    });

    return {
      users: users.rows.map((user) => this.sanitizeUserData(user)),
      total: users.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(users.count / limit),
    };
  }

  /**
   * Get Business User by ID
   */
  static async getBusinessUserById(userId, adminUser, req = null) {
    const user = await models.User.findByPk(userId, {
      include: [
        { model: models.Role, as: "role" },
        { model: models.Wallet, as: "wallets" },
        { model: models.User, as: "parent" },
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

    // Ensure it's a business user (not admin)
    if (user.role.name === "ADMIN") {
      throw ApiError.forbidden("Cannot access admin user details");
    }

    await AuditService.createLog({
      action: "BUSINESS_USER_DETAILS_ACCESSED",
      entity: "USER",
      entityId: userId,
      performedById: adminUser.id,
      performedByType: "ADMIN",
      description: "Admin accessed business user details",
      ipAddress: req ? Helper.getClientIP(req) : null,
    });

    return this.sanitizeUserData(user);
  }

  /**
   * Create Business User
   */
  static async createBusinessUser(payload, adminUser, req = null) {
    const {
      username,
      firstName,
      lastName,
      email,
      phoneNumber,
      roleId,
      parentId = adminUser.id,
    } = payload;

    // Check existing user
    const existingUser = await models.User.findOne({
      where: {
        [models.Sequelize.Op.or]: [{ email }, { phoneNumber }, { username }],
      },
    });

    if (existingUser) {
      throw ApiError.badRequest("User already exists");
    }

    const role = await models.Role.findByPk(roleId);
    if (!role || role.type !== "business" || role.name === "ADMIN") {
      throw ApiError.badRequest("Invalid business role");
    }

    const generatedPassword = Helper.generatePassword();
    const generatedTransactionPin = Helper.generateTransactionPin();

    const hashedPassword = CryptoService.encrypt(generatedPassword);
    const hashedPin = CryptoService.encrypt(generatedTransactionPin);

    // Setup hierarchy
    const parent = await models.User.findByPk(parentId);
    if (!parent) {
      throw ApiError.badRequest("Invalid parent user");
    }

    const hierarchyLevel = parent.hierarchyLevel + 1;
    const hierarchyPath = parent.hierarchyPath
      ? `${parent.hierarchyPath}/${parentId}`
      : `${parentId}`;

    const user = await models.User.create({
      username,
      firstName: this.formatName(firstName),
      lastName: this.formatName(lastName),
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
      transactionPin: hashedPin,
      roleId,
      parentId,
      hierarchyLevel,
      hierarchyPath,
      status: "INACTIVE",
      deactivationReason: "Account pending activation by admin",
    });

    // Create wallet for business user
    await models.Wallet.create({
      userId: user.id,
      balance: 0,
      currency: "INR",
      walletType: "PRIMARY",
      holdBalance: 0,
      availableBalance: 0,
      isActive: true,
      version: 1,
    });

    await AuditService.createLog({
      action: "BUSINESS_USER_CREATED",
      entity: "USER",
      entityId: user.id,
      performedById: adminUser.id,
      performedByType: "ADMIN",
      description: "Admin created business user",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        userEmail: user.email,
        role: role.name,
        parentId,
      },
    });

    return this.sanitizeUserData(user);
  }

  /**
   * Activate/Deactivate Business User
   */
  static async updateUserStatus(
    userId,
    status,
    adminUser,
    reason = "No reason provided",
    req = null
  ) {
    const user = await models.User.findByPk(userId, {
      include: [{ model: models.Role, as: "role" }],
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (user.role.name === "ADMIN") {
      throw ApiError.forbidden("Cannot modify admin user status");
    }

    if (user.status === status) {
      throw ApiError.badRequest(`User is already ${status.toLowerCase()}`);
    }

    await models.User.update(
      {
        status,
        deactivationReason: reason,
        updatedAt: new Date(),
      },
      { where: { id: userId } }
    );

    await AuditService.createLog({
      action: status === "ACTIVE" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      entity: "USER",
      entityId: userId,
      performedById: adminUser.id,
      performedByType: "ADMIN",
      description: `Admin ${status === "ACTIVE" ? "activated" : "deactivated"} user`,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        previousStatus: user.status,
        newStatus: status,
        reason,
      },
    });

    return {
      message: `User ${status === "ACTIVE" ? "activated" : "deactivated"} successfully`,
    };
  }

  /**
   * Reset User Password
   */
  static async resetUserPassword(userId, adminUser, req = null) {
    const user = await models.User.findByPk(userId, {
      include: [{ model: models.Role, as: "role" }],
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (user.role.name === "ADMIN") {
      throw ApiError.forbidden("Cannot reset admin password");
    }

    const newPassword = Helper.generatePassword();
    const hashedPassword = CryptoService.encrypt(newPassword);

    await models.User.update(
      { password: hashedPassword, refreshToken: null },
      { where: { id: userId } }
    );

    await AuditService.createLog({
      action: "USER_PASSWORD_RESET",
      entity: "USER",
      entityId: userId,
      performedById: adminUser.id,
      performedByType: "ADMIN",
      description: "Admin reset user password",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: { userEmail: user.email },
    });

    return {
      message: "Password reset successfully",
      newPassword, // In real scenario, this would be sent via email
    };
  }

  // ==================== HELPER METHODS ====================

  static sanitizeUserData(user) {
    const { password, transactionPin, refreshToken, ...safeData } =
      user.toJSON();
    return safeData;
  }

  static formatName(name) {
    if (!name) return name;
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim();
  }
}

export default BusinessUserService;
