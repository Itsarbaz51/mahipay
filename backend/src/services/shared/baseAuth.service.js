import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { CryptoService } from "../../utils/cryptoService.js";
import AuditService from "../audit.service.js";

class BaseAuthService {
  static async verifyPassword(encryptedPassword, plainPassword) {
    try {
      if (!encryptedPassword || !plainPassword) {
        return false;
      }
      const decryptedPassword = CryptoService.decrypt(encryptedPassword);
      return decryptedPassword === plainPassword;
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  }

  static async verifyTransactionPin(encryptedPin, plainPin) {
    try {
      if (!encryptedPin || !plainPin) {
        return false;
      }
      const decryptedPin = CryptoService.decrypt(encryptedPin);
      return decryptedPin === plainPin;
    } catch (error) {
      console.error("Transaction pin verification error:", error);
      return false;
    }
  }

  static async checkUserStatus(user) {
    switch (user.status) {
      case "DELETED":
        throw ApiError.unauthorized("Account has been deleted");
      case "SUSPENDED":
        throw ApiError.unauthorized("Account is suspended");
      case "INACTIVE":
        throw ApiError.unauthorized("Account is inactive");
      case "ACTIVE":
        return true;
      default:
        throw ApiError.unauthorized("Account status is invalid");
    }
  }

  static sanitizeUserData(user) {
    if (!user) return null;

    const userJson = user.toJSON ? user.toJSON() : user;
    const {
      password,
      refreshToken,
      transactionPin,
      passwordResetToken,
      passwordResetExpires,
      ...safeData
    } = userJson;

    return safeData;
  }

  static async createAuthAuditLog(user, action, req, metadata = {}) {
    const ip = req ? this.getClientIP(req) : null;

    const isFailed = !user;

    const logData = {
      action,
      entity: "AUTH",
      entityId: user?.id || null,
      performedById: user?.id ? String(user.id) : null,
      performedByType: user?.userType?.toUpperCase() || null,
      description: this.getAuthActionDescription(action, user),
      ipAddress: ip,
      userAgent: req?.headers?.["user-agent"] || "",
      metadata: {
        userType: user?.userType || null,
        userAgent: req?.headers?.["user-agent"] || "",
        loginStatus: isFailed ? "FAILED" : "SUCCESS",
        ...metadata,
      },
    };

    try {
      await AuditService.createLog(logData);
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  static getAuthActionDescription(action, user) {
    const descriptions = {
      LOGIN_SUCCESS: `${user.userType} logged in successfully`,
      LOGIN_FAILED: `${user.userType} login attempt failed`,
      LOGOUT: `${user.userType} logged out`,
      REFRESH_TOKEN_SUCCESS: `${user.userType} token refreshed`,
      PASSWORD_RESET_REQUESTED: `${user.userType} password reset requested`,
      PASSWORD_RESET_CONFIRMED: `${user.userType} password reset confirmed`,
      CREDENTIALS_UPDATED: `${user.userType} credentials updated`,
    };

    return descriptions[action] || `${user.userType} performed ${action}`;
  }

  static getClientIP(req) {
    if (!req) return null;

    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      null
    );
  }

  static generatePasswordResetToken() {
    const token = CryptoService.generateSecureToken(32);
    const tokenHash = CryptoService.hashData(token);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    return { token, tokenHash, expires };
  }

  static async sendPasswordResetEmail(user, token, userType) {
    const encryptedToken = CryptoService.encrypt(token);
    const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${encodeURIComponent(encryptedToken)}&type=${userType}`;

    // Implementation depends on your email service
    console.log(`Password reset email sent to ${user.email}: ${resetUrl}`);

    // In a real implementation, you would use your email service here
    // await EmailService.sendPasswordReset(user.email, resetUrl, userType);
  }

  static async validatePasswordResetToken(tokenHash, model) {
    const user = await model.findOne({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: { [models.Sequelize.Op.gt]: new Date() },
      },
    });

    return user;
  }

  static async updateUserPassword(userId, newPassword, model) {
    const encryptedPassword = CryptoService.encrypt(newPassword);

    await model.update(
      {
        password: encryptedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshToken: null, // Invalidate all sessions
      },
      { where: { id: userId } }
    );
  }
}

export default BaseAuthService;
