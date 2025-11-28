import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";
import { CryptoService } from "../../utils/cryptoService.js";
import PermissionRegistry from "../../utils/permissionRegistry.js";

class EmployeeAuthService {
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
        await Helper.createAuthAuditLog(
          { id: null, userType: "EMPLOYEE" },
          "LOGIN_FAILED",
          req,
          { reason: "USER_NOT_FOUND", emailOrUsername }
        );
        throw ApiError.unauthorized("Invalid credentials");
      }

      // Verify password
      const isValidPassword = await Helper.verifyPassword(
        user.password,
        password
      );
      if (!isValidPassword) {
        await Helper.createAuthAuditLog(
          {
            ...user.toJSON(),
            userType: "EMPLOYEE",
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
      await Helper.checkUserStatus(user);

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

      await Helper.createAuthAuditLog(
        {
          ...user.toJSON(),
          userType: "EMPLOYEE",
        },
        "LOGIN_SUCCESS",
        req
      );

      return {
        user: Helper.sanitizeUserData(user),
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

      await Helper.createAuthAuditLog(
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
      await Helper.createAuthAuditLog(
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
      await Helper.createAuthAuditLog(
        { id: payload.id, userType: "EMPLOYEE" },
        "REFRESH_TOKEN_USER_NOT_FOUND",
        req
      );
      throw ApiError.unauthorized("Invalid refresh token");
    }

    // Get updated permissions
    const permissions =
      await PermissionRegistry.getEmployeeEffectivePermissions(user.id, models);

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

    await Helper.createAuthAuditLog(
      {
        ...user.toJSON(),
        userType: "EMPLOYEE",
      },
      "REFRESH_TOKEN_SUCCESS",
      req
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: Helper.sanitizeUserData(user),
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
      await Helper.createAuthAuditLog(
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

    const { token, tokenHash, expires } = CryptoService.generateSecureToken();

    await models.Employee.update(
      {
        passwordResetToken: tokenHash,
        passwordResetExpires: expires,
      },
      { where: { id: user.id } }
    );

    await Helper.sendPasswordResetEmail(user, token, "employee");

    await Helper.createAuthAuditLog(
      {
        ...user.toJSON(),
        userType: "EMPLOYEE",
      },
      "PASSWORD_RESET_REQUESTED",
      req,
      {
        email,
        department: user.department?.name,
      }
    );

    return {
      message:
        "If an account with that email exists, a password reset link has been sent.",
    };
  }

  static async confirmPasswordReset(encryptedToken, newPassword, req = null) {
    let user;
    try {
      const token = CryptoService.verifySecureToken(encryptedToken);
      const tokenHash = CryptoService.hashData(token);

      user = await models.Employee.findOne({
        where: {
          passwordResetToken: tokenHash,
          passwordResetExpires: { [models.Sequelize.Op.gt]: new Date() },
        },
        include: [
          {
            model: models.Department,
            as: "department",
            required: true,
          },
        ],
      });

      if (!user) {
        await Helper.createAuthAuditLog(
          { id: null, userType: "EMPLOYEE" },
          "PASSWORD_RESET_CONFIRMATION_FAILED",
          req,
          { reason: "INVALID_OR_EXPIRED_TOKEN" }
        );
        throw ApiError.badRequest("Invalid or expired token");
      }

      // Verify this is an employee user (adjust role check as per your system)
      if (!user.role || user.role.name !== "EMPLOYEE") {
        // Adjust role check as per your system
        await Helper.createAuthAuditLog(
          { id: user.id, userType: "EMPLOYEE" },
          "PASSWORD_RESET_CONFIRMATION_FAILED",
          req,
          { reason: "INVALID_USER_TYPE" }
        );
        throw ApiError.forbidden("Invalid user type for password reset");
      }

      const generatedPassword = Helper.generatePassword();

      await Helper.updateEmployeePassword(user.id, generatedPassword);

      // Send credentials email for employee
      await sendCredentialsEmail(
        user,
        generatedPassword,
        null, // transactionPin (not needed for employees)
        "reset",
        `Your employee account password has been reset successfully. Here are your new login credentials.`,
        "EMPLOYEE",
        {
          role: user.role?.name || "Employee",
          permissions: [], // Add permissions if available from your system
        }
      );

      await Helper.createAuthAuditLog(
        {
          ...user.toJSON(),
          userType: "EMPLOYEE",
        },
        "PASSWORD_RESET_CONFIRMED",
        req
      );

      return {
        message:
          "Password reset successfully. You can now login with your new password.",
      };
    } catch (error) {
      console.error("Employee password reset confirmation error:", error);

      await Helper.createAuthAuditLog(
        {
          ...(user?.toJSON() || { userType: "EMPLOYEE" }),
          userType: "EMPLOYEE",
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

  static async updateCredentials({
    currentUserId,
    targetUserId,
    credentialsData,
    currentUserType,
    req,
  }) {
    const { Employee, User } = models;

    // -------------------------------
    // 1. ACCESS CONTROL
    // -------------------------------
    const isOwnUpdate = currentUserId === targetUserId;

    // -------------------------------
    // 2. Fetch Target User and Current Employee
    // -------------------------------
    let targetUser;
    let targetUserType;
    let userModel;
    let currentEmployee = null; // Define currentEmployee at the top

    // Get current employee details first (we'll need this for permission checks)
    if (currentUserType === "EMPLOYEE") {
      currentEmployee = await Employee.findByPk(currentUserId, {
        attributes: ["id", "createdByType", "createdById"],
      });

      if (!currentEmployee) {
        throw ApiError.unauthorized("Employee not found");
      }
    }

    // Employees can only update their own account or BUSINESS users they have permission for
    if (isOwnUpdate) {
      // Employee updating their own account
      const employeeUser = await Employee.findByPk(targetUserId);
      if (employeeUser) {
        targetUser = employeeUser;
        targetUserType = "EMPLOYEE";
        userModel = Employee;
      } else {
        throw ApiError.notFound("Employee not found");
      }
    } else {
      // Employee updating BUSINESS user (with permission)
      const businessUser = await User.findByPk(targetUserId, {
        include: [
          {
            association: "role",
            attributes: ["name"],
          },
        ],
      });

      if (businessUser) {
        targetUser = businessUser;
        targetUserType = "BUSINESS";
        userModel = User;
      } else {
        throw ApiError.notFound("User not found");
      }
    }

    // -------------------------------
    // NEW: CHECK IF EMPLOYEE IS TRYING TO UPDATE ADMIN CREDENTIALS
    // -------------------------------
    if (targetUserType === "BUSINESS" && currentEmployee) {
      // Check if target user is an admin (based on role or other criteria)
      const isTargetAdmin =
        targetUser.role?.name === "ADMIN" ||
        targetUser.role?.name === "SUPER_ADMIN"; // Adjust based on your role names

      if (isTargetAdmin) {
        // If employee was created by admin, restrict access
        if (currentEmployee.createdByType === "ADMIN") {
          await Helper.createAuthAuditLog(
            { id: currentUserId, userType: currentUserType },
            "CREDENTIALS_UPDATE_BLOCKED",
            req,
            {
              reason: "EMPLOYEE_CREATED_BY_ADMIN_CANNOT_UPDATE_ADMIN",
              targetUserType,
              targetUserId,
              currentEmployeeCreator: currentEmployee.createdByType,
              isOwnUpdate,
            }
          );

          throw ApiError.forbidden(
            "Employees created by admin cannot update admin credentials"
          );
        }

        // If employee was created by root, allow access
        if (currentEmployee.createdByType === "ROOT") {
          // Continue with the update process
          console.log(
            "Employee created by root - allowing admin credentials update"
          );
        }
      }
    }

    // -------------------------------
    // 3. Verify current password for own updates
    // -------------------------------
    if (isOwnUpdate) {
      if (!credentialsData.currentPassword) {
        throw ApiError.badRequest("Current password is required");
      }

      const decryptedStoredPassword = CryptoService.decrypt(
        targetUser.password
      );
      if (decryptedStoredPassword !== credentialsData.currentPassword) {
        await Helper.createAuthAuditLog(
          { id: currentUserId, userType: currentUserType },
          "CREDENTIALS_UPDATE_FAILED",
          req,
          {
            reason: "INVALID_CURRENT_PASSWORD",
            targetUserType,
            isOwnUpdate,
          }
        );

        throw ApiError.unauthorized("Current password is incorrect");
      }
    }

    // -------------------------------
    // 4. Prepare update data
    // -------------------------------
    const updateData = {};
    const updatedFields = [];

    if (credentialsData.newPassword) {
      if (credentialsData.newPassword.length < 6) {
        throw ApiError.badRequest(
          "Password must be at least 6 characters long"
        );
      }

      updateData.password = CryptoService.encrypt(credentialsData.newPassword);
      updateData.refreshToken = null;
      updatedFields.push("password");
    }

    // Transaction PIN update (only for BUSINESS users and with permission)
    if (credentialsData.newTransactionPin) {
      if (targetUserType !== "BUSINESS") {
        throw ApiError.badRequest(
          "Transaction PIN is only available for business users"
        );
      }

      if (
        credentialsData.newTransactionPin.length < 4 ||
        credentialsData.newTransactionPin.length > 6
      ) {
        throw ApiError.badRequest("Transaction PIN must be between 4-6 digits");
      }

      // Employees need current PIN to update transaction PIN
      if (!credentialsData.currentTransactionPin) {
        throw ApiError.badRequest("Current transaction PIN is required");
      }

      if (!targetUser.transactionPin) {
        throw ApiError.badRequest("Transaction PIN not set for this user");
      }

      const decryptedPin = CryptoService.decrypt(targetUser.transactionPin);
      if (decryptedPin !== credentialsData.currentTransactionPin) {
        throw ApiError.unauthorized("Current transaction PIN is incorrect");
      }

      updateData.transactionPin = CryptoService.encrypt(
        credentialsData.newTransactionPin
      );
      updatedFields.push("transactionPin");
    }

    if (updatedFields.length === 0) {
      throw ApiError.badRequest("No valid fields to update");
    }

    // -------------------------------
    // 5. Update in Database
    // -------------------------------
    await userModel.update(updateData, {
      where: { id: targetUserId },
    });

    // -------------------------------
    // 6. AUDIT LOG
    // -------------------------------
    await Helper.createAuthAuditLog(
      { id: currentUserId, userType: currentUserType },
      "CREDENTIALS_UPDATED",
      req,
      {
        updatedFields,
        isOwnUpdate,
        requestedBy: currentUserId,
        targetUserId,
        targetUserType,
        currentUserType: "EMPLOYEE",
        performedBy: "EMPLOYEE",
        // Add creator information for audit
        employeeCreatorType: currentEmployee
          ? currentEmployee.createdByType
          : "UNKNOWN",
      }
    );

    return {
      message: "Credentials updated successfully",
      updatedFields,
      targetUserType,
    };
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

    return Helper.sanitizeUserData(employee);
  }

  static async updateProfile(employeeId, updateData, req = null) {
    const employee = await models.Employee.findByPk(employeeId);
    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    const allowedFields = [
      "firstName",
      "lastName",
      "username",
      "phoneNumber",
      "email",
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

    await Helper.createAuthAuditLog(employee, "PROFILE_UPDATED", req, {
      updatedFields: Object.keys(updatePayload),
      previousValues,
    });

    return await this.getProfile(employeeId);
  }

  static async updateProfileImage(employeeId, profileImagePath, req = null) {
    try {
      const { Employee } = models;

      // Verify employee exists
      const employee = await Employee.findByPk(employeeId);
      if (!employee) {
        throw ApiError.notFound("Employee not found");
      }

      let oldImageDeleted = false;
      let profileImageUrl = "";

      // Delete old profile image if exists
      if (employee.profileImage) {
        try {
          await S3Service.delete({ fileUrl: employee.profileImage });
          oldImageDeleted = true;
          console.log("Old employee profile image deleted", { employeeId });
        } catch (error) {
          console.error("Failed to delete old employee profile image", {
            employeeId,
            error: error.message,
          });
        }
      }

      // Upload new profile image
      try {
        profileImageUrl = await S3Service.upload(profileImagePath, "profile");

        if (!profileImageUrl) {
          throw new Error("Failed to upload image to S3");
        }

        console.log("New employee profile image uploaded", { employeeId });
      } catch (uploadError) {
        console.error("Failed to upload employee profile image", {
          employeeId,
          error: uploadError.message,
        });
        throw ApiError.internal("Failed to upload profile image");
      }

      // Update employee record
      try {
        await Employee.update(
          { profileImage: profileImageUrl },
          { where: { id: employeeId } }
        );

        console.log("Employee profile image updated in database", {
          employeeId,
        });
      } catch (updateError) {
        console.error("Failed to update employee profile image in database", {
          employeeId,
          error: updateError.message,
        });

        // Rollback: Delete uploaded image
        try {
          await S3Service.delete({ fileUrl: profileImageUrl });
        } catch (rollbackError) {
          console.error(
            "Failed to rollback employee uploaded image",
            rollbackError
          );
        }

        throw ApiError.internal("Failed to update profile in database");
      }

      // Delete local file
      try {
        await Helper.deleteOldImage(profileImagePath);
      } catch (deleteError) {
        console.error("Failed to delete employee local file", deleteError);
      }

      // Audit log
      if (req) {
        await Helper.createAuthAuditLog(
          { id: employeeId, userType: "EMPLOYEE" },
          "PROFILE_IMAGE_UPDATED",
          req,
          {
            oldImageDeleted,
            userType: "EMPLOYEE",
          }
        );
      }

      // Get updated employee data
      const updatedEmployee = await Employee.findByPk(employeeId, {
        attributes: { exclude: ["password", "refreshToken"] },
        include: [
          {
            association: "department",
            attributes: ["id", "name"],
          },
        ],
      });

      return {
        user: updatedEmployee,
        message: "Employee profile image updated successfully",
      };
    } catch (error) {
      console.error("Error in EmployeeAuthService.updateProfileImage:", {
        employeeId,
        error: error.message,
      });

      // Cleanup local file
      try {
        await Helper.deleteOldImage(profileImagePath);
      } catch (cleanupError) {
        console.error("Failed to cleanup employee local file", cleanupError);
      }

      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal("Failed to update employee profile image");
    }
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

    await Helper.createAuthAuditLog(employee, "DASHBOARD_ACCESSED", req, {
      dashboardType: "EMPLOYEE_DASHBOARD",
    });

    return {
      employeeInfo: employeeData,
      dashboardStats,
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
