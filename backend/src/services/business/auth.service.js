import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";
import { CryptoService } from "../../utils/cryptoService.js";
import BaseAuthService from "../shared/baseAuth.service.js";
import PermissionRegistry from "../../utils/permissionRegistry.js";

class BusinessAuthService extends BaseAuthService {
  static async login(payload, req = null) {
    const { emailOrUsername, password } = payload;

    try {
      // Find admin user (User with All role)
      const user = await models.User.findOne({
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
          {
            model: models.UserPermission,
            as: "userPermissions",
            where: { isActive: true, revokedAt: null },
            required: false,
            attributes: ["permission", "serviceId"],
          },
        ],
      });

      if (!user) {
        await this.createAuthAuditLog(
          { id: null, userType: "BUSINESS" },
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
            userType: "BUSINESS",
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

      // Get effective permissions
      const permissions = await PermissionRegistry.getUserEffectivePermissions(
        user.id,
        models
      );

      // Build token payload
      const tokenPayload = {
        id: user.id,
        email: user.email,
        username: user.username,
        userType: "BUSINESS",
        role: user.role.name,
        roleLevel: user.role.hierarchyLevel,
        permissions: permissions.map((p) => p.permission),
      };

      // Generate tokens
      const accessToken = Helper.generateAccessToken(tokenPayload);
      const refreshToken = Helper.generateRefreshToken(tokenPayload);

      // Update refresh token
      await models.User.update(
        { refreshToken, lastLoginAt: new Date() },
        { where: { id: user.id } }
      );

      await this.createAuthAuditLog(user, "LOGIN_SUCCESS", req);

      return {
        user: this.sanitizeUserData(user),
        accessToken,
        refreshToken,
        userType: "business",
        permissions: tokenPayload.permissions,
      };
    } catch (error) {
      console.error("Admin login error:", error);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Login failed");
    }
  }

  static async logout(userId, refreshToken = null, req = null) {
    try {
      await models.User.update(
        { refreshToken: null },
        { where: { id: userId } }
      );

      await this.createAuthAuditLog(
        { id: userId, userType: "BUSINESS" },
        "LOGOUT",
        req,
        { hasRefreshToken: !!refreshToken }
      );

      return { message: "Logged out successfully" };
    } catch (error) {
      console.error("Admin logout error:", error);
      throw ApiError.internal("Logout failed");
    }
  }

  static async refreshToken(refreshToken, req = null) {
    let payload;

    try {
      payload = Helper.verifyRefreshToken(refreshToken);
    } catch (error) {
      await this.createAuthAuditLog(
        { id: payload?.id, userType: "BUSINESS" },
        "REFRESH_TOKEN_INVALID",
        req,
        { error: error.message }
      );
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await models.User.findOne({
      where: { id: payload.id, refreshToken },
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
        { id: payload.id, userType: "BUSINESS" },
        "REFRESH_TOKEN_USER_NOT_FOUND",
        req
      );
      throw ApiError.unauthorized("Invalid refresh token");
    }

    // Get updated permissions
    const permissions = await PermissionRegistry.getUserEffectivePermissions(
      user.id,
      models
    );

    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      userType: "BUSINESS",
      role: user.role.name,
      roleLevel: user.role.hierarchyLevel,
      permissions: permissions.map((p) => p.permission),
    };

    const newAccessToken = Helper.generateAccessToken(tokenPayload);
    const newRefreshToken = Helper.generateRefreshToken(tokenPayload);

    await models.User.update(
      { refreshToken: newRefreshToken },
      { where: { id: user.id } }
    );

    await this.createAuthAuditLog(user, "REFRESH_TOKEN_SUCCESS", req);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUserData(user),
      permissions: tokenPayload.permissions,
    };
  }

  static async requestPasswordReset(email, req = null) {
    const user = await models.User.findOne({
      where: { email },
      include: [
        {
          model: models.Role,
          as: "role",
          required: true,
        },
      ],
    });

    if (!user) {
      // Don't reveal whether user exists for security
      await this.createAuthAuditLog(
        { id: null, userType: "BUSINESS" },
        "PASSWORD_RESET_REQUEST_FAILED",
        req,
        { reason: "USER_NOT_FOUND", email }
      );

      return {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      };
    }

    const { token, tokenHash, expires } = this.generatePasswordResetToken();

    await models.User.update(
      {
        passwordResetToken: tokenHash,
        passwordResetExpires: expires,
      },
      { where: { id: user.id } }
    );

    await this.sendPasswordResetEmail(user, token, "admin");

    await this.createAuthAuditLog(user, "PASSWORD_RESET_REQUESTED", req, {
      email,
    });

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  static async confirmPasswordReset(encryptedToken, newPassword, req = null) {
    try {
      const token = CryptoService.decrypt(encryptedToken);
      const tokenHash = CryptoService.hashData(token);

      const user = await this.validatePasswordResetToken(
        tokenHash,
        models.User
      );
      if (!user) {
        await this.createAuthAuditLog(
          { id: null, userType: "BUSINESS" },
          "PASSWORD_RESET_CONFIRMATION_FAILED",
          req,
          { reason: "INVALID_OR_EXPIRED_TOKEN" }
        );
        throw ApiError.badRequest("Invalid or expired token");
      }

      // Verify this is an admin user
      const adminUser = await models.User.findByPk(user.id, {
        include: [
          {
            model: models.Role,
            as: "role",
            required: true,
          },
        ],
      });

      if (!adminUser) {
        throw ApiError.forbidden("Invalid user type");
      }

      await this.updateUserPassword(user.id, newPassword, models.User);

      await this.createAuthAuditLog(user, "PASSWORD_RESET_CONFIRMED", req);

      return {
        message:
          "Password reset successfully. You can now login with your new password.",
      };
    } catch (error) {
      console.error("Admin password reset confirmation error:", error);

      await this.createAuthAuditLog(
        { id: null, userType: "BUSINESS" },
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

  static async updateCredentials(adminId, credentialsData, req = null) {
    const admin = await models.User.findByPk(adminId, {
      include: [
        {
          model: models.Role,
          as: "role",
          required: true,
        },
      ],
    });

    if (!admin) {
      throw ApiError.notFound("Admin user not found");
    }

    // Verify current password
    const isValidPassword = await this.verifyPassword(
      admin.password,
      credentialsData.currentPassword
    );

    if (!isValidPassword) {
      await this.createAuthAuditLog(admin, "CREDENTIALS_UPDATE_FAILED", req, {
        reason: "INVALID_CURRENT_PASSWORD",
      });
      throw ApiError.unauthorized("Current password is incorrect");
    }

    const updateData = {
      password: CryptoService.encrypt(credentialsData.newPassword),
      refreshToken: null, // Invalidate all sessions
    };

    // Handle transaction pin update if provided
    if (credentialsData.newTransactionPin) {
      if (!credentialsData.currentTransactionPin) {
        throw ApiError.badRequest("Current transaction PIN is required");
      }

      const isValidPin = await this.verifyTransactionPin(
        admin.transactionPin,
        credentialsData.currentTransactionPin
      );

      if (!isValidPin) {
        await this.createAuthAuditLog(admin, "CREDENTIALS_UPDATE_FAILED", req, {
          reason: "INVALID_CURRENT_TRANSACTION_PIN",
        });
        throw ApiError.unauthorized("Current transaction PIN is incorrect");
      }

      updateData.transactionPin = CryptoService.encrypt(
        credentialsData.newTransactionPin
      );
    }

    await models.User.update(updateData, { where: { id: adminId } });

    const updatedFields = ["password"];
    if (credentialsData.newTransactionPin) {
      updatedFields.push("transactionPin");
    }

    await this.createAuthAuditLog(admin, "CREDENTIALS_UPDATED", req, {
      updatedFields,
    });

    return { message: "Credentials updated successfully" };
  }

  static async getProfile(adminId) {
    const user = await models.User.findByPk(adminId, {
      include: [
        {
          model: models.Role,
          as: "role",
          required: true,
        },
        {
          model: models.UserPermission,
          as: "userPermissions",
          where: { isActive: true, revokedAt: null },
          required: false,
          attributes: ["permission", "serviceId", "createdAt"],
        },
      ],
      attributes: {
        exclude: [
          "password",
          "refreshToken",
          "transactionPin",
          "passwordResetToken",
        ],
      },
    });

    if (!user) {
      throw ApiError.notFound("user not found");
    }

    return this.sanitizeUserData(user);
  }

  static async getAdminDashboard(adminUser, req = null) {
    if (!adminUser || adminUser.role !== "ADMIN") {
      throw ApiError.forbidden("Admin access required");
    }

    const [totalUsers, totalEmployees, pendingKyc, activeSessions] =
      await Promise.all([
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
        models.UserKyc.count({ where: { status: "PENDING" } }),
        models.User.count({
          where: { refreshToken: { [models.Sequelize.Op.ne]: null } },
        }),
      ]);

    const dashboardStats = {
      totalUsers,
      totalEmployees,
      pendingKyc,
      activeSessions,
      totalRevenue: await this.getTotalRevenue(),
    };

    await this.createAuthAuditLog(adminUser, "DASHBOARD_ACCESSED", req, {
      dashboardType: "ADMIN_DASHBOARD",
    });

    return {
      dashboardStats,
      quickActions: [
        {
          action: "manage_users",
          label: "Manage Users",
          description: "Manage system users",
        },
        {
          action: "manage_employees",
          label: "Manage Employees",
          description: "Manage employee accounts",
        },
        {
          action: "view_reports",
          label: "View Reports",
          description: "View system reports and analytics",
        },
      ],
    };
  }

  static async getTotalRevenue() {
    const result = await models.Wallet.sum("balance");
    return result || 0;
  }
}

export default BusinessAuthService;
