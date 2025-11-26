import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";
import { CryptoService } from "../../utils/cryptoService.js";
import AuditService from "../audit.service.js";
import EmployeeService from "../employee.service.js";

import {
  sendCredentialsEmail,
  sendPasswordResetEmail,
} from "../../utils/sendCredentialsEmail.js";
import crypto from "crypto";
import { UserPermissionService } from "../permission.service.js";

class AuthService {
  /**
   * Unified Login Service for all user types
   */
  static async login(payload, req = null) {
    const { emailOrUsername, password, latitude, longitude, accuracy } =
      payload;

    try {
      // Find user across all models
      const user = await this.findUserByCredentials(emailOrUsername);
      if (!user) {
        await this.logFailedLoginAttempt(null, "USER_NOT_FOUND", req);
        throw ApiError.unauthorized("Invalid credentials");
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(user, password);
      if (!isValidPassword) {
        await this.logFailedLoginAttempt(user.id, "INVALID_PASSWORD", req);
        throw ApiError.unauthorized("Invalid credentials");
      }

      // Check user status
      await this.checkUserStatus(user);

      // Get user permissions based on type
      const permissions = await this.getUserPermissions(user);
      user.userPermissions = permissions;

      // Build token payload
      const tokenPayload = await this.buildTokenPayload(user, permissions);

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(tokenPayload);

      // Update refresh token
      await this.updateRefreshToken(user, refreshToken);

      // Create comprehensive login audit log (replaces login log)
      await this.createLoginAuditLog(
        user,
        req,
        { latitude, longitude, accuracy },
        "LOGIN_SUCCESS"
      );

      return {
        user: this.sanitizeUserData(user),
        accessToken,
        refreshToken,
        userType: user.userType,
      };
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Login failed");
    }
  }

  /**
   * Get User by ID with complete details
   */
  static async getUserById(userId, currentUser = null, userType = null) {
    try {
      const user = await this.findUserByIdWithDetails(userId, userType);
      if (!user) {
        await AuditService.createLog({
          action: "USER_RETRIEVAL_FAILED",
          entity: "USER",
          entityId: userId,
          performedById: currentUser?.id,
          performedByType: currentUser?.userType || "SYSTEM",
          description: "User not found",
          ipAddress: currentUser?.ipAddress || null,
          metadata: {
            reason: "USER_NOT_FOUND",
            requestedBy: currentUser?.id,
          },
        });
        throw ApiError.notFound("User not found");
      }

      // Get permissions
      const permissions = await this.getUserPermissions(user);
      user.userPermissions = permissions;

      // Transform user data with KYC and bank info
      const transformedUser = this.transformUserData(user);

      // Sanitize based on current user role
      const safeUser = this.sanitizeUserForResponse(
        transformedUser,
        currentUser
      );

      return safeUser;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error(`Error getting user ${userId}:`, error);
      throw ApiError.internal("Failed to retrieve user data");
    }
  }

  /**
   * Logout Service
   */
  static async logout(userId, userType, refreshToken = null, req = null) {
    try {
      await this.clearRefreshToken(userId, userType);

      if (refreshToken) {
        this.revokeToken(refreshToken);
      }

      await AuditService.createLog({
        action: "LOGOUT",
        entity: "AUTH",
        entityId: userId,
        performedById: userId,
        performedByType: userType.toUpperCase(),
        description: "User logged out successfully",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          hasRefreshToken: !!refreshToken,
          userAgent: req?.headers?.["user-agent"] || "",
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  /**
   * Refresh Token Service
   */
  static async refreshToken(refreshToken, req = null) {
    let payload;

    try {
      payload = Helper.verifyRefreshToken(refreshToken);
    } catch (error) {
      await AuditService.createLog({
        action: "REFRESH_TOKEN_INVALID",
        entity: "AUTH",
        performedById: payload?.id || null,
        performedByType: "SYSTEM",
        description: "Invalid refresh token",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: { error: error.message },
      });
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await this.findUserWithRefreshToken(payload.id, refreshToken);
    if (!user) {
      await AuditService.createLog({
        action: "REFRESH_TOKEN_USER_NOT_FOUND",
        entity: "AUTH",
        entityId: payload.id,
        performedById: payload.id,
        performedByType: "SYSTEM",
        description: "User not found or invalid refresh token",
        ipAddress: req ? Helper.getClientIP(req) : null,
      });
      throw ApiError.unauthorized("Invalid refresh token");
    }

    // Get permissions
    const permissions = await this.getUserPermissions(user);
    const tokenPayload = await this.buildTokenPayload(user, permissions);

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      this.generateTokens(tokenPayload);

    await this.updateRefreshToken(user, newRefreshToken);

    await AuditService.createLog({
      action: "REFRESH_TOKEN_SUCCESS",
      entity: "AUTH",
      entityId: user.id,
      performedById: user.id,
      performedByType: user.userType.toUpperCase(),
      description: "Token refreshed successfully",
      ipAddress: req ? Helper.getClientIP(req) : null,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUserData(user),
    };
  }

  /**
   * Password Reset Request
   */
  static async requestPasswordReset(email, req = null) {
    const user = await this.findUserByEmail(email);

    if (!user) {
      // Security: Don't reveal if user exists
      await AuditService.createLog({
        action: "PASSWORD_RESET_REQUEST_FAILED",
        entity: "AUTH",
        performedByType: "SYSTEM",
        description: "Password reset request for non-existent email",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: { email, reason: "USER_NOT_FOUND" },
      });

      return {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    }

    const { token, tokenHash, expires } = this.generatePasswordResetToken();
    await this.storePasswordResetToken(user, tokenHash, expires);
    await this.sendPasswordResetEmail(user, token);

    await AuditService.createLog({
      action: "PASSWORD_RESET_REQUESTED",
      entity: "AUTH",
      entityId: user.id,
      performedById: user.id,
      performedByType: user.userType.toUpperCase(),
      description: "Password reset requested",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: { email, userType: user.userType },
    });

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  /**
   * Confirm Password Reset
   */
  static async confirmPasswordReset(encryptedToken, req = null) {
    try {
      const token = CryptoService.decrypt(encryptedToken);
      const tokenHash = CryptoService.hashData(token);

      const user = await this.findUserByResetToken(tokenHash);
      if (!user) {
        await AuditService.createLog({
          action: "PASSWORD_RESET_CONFIRMATION_FAILED",
          entity: "AUTH",
          performedByType: "SYSTEM",
          description: "Invalid or expired reset token",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: { reason: "INVALID_OR_EXPIRED_TOKEN" },
        });
        throw ApiError.badRequest("Invalid or expired token");
      }

      const { newPassword, newTransactionPin } =
        await this.generateNewCredentials(user);
      await this.updateUserCredentials(user, newPassword, newTransactionPin);
      await this.sendNewCredentialsEmail(user, newPassword, newTransactionPin);

      await AuditService.createLog({
        action: "PASSWORD_RESET_CONFIRMED",
        entity: "AUTH",
        entityId: user.id,
        performedById: user.id,
        performedByType: user.userType.toUpperCase(),
        description: "Password reset confirmed",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          userType: user.userType,
          hasTransactionPin: !!newTransactionPin,
        },
      });

      return {
        message:
          "Password reset successfully, and your credentials have been sent to your email.",
      };
    } catch (error) {
      console.error("Password reset confirmation error:", error);

      await AuditService.createLog({
        action: "PASSWORD_RESET_CONFIRMATION_ERROR",
        entity: "AUTH",
        performedByType: "SYSTEM",
        description: "Password reset confirmation failed",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          error: error.message,
          reason: error.message.includes("Decryption failed")
            ? "MALFORMED_TOKEN"
            : "UNKNOWN_ERROR",
        },
      });

      if (error.message.includes("Decryption failed")) {
        throw ApiError.badRequest("Invalid or malformed token");
      }
      throw error;
    }
  }

  /**
   * Email Verification
   */
  static async verifyEmail(token, req = null) {
    if (!token) {
      await AuditService.createLog({
        action: "EMAIL_VERIFICATION_FAILED",
        entity: "AUTH",
        performedByType: "SYSTEM",
        description: "Missing verification token",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: { reason: "MISSING_TOKEN" },
      });
      throw ApiError.badRequest("Verification token missing");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await this.findUserByVerificationToken(tokenHash);

    if (!user) {
      await AuditService.createLog({
        action: "EMAIL_VERIFICATION_FAILED",
        entity: "AUTH",
        performedByType: "SYSTEM",
        description: "Invalid verification token",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: { reason: "INVALID_TOKEN" },
      });
      throw ApiError.badRequest("Invalid verification token");
    }

    await this.verifyUserEmail(user);

    await AuditService.createLog({
      action: "EMAIL_VERIFIED",
      entity: "AUTH",
      entityId: user.id,
      performedById: user.id,
      performedByType: user.userType.toUpperCase(),
      description: "Email verified successfully",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: { email: user.email },
    });

    return { message: "Email verified successfully" };
  }

  /**
   * Update User Credentials
   */
  static async updateCredentials(
    userId,
    userType,
    credentialsData,
    requestedBy,
    req = null
  ) {
    const user = await this.findUserById(userId, userType);
    if (!user) {
      await AuditService.createLog({
        action: "CREDENTIALS_UPDATE_FAILED",
        entity: "AUTH",
        entityId: userId,
        performedById: requestedBy,
        performedByType: "SYSTEM",
        description: "User not found for credentials update",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          reason: "USER_NOT_FOUND",
          requestedBy,
          userType,
        },
      });
      throw ApiError.notFound("User not found");
    }

    const isOwnUpdate = requestedBy === userId;

    // Verify current password
    const isValidPassword = await this.verifyPassword(
      user,
      credentialsData.currentPassword
    );
    if (!isValidPassword) {
      await AuditService.createLog({
        action: "CREDENTIALS_UPDATE_FAILED",
        entity: "AUTH",
        entityId: userId,
        performedById: requestedBy,
        performedByType: "SYSTEM",
        description: "Invalid current password provided",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          reason: "INVALID_CURRENT_PASSWORD",
          requestedBy,
          isOwnUpdate,
          userType,
        },
      });
      throw ApiError.unauthorized("Current password is incorrect");
    }

    const updateData = {};
    const updatedFields = [];

    if (credentialsData.newPassword) {
      updateData.password = CryptoService.encrypt(credentialsData.newPassword);
      updateData.refreshToken = null; // Invalidate all sessions
      updatedFields.push("password");
    }

    // Handle transaction pin for BUSINESS users
    if (
      credentialsData.newTransactionPin &&
      (userType === "BUSINESS" || userType === "ADMIN")
    ) {
      if (!credentialsData.currentTransactionPin) {
        await AuditService.createLog({
          action: "CREDENTIALS_UPDATE_FAILED",
          entity: "AUTH",
          entityId: userId,
          performedById: requestedBy,
          performedByType: "SYSTEM",
          description: "Missing current transaction PIN",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            reason: "MISSING_CURRENT_TRANSACTION_PIN",
            requestedBy,
            isOwnUpdate,
            userType,
          },
        });
        throw ApiError.badRequest("Current transaction PIN is required");
      }

      const isValidPin = await this.verifyTransactionPin(
        user,
        credentialsData.currentTransactionPin
      );
      if (!isValidPin) {
        await AuditService.createLog({
          action: "CREDENTIALS_UPDATE_FAILED",
          entity: "AUTH",
          entityId: userId,
          performedById: requestedBy,
          performedByType: "SYSTEM",
          description: "Invalid current transaction PIN provided",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            reason: "INVALID_CURRENT_TRANSACTION_PIN",
            requestedBy,
            isOwnUpdate,
            userType,
          },
        });
        throw ApiError.unauthorized("Current transaction PIN is incorrect");
      }

      updateData.transactionPin = CryptoService.encrypt(
        credentialsData.newTransactionPin
      );
      updatedFields.push("transactionPin");
    }

    await this.updateUser(userId, userType, updateData);

    await AuditService.createLog({
      action: "CREDENTIALS_UPDATED",
      entity: "AUTH",
      entityId: userId,
      performedById: requestedBy || userId,
      performedByType: userType.toUpperCase(),
      description: "User credentials updated successfully",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        updatedFields,
        isOwnUpdate,
        requestedBy,
        userType,
        targetUserId: userId,
      },
    });

    return { message: "Credentials updated successfully" };
  }

  /**
   * Create and Send Email Verification
   */
  static async createAndSendEmailVerification(user, req = null) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.storeEmailVerificationToken(user, tokenHash, expires);

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;

    // Send email (implementation depends on your email service)
    await this.sendVerificationEmail(user, verifyUrl);

    await AuditService.createLog({
      action: "EMAIL_VERIFICATION_SENT",
      entity: "AUTH",
      entityId: user.id,
      performedById: user.id,
      performedByType: user.userType.toUpperCase(),
      description: "Email verification sent to user",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        email: user.email,
        userType: user.userType,
      },
    });
  }

  // ==================== HELPER METHODS ====================

  /**
   * Find user by credentials (email or username)
   */
  static async findUserByCredentials(emailOrUsername) {
    // Check User model (BUSINESS Users)
    let user = await models.User.findOne({
      where: {
        [models.Sequelize.Op.or]: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
      include: [
        {
          model: models.Role,
          as: "role",
          attributes: ["id", "name", "level", "type", "description"],
        },
        {
          model: models.User,
          as: "parent",
          attributes: [
            "id",
            "username",
            "firstName",
            "lastName",
            "email",
            "phoneNumber",
            "profileImage",
          ],
        },
        {
          model: models.Wallet,
          as: "wallets",
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (user) {
      user.userType = user.role?.name === "ADMIN" ? "ADMIN" : "BUSINESS";
      return user;
    }

    // Check Employee model
    user = await models.Employee.findOne({
      where: {
        [models.Sequelize.Op.or]: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
      include: [
        {
          model: models.Department,
          as: "department",
          attributes: ["id", "name", "description"],
        },
        {
          model: models.EmployeePermission,
          as: "employeePermissions",
          where: { isActive: true },
          required: false,
          attributes: ["id", "permission", "isActive"],
        },
      ],
    });

    if (user) {
      user.userType = "EMPLOYEE";
      return user;
    }

    // Check Root model
    user = await models.Root.findOne({
      where: {
        [models.Sequelize.Op.or]: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
    });

    if (user) {
      user.userType = "ROOT";
      return user;
    }

    return null;
  }

  /**
   * Find user by ID with complete details
   */
  static async findUserByIdWithDetails(userId, userType = null) {
    if (userType === "EMPLOYEE" || !userType) {
      const employee = await models.Employee.findByPk(userId, {
        include: [
          {
            model: models.Department,
            as: "department",
            attributes: ["id", "name", "description"],
          },
          {
            model: models.EmployeePermission,
            as: "employeePermissions",
            where: { isActive: true },
            required: false,
            attributes: ["id", "permission", "isActive"],
          },
        ],
      });
      if (employee) {
        employee.userType = "EMPLOYEE";
        return employee;
      }
    }

    if (userType === "BUSINESS" || userType === "ADMIN" || !userType) {
      const user = await models.User.findByPk(userId, {
        include: [
          {
            model: models.Role,
            as: "role",
            attributes: ["id", "name", "level", "description", "type"],
          },
          {
            model: models.User,
            as: "parent",
            attributes: [
              "id",
              "username",
              "firstName",
              "lastName",
              "email",
              "phoneNumber",
              "profileImage",
            ],
          },
          {
            model: models.Wallet,
            as: "wallets",
            attributes: ["id", "balance", "currency", "isActive"],
          },
          {
            model: models.UserKyc,
            as: "kycs",
            include: [
              {
                model: models.Address,
                as: "address",
                include: [
                  {
                    model: models.State,
                    as: "state",
                    attributes: ["id", "stateName", "stateCode"],
                  },
                  {
                    model: models.City,
                    as: "city",
                    attributes: ["id", "cityName", "cityCode"],
                  },
                ],
              },
            ],
            order: [["createdAt", "DESC"]],
            limit: 1,
          },
          {
            model: models.BankAccount,
            as: "bankAccounts",
            where: { status: "VERIFIED" },
            required: false,
            order: [["isPrimary", "DESC"]],
          },
          {
            model: models.UserPermission,
            as: "userPermissions",
            include: [
              {
                model: models.Service,
                as: "service",
                attributes: ["id", "name", "code", "isActive"],
              },
            ],
          },
          {
            model: models.PIIConsent,
            as: "piiConsents",
            where: { expiresAt: { [models.Sequelize.Op.gt]: new Date() } },
            required: false,
            attributes: [
              "id",
              "piiType",
              "scope",
              "providedAt",
              "expiresAt",
              "userKycId",
            ],
          },
        ],
      });
      if (user) {
        user.userType = user.role?.name === "ADMIN" ? "ADMIN" : "BUSINESS";
        return user;
      }
    }

    if (userType === "ROOT" || !userType) {
      const root = await models.Root.findByPk(userId);
      if (root) {
        root.userType = "ROOT";
        return root;
      }
    }

    return null;
  }

  /**
   * Verify user password
   */
  static async verifyPassword(user, password) {
    try {
      const decryptedPassword = CryptoService.decrypt(user.password);
      return decryptedPassword === password;
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  }

  /**
   * Verify transaction pin
   */
  static async verifyTransactionPin(user, pin) {
    try {
      if (!user.transactionPin) return false;
      const decryptedPin = CryptoService.decrypt(user.transactionPin);
      return decryptedPin === pin;
    } catch (error) {
      console.error("Transaction pin verification error:", error);
      return false;
    }
  }

  /**
   * Check user status
   */
  static async checkUserStatus(user) {
    if (user.status === "DELETED") {
      throw ApiError.unauthorized("Account deleted");
    }
    if (user.status === "SUSPENDED") {
      throw ApiError.unauthorized("Account suspended");
    }
    if (user.status === "INACTIVE") {
      throw ApiError.unauthorized("Account inactive");
    }
  }

  /**
   * Get user permissions based on type
   */
  static async getUserPermissions(user) {
    try {
      if (user.userType === "EMPLOYEE") {
        return await EmployeeService.getEmployeePermissions(user.id);
      } else if (["ADMIN", "BUSINESS"].includes(user.userType)) {
        return await UserPermissionService.getUserPermissions(user.id);
      } else if (user.userType === "ROOT") {
        return []; // Root has all permissions implicitly
      }
      return [];
    } catch (error) {
      console.error(`Failed to get permissions for user ${user.id}:`, error);
      return [];
    }
  }

  /**
   * Build token payload
   */
  static async buildTokenPayload(user, permissions = []) {
    const basePayload = {
      id: user.id,
      email: user.email,
      userType: user.userType,
    };

    switch (user.userType) {
      case "EMPLOYEE":
        return {
          ...basePayload,
          role: user.department?.name || "EMPLOYEE",
          roleLevel: user.hierarchyLevel,
          permissions: permissions,
        };

      case "ROOT":
        return {
          ...basePayload,
          role: "ROOT",
          roleLevel: 0, // Highest level
          permissions: [], // Root has all permissions
        };

      case "ADMIN":
      case "BUSINESS":
        return {
          ...basePayload,
          role: user.role?.name,
          roleLevel: user.role?.level,
          permissions: permissions,
        };

      default:
        return basePayload;
    }
  }

  /**
   * Generate tokens
   */
  static generateTokens(payload) {
    const accessToken = Helper.generateAccessToken(payload);
    const refreshToken = Helper.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  }

  /**
   * Update refresh token
   */
  static async updateRefreshToken(user, refreshToken) {
    switch (user.userType) {
      case "EMPLOYEE":
        await models.Employee.update(
          { refreshToken },
          { where: { id: user.id } }
        );
        break;
      case "ROOT":
        await models.Root.update({ refreshToken }, { where: { id: user.id } });
        break;
      case "ADMIN":
      case "BUSINESS":
        await models.User.update({ refreshToken }, { where: { id: user.id } });
        break;
    }
  }

  /**
   * Clear refresh token
   */
  static async clearRefreshToken(userId, userType) {
    switch (userType) {
      case "EMPLOYEE":
        await models.Employee.update(
          { refreshToken: null },
          { where: { id: userId } }
        );
        break;
      case "ROOT":
        await models.Root.update(
          { refreshToken: null },
          { where: { id: userId } }
        );
        break;
      case "ADMIN":
      case "BUSINESS":
        await models.User.update(
          { refreshToken: null },
          { where: { id: userId } }
        );
        break;
    }
  }

  /**
   * Find user with refresh token
   */
  static async findUserWithRefreshToken(userId, refreshToken) {
    let user = await models.User.findOne({
      where: { id: userId, refreshToken },
      include: [{ model: models.Role, as: "role" }],
    });
    if (user) {
      user.userType = user.role?.name === "ADMIN" ? "ADMIN" : "BUSINESS";
      return user;
    }

    user = await models.Employee.findOne({
      where: { id: userId, refreshToken },
      include: [{ model: models.Department, as: "department" }],
    });
    if (user) {
      user.userType = "EMPLOYEE";
      return user;
    }

    user = await models.Root.findOne({
      where: { id: userId, refreshToken },
    });
    if (user) {
      user.userType = "ROOT";
      return user;
    }

    return null;
  }

  /**
   * Create comprehensive login audit log (replaces login log)
   */
  static async createLoginAuditLog(
    user,
    req,
    location = null,
    action = "LOGIN_SUCCESS"
  ) {
    const ip = req ? Helper.getClientIP(req) : null;

    const metadata = {
      userType: user.userType,
      userAgent: req?.headers?.["user-agent"] || "",
      domainName: req?.hostname,
      loginType: "DIRECT_LOGIN",
    };

    if (location && location.latitude && location.longitude) {
      try {
        const clientLocation = await Helper.reverseGeocode(
          location.latitude,
          location.longitude
        );
        metadata.latitude = location.latitude;
        metadata.longitude = location.longitude;
        metadata.location = clientLocation.address;
        metadata.accuracy = location.accuracy;
        metadata.geoLocation = {
          coordinates: [location.longitude, location.latitude],
          accuracy: location.accuracy,
        };
      } catch (error) {
        metadata.location = `${location.latitude}, ${location.longitude}`;
        metadata.coordinates = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
      }
    }

    if (user.userType === "EMPLOYEE" && user.department) {
      metadata.department = user.department.name;
      metadata.departmentId = user.department.id;
    }

    if (user.userType === "BUSINESS" || user.userType === "ADMIN") {
      metadata.role = user.role?.name;
      metadata.roleLevel = user.role?.level;
    }

    // Add device information if available
    if (req) {
      metadata.deviceInfo = {
        platform: req.headers["sec-ch-ua-platform"] || "unknown",
        browser: req.headers["user-agent"]
          ? req.headers["user-agent"].split(" ").slice(-2).join(" ")
          : "unknown",
      };
    }

    await AuditService.createLog({
      action,
      entity: "AUTH",
      entityId: user.id,
      performedById: user.id,
      performedByType: user.userType.toUpperCase(),
      description:
        action === "LOGIN_SUCCESS"
          ? `User logged in successfully from ${metadata.location || "unknown location"}`
          : `Login attempt failed for user`,
      ipAddress: ip ? String(ip) : null,
      userAgent: req?.headers?.["user-agent"] || "",
      metadata,
    });
  }

  /**
   * Log failed login attempt
   */
  static async logFailedLoginAttempt(userId, reason, req) {
    const ip = req ? Helper.getClientIP(req) : null;

    await AuditService.createLog({
      action: "LOGIN_FAILED",
      entity: "AUTH",
      entityId: userId,
      performedById: userId,
      performedByType: "SYSTEM",
      description: "Login attempt failed",
      ipAddress: ip ? String(ip) : null,
      userAgent: req?.headers?.["user-agent"] || "",
      metadata: {
        reason,
        userAgent: req?.headers?.["user-agent"] || "",
        failedAttempt: true,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken() {
    const token = CryptoService.generateSecureToken(32);
    const tokenHash = CryptoService.hashData(token);
    const expires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    return { token, tokenHash, expires };
  }

  /**
   * Store password reset token
   */
  static async storePasswordResetToken(user, tokenHash, expires) {
    const updateData = {
      passwordResetToken: tokenHash,
      passwordResetExpires: expires,
    };

    switch (user.userType) {
      case "EMPLOYEE":
        await models.Employee.update(updateData, { where: { id: user.id } });
        break;
      case "ROOT":
        await models.Root.update(updateData, { where: { id: user.id } });
        break;
      case "ADMIN":
      case "BUSINESS":
        await models.User.update(updateData, { where: { id: user.id } });
        break;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(user, token) {
    const encryptedToken = CryptoService.encrypt(token);
    const resetUrl = `${process.env.CLIENT_URL}/verify-reset-password?token=${encodeURIComponent(encryptedToken)}&email=${encodeURIComponent(user.email)}`;

    await sendPasswordResetEmail(
      user,
      resetUrl,
      user.userType,
      `We received a request to reset your ${user.userType} account password.`
    );
  }

  /**
   * Find user by email
   */
  static async findUserByEmail(email) {
    let user = await models.User.findOne({
      where: { email },
      include: [{ model: models.Role, as: "role" }],
    });
    if (user) {
      user.userType = user.role?.name === "ADMIN" ? "ADMIN" : "BUSINESS";
      return user;
    }

    user = await models.Employee.findOne({
      where: { email },
      include: [{ model: models.Department, as: "department" }],
    });
    if (user) {
      user.userType = "EMPLOYEE";
      return user;
    }

    user = await models.Root.findOne({ where: { email } });
    if (user) {
      user.userType = "ROOT";
      return user;
    }

    return null;
  }

  /**
   * Find user by reset token
   */
  static async findUserByResetToken(tokenHash) {
    const whereCondition = {
      passwordResetToken: tokenHash,
      passwordResetExpires: { [models.Sequelize.Op.gt]: new Date() },
    };

    let user = await models.User.findOne({
      where: whereCondition,
      include: [{ model: models.Role, as: "role" }],
    });
    if (user) {
      user.userType = user.role?.name === "ADMIN" ? "ADMIN" : "BUSINESS";
      return user;
    }

    user = await models.Employee.findOne({
      where: whereCondition,
      include: [{ model: models.Department, as: "department" }],
    });
    if (user) {
      user.userType = "EMPLOYEE";
      return user;
    }

    user = await models.Root.findOne({ where: whereCondition });
    if (user) {
      user.userType = "ROOT";
      return user;
    }

    return null;
  }

  /**
   * Generate new credentials
   */
  static async generateNewCredentials(user) {
    const newPassword = Helper.generatePassword();
    let newTransactionPin = null;

    if (user.userType === "BUSINESS" || user.userType === "ADMIN") {
      newTransactionPin = Helper.generateTransactionPin();
    }

    return { newPassword, newTransactionPin };
  }

  /**
   * Update user credentials
   */
  static async updateUserCredentials(user, newPassword, newTransactionPin) {
    const updateData = {
      password: CryptoService.encrypt(newPassword),
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshToken: null,
    };

    if (
      newTransactionPin &&
      (user.userType === "BUSINESS" || user.userType === "ADMIN")
    ) {
      updateData.transactionPin = CryptoService.encrypt(newTransactionPin);
    }

    switch (user.userType) {
      case "EMPLOYEE":
        await models.Employee.update(updateData, { where: { id: user.id } });
        break;
      case "ROOT":
        await models.Root.update(updateData, { where: { id: user.id } });
        break;
      case "ADMIN":
      case "BUSINESS":
        await models.User.update(updateData, { where: { id: user.id } });
        break;
    }
  }

  /**
   * Send new credentials email
   */
  static async sendNewCredentialsEmail(user, newPassword, newTransactionPin) {
    if (user.userType === "EMPLOYEE") {
      const permissions = await this.getUserPermissions(user);
      await sendCredentialsEmail(
        user,
        newPassword,
        null,
        "reset",
        "Your employee account password has been reset successfully.",
        "EMPLOYEE",
        {
          role: user.department?.name,
          permissions: permissions,
        }
      );
    } else {
      await sendCredentialsEmail(
        user,
        newPassword,
        newTransactionPin,
        "reset",
        `Your ${user.userType} account password has been reset successfully.`,
        user.userType
      );
    }
  }

  /**
   * Find user by verification token
   */
  static async findUserByVerificationToken(tokenHash) {
    let user = await models.User.findOne({
      where: { emailVerificationToken: tokenHash },
    });
    if (user) {
      user.userType = "BUSINESS";
      return user;
    }

    user = await models.Employee.findOne({
      where: { emailVerificationToken: tokenHash },
    });
    if (user) {
      user.userType = "EMPLOYEE";
      return user;
    }

    user = await models.Root.findOne({
      where: { emailVerificationToken: tokenHash },
    });
    if (user) {
      user.userType = "ROOT";
      return user;
    }

    return null;
  }

  /**
   * Verify user email
   */
  static async verifyUserEmail(user) {
    const updateData = {
      emailVerificationToken: null,
      emailVerifiedAt: new Date(),
    };

    switch (user.userType) {
      case "EMPLOYEE":
        await models.Employee.update(updateData, { where: { id: user.id } });
        break;
      case "ROOT":
        await models.Root.update(updateData, { where: { id: user.id } });
        break;
      case "BUSINESS":
        await models.User.update(updateData, { where: { id: user.id } });
        break;
    }
  }

  /**
   * Store email verification token
   */
  static async storeEmailVerificationToken(user, tokenHash, expires) {
    const updateData = {
      emailVerificationToken: tokenHash,
      emailVerificationTokenExpires: expires,
    };

    switch (user.userType) {
      case "EMPLOYEE":
        await models.Employee.update(updateData, { where: { id: user.id } });
        break;
      case "ROOT":
        await models.Root.update(updateData, { where: { id: user.id } });
        break;
      case "BUSINESS":
        await models.User.update(updateData, { where: { id: user.id } });
        break;
    }
  }

  /**
   * Send verification email
   */
  static async sendVerificationEmail(user, verifyUrl) {
    // Implement based on your email service
    // This is a placeholder - replace with actual email sending logic
    console.log(`Verification email sent to ${user.email}: ${verifyUrl}`);
  }

  /**
   * Find user by ID
   */
  static async findUserById(userId, userType) {
    switch (userType) {
      case "EMPLOYEE":
        return await models.Employee.findByPk(userId);
      case "ROOT":
        return await models.Root.findByPk(userId);
      case "ADMIN":
      case "BUSINESS":
        return await models.User.findByPk(userId);
      default:
        return null;
    }
  }

  /**
   * Update user
   */
  static async updateUser(userId, userType, updateData) {
    switch (userType) {
      case "EMPLOYEE":
        await models.Employee.update(updateData, { where: { id: userId } });
        break;
      case "ROOT":
        await models.Root.update(updateData, { where: { id: userId } });
        break;
      case "ADMIN":
      case "BUSINESS":
        await models.User.update(updateData, { where: { id: userId } });
        break;
    }
  }

  /**
   * Transform user data with KYC and bank info
   */
  static transformUserData(user) {
    if (user.userType === "EMPLOYEE" || user.userType === "ROOT") {
      return user;
    }

    // For BUSINESS users, transform KYC and bank data
    const transformed = {
      ...user.toJSON(),
      kycInfo:
        user.kycs && user.kycs.length > 0
          ? {
              currentStatus: user.kycs[0].status,
              isKycSubmitted: true,
              latestKyc: user.kycs[0],
              kycHistory: user.kycs,
              totalKycAttempts: user.kycs.length,
            }
          : {
              currentStatus: "NOT_SUBMITTED",
              isKycSubmitted: false,
              latestKyc: null,
              kycHistory: [],
              totalKycAttempts: 0,
            },
      bankInfo: {
        totalAccounts: user.bankAccounts?.length || 0,
        primaryAccount: user.bankAccounts?.find((acc) => acc.isPrimary) || null,
        verifiedAccounts: user.bankAccounts || [],
      },
    };

    // Remove original arrays to avoid duplication
    delete transformed.kycs;
    delete transformed.bankAccounts;

    return transformed;
  }

  /**
   * Sanitize user for response based on current user role
   */
  static sanitizeUserForResponse(user, currentUser) {
    const serialized = Helper.serializeUser(user);

    const isCurrentUserADMIN =
      currentUser &&
      (currentUser.role?.name === "ADMIN" || currentUser.role?.name === "ROOT");

    if (isCurrentUserADMIN) {
      // ADMIN can see decrypted sensitive data
      const ADMINView = { ...serialized };

      if (ADMINView.password) {
        try {
          ADMINView.password = CryptoService.decrypt(ADMINView.password);
        } catch (error) {
          console.error("Failed to decrypt password:", error);
          ADMINView.password = "Error decrypting";
        }
      }

      if (ADMINView.transactionPin) {
        try {
          ADMINView.transactionPin = CryptoService.decrypt(
            ADMINView.transactionPin
          );
        } catch (error) {
          console.error("Failed to decrypt transaction pin:", error);
          ADMINView.transactionPin = "Error decrypting";
        }
      }

      return ADMINView;
    } else {
      // Non-ADMIN users get sanitized data
      const { password, transactionPin, refreshToken, ...safeData } =
        serialized;
      return safeData;
    }
  }

  /**
   * Sanitize user data (basic)
   */
  static sanitizeUserData(user) {
    const serialized = Helper.serializeUser(user);
    const { password, transactionPin, refreshToken, ...safeData } = serialized;
    return safeData;
  }

  /**
   * Revoke token
   */
  static revokeToken(token) {
    // Implement token blacklisting if needed
    console.log("Token revoked:", token);
  }
}

export default AuthService;
