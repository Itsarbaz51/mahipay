import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";
import { CryptoService } from "../../utils/cryptoService.js";
import BaseAuthService from "../shared/baseAuth.service.js";

class RootAuthService extends BaseAuthService {
  static async login(payload, req = null) {
    const { emailOrUsername, password } = payload;

    try {
      // Find root user
      const user = await models.Root.findOne({
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
            required: true,
          },
        ],
      });

      if (!user) {
        await this.createAuthAuditLog(
          {
            id: null,
            userType: "ROOT",
          },
          "LOGIN_FAILED",
          req,
          { reason: "USER_NOT_FOUND", emailOrUsername }
        );
        throw ApiError.unauthorized("Invalid credentials");
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(
        user.password,
        password
      );

      if (!isValidPassword) {
        await this.createAuthAuditLog(
          {
            ...user.toJSON(),
            userType: "ROOT",
          },
          "LOGIN_FAILED",
          req,
          {
            reason: "INVALID_PASSWORD",
          }
        );

        throw ApiError.unauthorized("Invalid credentials");
      }

      // Check user status
      await this.checkUserStatus(user);

      // Build token payload
      const tokenPayload = {
        id: user.id,
        email: user.email,
        username: user.username,
        userType: "ROOT",
        role: "ROOT",
        roleLevel: 0,
      };

      // Generate tokens
      const accessToken = Helper.generateAccessToken(tokenPayload);
      const refreshToken = Helper.generateRefreshToken(tokenPayload);

      // Update refresh token
      await models.Root.update(
        { refreshToken, lastLoginAt: new Date() },
        { where: { id: user.id } }
      );

      await this.createAuthAuditLog(
        { ...user.toJSON(), userType: "ROOT" },
        "LOGIN_SUCCESS",
        req
      );
      return {
        user: this.sanitizeUserData(user),
        accessToken,
        refreshToken,
        userType: "root",
      };
    } catch (error) {
      console.error("Root login error:", error);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Login failed");
    }
  }

  static async logout(userId, refreshToken = null, req = null) {
    try {
      await models.Root.update(
        { refreshToken: null },
        { where: { id: userId } }
      );

      await this.createAuthAuditLog(
        { id: userId, userType: "ROOT" },
        "LOGOUT",
        req,
        { hasRefreshToken: !!refreshToken }
      );

      return { message: "Logged out successfully" };
    } catch (error) {
      console.error("Root logout error:", error);
      throw ApiError.internal("Logout failed");
    }
  }

  static async refreshToken(refreshToken, req = null) {
    let payload;

    try {
      payload = Helper.verifyRefreshToken(refreshToken);
    } catch (error) {
      await this.createAuthAuditLog(
        { id: payload?.id, userType: "ROOT" },
        "REFRESH_TOKEN_INVALID",
        req,
        { error: error.message }
      );
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await models.Root.findOne({
      where: { id: payload.id, refreshToken },
    });

    if (!user) {
      await this.createAuthAuditLog(
        { id: payload.id, userType: "ROOT" },
        "REFRESH_TOKEN_USER_NOT_FOUND",
        req
      );
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      userType: "ROOT",
      role: "ROOT",
      roleLevel: 0,
    };

    const newAccessToken = Helper.generateAccessToken(tokenPayload);
    const newRefreshToken = Helper.generateRefreshToken(tokenPayload);

    await models.Root.update(
      { refreshToken: newRefreshToken },
      { where: { id: user.id } }
    );

    await this.createAuthAuditLog(user, "REFRESH_TOKEN_SUCCESS", req);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUserData(user),
    };
  }

  static async requestPasswordReset(email, req = null) {
    const user = await models.Root.findOne({
      where: { email },
    });

    if (!user) {
      await this.createAuthAuditLog(
        {
          id: null,
          userType: "ROOT",
        },
        "PASSWORD_RESET_REQUEST_FAILED",
        req,
        { reason: "USER_NOT_FOUND", email }
      );

      return {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    }

    const { token, tokenHash, expires } = CryptoService.generateSecureToken();

    await models.Root.update(
      {
        passwordResetToken: tokenHash,
        passwordResetExpires: expires,
      },
      { where: { id: user.id } }
    );

    await this.sendPasswordResetEmail(user, token, "root");

    await this.createAuthAuditLog(
      {
        ...user.toJSON(),
        userType: "ROOT",
      },
      "PASSWORD_RESET_REQUESTED",
      req,
      {
        email,
      }
    );

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  static async confirmPasswordReset(encryptedToken, newPassword, req = null) {
    try {
      const token = CryptoService.verifySecureToken(encryptedToken);
      const tokenHash = CryptoService.hashData(token);

      const user = await this.validatePasswordResetToken(
        tokenHash,
        models.Root
      );
      if (!user) {
        await this.createAuthAuditLog(
          { id: null, userType: "ROOT" },
          "PASSWORD_RESET_CONFIRMATION_FAILED",
          req,
          { reason: "INVALID_OR_EXPIRED_TOKEN" }
        );
        throw ApiError.badRequest("Invalid or expired token");
      }

      await this.updateUserPassword(user.id, newPassword, models.Root);

      await this.createAuthAuditLog(user, "PASSWORD_RESET_CONFIRMED", req);

      return {
        message:
          "Password reset successfully. You can now login with your new password.",
      };
    } catch (error) {
      console.error("Root password reset confirmation error:", error);

      await this.createAuthAuditLog(
        {
          ...user.toJSON(),
          userType: "ROOT",
        },
        "PASSWORD_RESET_CONFIRMATION_ERROR",
        req,
        {
          error: error.message,
          reason: error.message.includes("Decryption failed")
            ? "MALFORMED_TOKEN"
            : "UNKNOWN_ERROR",
        }
      );

      if (error.message.includes("Decryption failed")) {
        throw ApiError.badRequest("Invalid or malformed token");
      }
      throw error;
    }
  }

  static async updateCredentials(rootId, credentialsData, req = null) {
    const root = await models.Root.findByPk(rootId);
    if (!root) {
      throw ApiError.notFound("Root user not found");
    }

    // Verify current password
    const isValidPassword = await this.verifyPassword(
      root.password,
      credentialsData.currentPassword
    );

    if (!isValidPassword) {
      await this.createAuthAuditLog(root, "CREDENTIALS_UPDATE_FAILED", req, {
        reason: "INVALID_CURRENT_PASSWORD",
      });
      throw ApiError.unauthorized("Current password is incorrect");
    }

    const updateData = {
      password: CryptoService.encrypt(credentialsData.newPassword),
      refreshToken: null, // Invalidate all sessions
    };

    await models.Root.update(updateData, { where: { id: rootId } });

    await this.createAuthAuditLog(root, "CREDENTIALS_UPDATED", req, {
      updatedFields: ["password"],
    });

    return { message: "Credentials updated successfully" };
  }

  static async getProfile(rootId) {
    const user = await models.Root.findByPk(rootId, {
      attributes: {
        exclude: ["password", "refreshToken", "passwordResetToken"],
      },
      include: [
        {
          model: models.Role,
          as: "role",
        },
      ],
    });

    if (!user) {
      throw ApiError.notFound("Root user not found");
    }

    return this.sanitizeUserData(user);
  }

  static async updateProfile(rootId, updateData, req = null) {
    const user = await models.Root.findByPk(rootId);
    if (!user) {
      throw ApiError.notFound("Root user not found");
    }

    const allowedFields = [
      "firstName",
      "lastName",
      "username",
      "phoneNumber",
      "profileImage",
    ];

    const updatePayload = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        updatePayload[key] = updateData[key];
      }
    });

    if (Object.keys(updatePayload).length === 0) {
      throw ApiError.badRequest("No valid fields to update");
    }

    const previousValues = {};
    Object.keys(updatePayload).forEach((key) => {
      previousValues[key] = user[key];
    });

    await models.Root.update(updatePayload, { where: { id: rootId } });

    await this.createAuthAuditLog(user, "PROFILE_UPDATED", req, {
      updatedFields: Object.keys(updatePayload),
      previousValues,
    });

    return await this.getProfile(rootId);
  }

  static async getRootDashboard(rootUser, req = null) {
    if (!rootUser || rootUser.userType !== "ROOT") {
      throw ApiError.forbidden("Root access required");
    }

    const [
      totalAdmins,
      totalBusinessUsers,
      totalEmployees,
      totalRootUsers,
      pendingKyc,
    ] = await Promise.all([
      models.User.count({
        include: [
          {
            model: models.Role,
            as: "role",
            where: { name: "ADMIN" },
          },
        ],
      }),
      models.User.count({
        include: [
          {
            model: models.Role,
            as: "role",
            where: { name: { [models.Sequelize.Op.ne]: "ADMIN" } },
          },
        ],
      }),
      models.Employee.count(),
      models.Root.count(),
      models.UserKyc.count({ where: { status: "PENDING" } }),
    ]);

    const systemStats = {
      totalAdmins,
      totalBusinessUsers,
      totalEmployees,
      totalRootUsers,
      pendingKyc,
      systemRevenue: await this.getSystemRevenue(),
    };

    const recentActivities = await this.getRecentSystemActivities();

    await this.createAuthAuditLog(rootUser, "DASHBOARD_ACCESSED", req, {
      dashboardType: "ROOT_DASHBOARD",
    });

    return {
      systemStats,
      recentActivities: recentActivities.slice(0, 10),
      quickActions: [
        {
          action: "create_root",
          label: "Create Root User",
          description: "Create new root user account",
        },
        {
          action: "system_analytics",
          label: "View Analytics",
          description: "View system-wide analytics",
        },
        {
          action: "audit_logs",
          label: "Audit Logs",
          description: "View comprehensive audit logs",
        },
      ],
    };
  }

  static async getSystemRevenue() {
    const result = await models.Wallet.sum("balance");
    return result || 0;
  }

  static async getRecentSystemActivities() {
    // This would typically query your audit logs
    return [];
  }
}

export default RootAuthService;
