import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";
import { CryptoService } from "../../utils/cryptoService.js";
import BaseAuthService from "../shared/baseAuth.service.js";
import PermissionRegistry from "../../utils/permissionRegistry.js";

class EmployeeAuthService extends BaseAuthService {
  static async login(payload, req = null) {
    const { emailOrUsername, password } = payload;

    try {
      // Find employee user
      const user = await models.Employee.findOne({
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
            where: { isActive: true, revokedAt: null },
            required: false,
            attributes: ["permission"],
          },
        ],
      });

      if (!user) {
        await this.createAuthAuditLog(
          { id: null, userType: "EMPLOYEE" },
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

      // Get permissions
      const permissions =
        user.employeePermissions?.map((ep) => ep.permission) || [];

      // Build token payload
      const tokenPayload = {
        id: user.id,
        email: user.email,
        username: user.username,
        userType: "EMPLOYEE",
        role: user.department?.name || "EMPLOYEE",
        roleLevel: user.hierarchyLevel,
        department: user.department?.name,
        departmentId: user.department?.id,
        permissions,
      };

      // Generate tokens
      const accessToken = Helper.generateAccessToken(tokenPayload);
      const refreshToken = Helper.generateRefreshToken(tokenPayload);

      // Update refresh token
      await models.Employee.update(
        { refreshToken, lastLoginAt: new Date() },
        { where: { id: user.id } }
      );

      await this.createAuthAuditLog(user, "LOGIN_SUCCESS", req);

      return {
        user: this.sanitizeUserData(user),
        accessToken,
        refreshToken,
        userType: "employee",
        permissions,
      };
    } catch (error) {
      console.error("Employee login error:", error);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Login failed");
    }
  }

  static async logout(userId, refreshToken = null, req = null) {
    try {
      await models.Employee.update(
        { refreshToken: null },
        { where: { id: userId } }
      );

      await this.createAuthAuditLog(
        { id: userId, userType: "EMPLOYEE" },
        "LOGOUT",
        req,
        { hasRefreshToken: !!refreshToken }
      );

      return { message: "Logged out successfully" };
    } catch (error) {
      console.error("Employee logout error:", error);
      throw ApiError.internal("Logout failed");
    }
  }

  static async refreshToken(refreshToken, req = null) {
    let payload;

    try {
      payload = Helper.verifyRefreshToken(refreshToken);
    } catch (error) {
      await this.createAuthAuditLog(
        { id: payload?.id, userType: "EMPLOYEE" },
        "REFRESH_TOKEN_INVALID",
        req,
        { error: error.message }
      );
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await models.Employee.findOne({
      where: { id: payload.id, refreshToken },
      include: [
        {
          model: models.Department,
          as: "department",
          attributes: ["id", "name", "description"],
        },
      ],
    });

    if (!user) {
      await this.createAuthAuditLog(
        { id: payload.id, userType: "EMPLOYEE" },
        "REFRESH_TOKEN_USER_NOT_FOUND",
        req
      );
      throw ApiError.unauthorized("Invalid refresh token");
    }

    // Get updated permissions
    const permissions = await PermissionRegistry.validateEmployeePermission(
      user.id,
      models
    );

    const tokenPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      userType: "EMPLOYEE",
      role: user.department?.name || "EMPLOYEE",
      roleLevel: user.hierarchyLevel,
      department: user.department?.name,
      departmentId: user.department?.id,
      permissions,
    };

    const newAccessToken = Helper.generateAccessToken(tokenPayload);
    const newRefreshToken = Helper.generateRefreshToken(tokenPayload);

    await models.Employee.update(
      { refreshToken: newRefreshToken },
      { where: { id: user.id } }
    );

    await this.createAuthAuditLog(user, "REFRESH_TOKEN_SUCCESS", req);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUserData(user),
      permissions,
    };
  }

  static async requestPasswordReset(email, req = null) {
    const user = await models.Employee.findOne({
      where: { email },
      include: [
        {
          model: models.Department,
          as: "department",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!user) {
      // Don't reveal whether user exists for security
      await this.createAuthAuditLog(
        { id: null, userType: "EMPLOYEE" },
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

    await models.Employee.update(
      {
        passwordResetToken: tokenHash,
        passwordResetExpires: expires,
      },
      { where: { id: user.id } }
    );

    await this.sendPasswordResetEmail(user, token, "employee");

    await this.createAuthAuditLog(user, "PASSWORD_RESET_REQUESTED", req, {
      email,
      department: user.department?.name,
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
        models.Employee
      );
      if (!user) {
        await this.createAuthAuditLog(
          { id: null, userType: "EMPLOYEE" },
          "PASSWORD_RESET_CONFIRMATION_FAILED",
          req,
          { reason: "INVALID_OR_EXPIRED_TOKEN" }
        );
        throw ApiError.badRequest("Invalid or expired token");
      }

      await this.updateUserPassword(user.id, newPassword, models.Employee);

      await this.createAuthAuditLog(user, "PASSWORD_RESET_CONFIRMED", req);

      return {
        message:
          "Password reset successfully. You can now login with your new password.",
      };
    } catch (error) {
      console.error("Employee password reset confirmation error:", error);

      await this.createAuthAuditLog(
        { id: null, userType: "EMPLOYEE" },
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

  static async updateCredentials(employeeId, credentialsData, req = null) {
    const employee = await models.Employee.findByPk(employeeId);
    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    // Verify current password
    const isValidPassword = await this.verifyPassword(
      employee.password,
      credentialsData.currentPassword
    );

    if (!isValidPassword) {
      await this.createAuthAuditLog(
        employee,
        "CREDENTIALS_UPDATE_FAILED",
        req,
        { reason: "INVALID_CURRENT_PASSWORD" }
      );
      throw ApiError.unauthorized("Current password is incorrect");
    }

    const updateData = {
      password: CryptoService.encrypt(credentialsData.newPassword),
      refreshToken: null, // Invalidate all sessions
    };

    await models.Employee.update(updateData, { where: { id: employeeId } });

    await this.createAuthAuditLog(employee, "CREDENTIALS_UPDATED", req, {
      updatedFields: ["password"],
    });

    return { message: "Credentials updated successfully" };
  }

  static async getProfile(employeeId) {
    const employee = await models.Employee.findByPk(employeeId, {
      include: [
        {
          model: models.Department,
          as: "department",
          attributes: ["id", "name", "description"],
        },
        {
          model: models.EmployeePermission,
          as: "employeePermissions",
          where: { isActive: true, revokedAt: null },
          required: false,
          attributes: ["permission", "createdAt"],
        },
      ],
      attributes: {
        exclude: ["password", "refreshToken", "passwordResetToken"],
      },
    });

    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    return this.sanitizeUserData(employee);
  }

  static async updateProfile(employeeId, updateData, req = null) {
    const employee = await models.Employee.findByPk(employeeId);
    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    const allowedFields = [
      "firstName",
      "lastName",
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
      previousValues[key] = employee[key];
    });

    await models.Employee.update(updatePayload, { where: { id: employeeId } });

    await this.createAuthAuditLog(employee, "PROFILE_UPDATED", req, {
      updatedFields: Object.keys(updatePayload),
      previousValues,
    });

    return await this.getProfile(employeeId);
  }

  static async getEmployeeDashboard(employee, req = null) {
    if (!employee || employee.userType !== "EMPLOYEE") {
      throw ApiError.forbidden("Employee access required");
    }

    const employeeData = await this.getProfile(employee.id);

    const dashboardStats = {
      permissionsCount: employeeData.employeePermissions?.length || 0,
      department: employeeData.department?.name,
    };

    await this.createAuthAuditLog(employee, "DASHBOARD_ACCESSED", req, {
      dashboardType: "EMPLOYEE_DASHBOARD",
    });

    return {
      employeeInfo: employeeData,
      dashboardStats,
      quickActions: [
        {
          action: "view_profile",
          label: "View Profile",
          description: "View your profile information",
        },
        {
          action: "update_profile",
          label: "Update Profile",
          description: "Update your personal information",
        },
      ],
    };
  }

  static async checkCreatorAccess(employee, targetUser) {
    if (employee.createdByType === "ROOT") {
      const root = await models.Root.findByPk(employee.createdById);
      return root && root.status === "ACTIVE";
    }

    if (employee.createdByType === "ADMIN") {
      const admin = await models.User.findByPk(employee.createdById, {
        include: [{ association: "role" }],
      });
      return admin && admin.role.name === "ADMIN" && admin.status === "ACTIVE";
    }

    return false;
  }
}

export default EmployeeAuthService;
