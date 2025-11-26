import models from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import { CryptoService } from "../utils/cryptoService.js";
import AuditService from "./audit.service.js";
import {
  sendCredentialsEmail,
  sendPasswordResetEmail,
} from "../utils/sendCredentialsEmail.js";

class AuthService {
  /**
   * Unified Login for all user types (Root, Admin, Employee)
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

      // Build token payload based on user type
      const tokenPayload = await this.buildTokenPayload(user);

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(tokenPayload);

      // Update refresh token
      await this.updateRefreshToken(user, refreshToken);

      // Create login audit log
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
      };
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Login failed");
    }
  }

  /**
   * Password Reset Request
   */
  static async requestPasswordReset(email, req = null) {
    try {
      const user = await this.findUserByEmail(email);

      if (!user) {
        // Don't reveal whether user exists for security
        await AuditService.createLog({
          action: "PASSWORD_RESET_REQUEST_FAILED",
          entity: "AUTH",
          performedByType: "SYSTEM",
          description: "Password reset request for non-existent email",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            email,
            reason: "USER_NOT_FOUND",
          },
        });

        return {
          message:
            "If an account with that email exists, a password reset link has been sent.",
        };
      }

      // Generate reset token
      const { token, tokenHash, expires } = this.generatePasswordResetToken();

      // Store reset token
      await this.storePasswordResetToken(user, tokenHash, expires);

      // Send reset email
      await this.sendPasswordResetEmail(user, token);

      await AuditService.createLog({
        action: "PASSWORD_RESET_REQUESTED",
        entity: "AUTH",
        entityId: user.id,
        performedById: user.id,
        performedByType: user.userType.toUpperCase(),
        description: "Password reset requested",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          email,
          userType: user.userType,
        },
      });

      return {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    } catch (error) {
      console.error("Password reset request error:", error);
      throw ApiError.internal("Failed to process password reset request");
    }
  }

  /**
   * Confirm Password Reset
   */
  static async confirmPasswordReset(encryptedToken, req = null) {
    try {
      const token = CryptoService.decrypt(encryptedToken);
      const tokenHash = CryptoService.hashData(token);

      // Find user with valid reset token
      const user = await this.findUserByResetToken(tokenHash);

      if (!user) {
        await AuditService.createLog({
          action: "PASSWORD_RESET_CONFIRMATION_FAILED",
          entity: "AUTH",
          performedByType: "SYSTEM",
          description: "Invalid or expired reset token",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            reason: "INVALID_OR_EXPIRED_TOKEN",
          },
        });
        throw ApiError.badRequest("Invalid or expired token");
      }

      // Generate new credentials
      const { newPassword, newTransactionPin } =
        await this.generateNewCredentials(user);

      // Update user credentials and clear reset token
      await this.updateUserCredentials(user, newPassword, newTransactionPin);

      // Send credentials email
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
        metadata: {
          reason: "MISSING_TOKEN",
        },
      });
      throw ApiError.badRequest("Verification token missing");
    }

    const tokenHash = CryptoService.hashData(token);
    const user = await this.findUserByVerificationToken(tokenHash);

    if (!user) {
      await AuditService.createLog({
        action: "EMAIL_VERIFICATION_FAILED",
        entity: "AUTH",
        performedByType: "SYSTEM",
        description: "Invalid verification token",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          reason: "INVALID_TOKEN",
        },
      });
      throw ApiError.badRequest("Invalid verification token");
    }

    // Verify email
    await this.verifyUserEmail(user);

    await AuditService.createLog({
      action: "EMAIL_VERIFIED",
      entity: "AUTH",
      entityId: user.id,
      performedById: user.id,
      performedByType: user.userType.toUpperCase(),
      description: "Email verified successfully",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        email: user.email,
      },
    });

    return { message: "Email verified successfully" };
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
        metadata: {
          error: error.message,
        },
      });
      throw ApiError.unauthorized("Invalid refresh token");
    }

    // Find user with refresh token
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
        metadata: {
          reason: "USER_NOT_FOUND_OR_TOKEN_MISMATCH",
        },
      });
      throw ApiError.unauthorized("Invalid refresh token");
    }

    // Build new token payload
    const tokenPayload = await this.buildTokenPayload(user);

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      this.generateTokens(tokenPayload);

    // Update refresh token
    await this.updateRefreshToken(user, newRefreshToken);

    await AuditService.createLog({
      action: "REFRESH_TOKEN_SUCCESS",
      entity: "AUTH",
      entityId: user.id,
      performedById: user.id,
      performedByType: user.userType.toUpperCase(),
      description: "Token refreshed successfully",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        userType: user.userType,
        role: tokenPayload.role,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUserData(user),
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Find user by credentials (email or username)
   */
  static async findUserByCredentials(emailOrUsername) {
    // Check User model (Business Users - Admin & Business Users)
    let user = await models.User.findOne({
      where: {
        [models.Sequelize.Op.or]: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
      include: [
        { model: models.Role, as: "role" },
        { model: models.User, as: "parent" },
        {
          model: models.Wallet,
          as: "wallets",
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (user) {
      user.userType = "business";
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
        { model: models.Department, as: "department" },
        {
          model: models.EmployeePermission,
          as: "employeePermissions",
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (user) {
      user.userType = "employee";
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
      user.userType = "root";
      return user;
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
   * Build token payload based on user type
   */
  static async buildTokenPayload(user) {
    const basePayload = {
      id: user.id,
      email: user.email,
    };

    switch (user.userType) {
      case "employee":
        return {
          ...basePayload,
          role: user.department?.name || "EMPLOYEE",
          roleLevel: user.hierarchyLevel,
          userType: "employee",
          permissions:
            user.employeePermissions?.map((ep) => ep.permission) || [],
        };

      case "root":
        return {
          ...basePayload,
          role: "ROOT",
          roleLevel: user.hierarchyLevel,
          userType: "root",
          permissions: [], // Root has all permissions implicitly
        };

      case "business":
        const isAdmin = user.role?.name === "ADMIN";
        return {
          ...basePayload,
          role: user.role?.name,
          roleLevel: user.role?.hierarchyLevel,
          userType: isAdmin ? "admin" : "business",
          permissions: user.userPermissions?.map((up) => up.permission) || [],
        };

      default:
        return basePayload;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  static generateTokens(payload) {
    const accessToken = Helper.generateAccessToken(payload);
    const refreshToken = Helper.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  /**
   * Update refresh token in database
   */
  static async updateRefreshToken(user, refreshToken) {
    switch (user.userType) {
      case "employee":
        await models.Employee.update(
          { refreshToken },
          { where: { id: user.id } }
        );
        break;

      case "root":
        await models.Root.update({ refreshToken }, { where: { id: user.id } });
        break;

      case "business":
        await models.User.update({ refreshToken }, { where: { id: user.id } });
        break;
    }
  }

  /**
   * Clear refresh token from database
   */
  static async clearRefreshToken(userId, userType) {
    switch (userType) {
      case "employee":
        await models.Employee.update(
          { refreshToken: null },
          { where: { id: userId } }
        );
        break;

      case "root":
        await models.Root.update(
          { refreshToken: null },
          { where: { id: userId } }
        );
        break;

      case "admin":
      case "business":
        await models.User.update(
          { refreshToken: null },
          { where: { id: userId } }
        );
        break;
    }
  }

  /**
   * Find user with valid refresh token
   */
  static async findUserWithRefreshToken(userId, refreshToken) {
    // Check all models
    let user = await models.User.findOne({
      where: { id: userId, refreshToken },
      include: [{ model: models.Role, as: "role" }],
    });

    if (user) {
      user.userType = user.role?.name === "ADMIN" ? "admin" : "business";
      return user;
    }

    user = await models.Employee.findOne({
      where: { id: userId, refreshToken },
      include: [{ model: models.Department, as: "department" }],
    });

    if (user) {
      user.userType = "employee";
      return user;
    }

    user = await models.Root.findOne({
      where: { id: userId, refreshToken },
    });

    if (user) {
      user.userType = "root";
      return user;
    }

    return null;
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
      case "employee":
        await models.Employee.update(updateData, { where: { id: user.id } });
        break;

      case "root":
        await models.Root.update(updateData, { where: { id: user.id } });
        break;

      case "business":
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
      user.userType = user.role?.name === "ADMIN" ? "admin" : "business";
      return user;
    }

    user = await models.Employee.findOne({
      where: { email },
      include: [{ model: models.Department, as: "department" }],
    });

    if (user) {
      user.userType = "employee";
      return user;
    }

    user = await models.Root.findOne({ where: { email } });
    if (user) {
      user.userType = "root";
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
      user.userType = user.role?.name === "ADMIN" ? "admin" : "business";
      return user;
    }

    user = await models.Employee.findOne({
      where: whereCondition,
      include: [{ model: models.Department, as: "department" }],
    });

    if (user) {
      user.userType = "employee";
      return user;
    }

    user = await models.Root.findOne({ where: whereCondition });
    if (user) {
      user.userType = "root";
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

    // Only business users get transaction pin
    if (user.userType === "business" || user.userType === "admin") {
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
      refreshToken: null, // Invalidate all sessions
    };

    if (
      newTransactionPin &&
      (user.userType === "business" || user.userType === "admin")
    ) {
      updateData.transactionPin = CryptoService.encrypt(newTransactionPin);
    }

    switch (user.userType) {
      case "employee":
        await models.Employee.update(updateData, { where: { id: user.id } });
        break;

      case "root":
        await models.Root.update(updateData, { where: { id: user.id } });
        break;

      case "admin":
      case "business":
        await models.User.update(updateData, { where: { id: user.id } });
        break;
    }
  }

  /**
   * Send new credentials email
   */
  static async sendNewCredentialsEmail(user, newPassword, newTransactionPin) {
    if (user.userType === "employee") {
      await sendCredentialsEmail(
        user,
        newPassword,
        null,
        "reset",
        "Your employee account password has been reset successfully.",
        "employee"
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
      user.userType = "business";
      return user;
    }

    user = await models.Employee.findOne({
      where: { emailVerificationToken: tokenHash },
    });
    if (user) {
      user.userType = "employee";
      return user;
    }

    user = await models.Root.findOne({
      where: { emailVerificationToken: tokenHash },
    });
    if (user) {
      user.userType = "root";
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
      case "employee":
        await models.Employee.update(updateData, { where: { id: user.id } });
        break;

      case "root":
        await models.Root.update(updateData, { where: { id: user.id } });
        break;

      case "business":
        await models.User.update(updateData, { where: { id: user.id } });
        break;
    }
  }

  /**
   * Create login audit log
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
      } catch (error) {
        metadata.location = `${location.latitude}, ${location.longitude}`;
      }
    }

    await AuditService.createLog({
      action,
      entity: "AUTH",
      entityId: user.id,
      performedById: user.id,
      performedByType: user.userType.toUpperCase(),
      description:
        action === "LOGIN_SUCCESS"
          ? "User logged in successfully"
          : "Login attempt failed",
      ipAddress: ip ? String(ip) : null,
      metadata,
    });
  }

  /**
   * Log failed login attempt
   */
  static async logFailedLoginAttempt(userId, reason, req) {
    await AuditService.createLog({
      action: "LOGIN_FAILED",
      entity: "AUTH",
      entityId: userId,
      performedById: userId,
      performedByType: "SYSTEM",
      description: "Login attempt failed",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        reason,
        userAgent: req?.headers?.["user-agent"] || "",
      },
    });
  }

  /**
   * Sanitize user data for response
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
    // Token blacklisting logic can be implemented here
    console.log("Token revoked:", token);
  }
}

export default AuthService;
