import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";
import { CryptoService } from "../../utils/cryptoService.js";
import PermissionRegistry from "../../utils/permissionRegistry.js";
import HierarchyService from "../../utils/HierarchyService.js";

class BusinessAuthService {
  static async login(payload, req = null) {
    const { emailOrUsername, password } = payload;

    try {
      // Find business user with all necessary associations
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
            attributes: ["id", "name", "hierarchyLevel"],
          },
          {
            model: models.UserPermission,
            as: "userPermissions",
            where: { isActive: true, revokedAt: null },
            required: false,
            attributes: ["permission", "serviceId"],
          },
          // Include creator information for IP whitelist check
          {
            model: models.Root,
            as: "creatorRoot",
            required: false,
            attributes: ["id"],
          },
          {
            model: models.User,
            as: "creatorUser",
            required: false,
            attributes: ["id", "username", "email"],
            include: [
              {
                model: models.Role,
                as: "role",
                attributes: ["name", "hierarchyLevel"],
              },
            ],
          },
        ],
      });

      if (!user) {
        await Helper.createAuthAuditLog(
          { id: null, userType: "BUSINESS" },
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
      await Helper.checkUserStatus(user);

      // SECURITY: IP & ORIGIN WHITELIST VALIDATION
      const clientOrigin = req?.get("Origin");
      const clientIp = req ? await Helper.getClientIP(req) : "";

      // Determine creator hierarchy for whitelist validation
      const { creatorId, creatorType } =
        await Helper.determineWhitelistSource(user);

      // Get relevant whitelist entries for domain validation
      const whitelistEntries = await Helper.getRelevantWhitelistEntries(
        creatorId,
        creatorType,
        user.id
      );

      // Validate origin against whitelist domains
      if (!(await Helper.isValidOrigin(clientOrigin, whitelistEntries))) {
        await Helper.createAuthAuditLog(
          { ...user.toJSON(), userType: "BUSINESS" },
          "LOGIN_FAILED",
          req,
          {
            reason: "ORIGIN_NOT_WHITELISTED",
            clientOrigin,
            allowedDomains: whitelistEntries
              .map((e) => e.domainName)
              .filter(Boolean),
            creatorType,
            creatorId,
          }
        );
        throw ApiError.forbidden("Access denied: Origin not whitelisted");
      }

      // Validate IP against whitelist
      if (!(await Helper.isValidIp(clientIp, whitelistEntries))) {
        await Helper.createAuthAuditLog(
          { ...user.toJSON(), userType: "BUSINESS" },
          "LOGIN_FAILED",
          req,
          {
            reason: "IP_NOT_WHITELISTED",
            clientIp,
            allowedIps: whitelistEntries
              .flatMap((e) => [e.serverIp, e.localIp])
              .filter(Boolean),
            creatorType,
            creatorId,
          }
        );
        throw ApiError.forbidden("Access denied: IP address not whitelisted");
      }

      // Get effective permissions
      const permissions = await PermissionRegistry.getUserEffectivePermissions(
        user.id,
        models
      );

      // Build secure token payload
      const tokenPayload = {
        id: user.id,
        email: user.email,
        username: user.username,
        userType: "BUSINESS",
        role: user.role.name,
        roleLevel: user.role.hierarchyLevel,
        permissions: permissions.map((p) => p.permission),
        creatorType: creatorType?.toLowerCase(),
        creatorId,
        loginOrigin: clientOrigin,
        loginIp: clientIp,
        iss: clientOrigin,
        aud: "business-panel",
      };

      // Generate tokens with secure settings
      const accessToken = Helper.generateAccessToken(tokenPayload);
      const refreshToken = Helper.generateRefreshToken(tokenPayload);

      // Update user login info
      await models.User.update(
        {
          refreshToken,
          lastLoginAt: new Date(),
          lastLoginIp: clientIp,
          lastLoginOrigin: clientOrigin,
        },
        { where: { id: user.id } }
      );

      // Log successful login with security context
      await Helper.createAuthAuditLog(
        {
          ...user.toJSON(),
          userType: "BUSINESS",
        },
        "LOGIN_SUCCESS",
        req,
        {
          origin: clientOrigin,
          ip: clientIp,
          creatorType,
          creatorId,
          hasWhitelist: whitelistEntries.length > 0,
          role: user.role.name,
        }
      );

      return {
        user: Helper.sanitizeUserData(user),
        accessToken,
        refreshToken,
        userType: "business",
        permissions: tokenPayload.permissions,
        securityContext: {
          origin: clientOrigin,
          creatorType: creatorType?.toLowerCase(),
          requiresWhitelist: whitelistEntries.length > 0,
        },
      };
    } catch (error) {
      console.error("Business login error:", error);
      if (error instanceof ApiError) throw error;

      // Don't leak internal errors to client
      await Helper.createAuthAuditLog(
        { id: null, userType: "BUSINESS" },
        "LOGIN_FAILED",
        req,
        { reason: "SYSTEM_ERROR", emailOrUsername }
      );
      throw ApiError.internal("Login failed");
    }
  }

  static async logout(userId, refreshToken = null, req = null) {
    try {
      await models.User.update(
        { refreshToken: null },
        { where: { id: userId } }
      );

      await Helper.createAuthAuditLog(
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
      await Helper.createAuthAuditLog(
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
      await Helper.createAuthAuditLog(
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

    await Helper.createAuthAuditLog(
      {
        ...user.toJSON(),
        userType: "BUSINESS",
      },
      "REFRESH_TOKEN_SUCCESS",
      req
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: Helper.sanitizeUserData(user),
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
      await Helper.createAuthAuditLog(
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

    const { token, tokenHash, expires } = CryptoService.generateSecureToken();

    await models.User.update(
      {
        passwordResetToken: tokenHash,
        passwordResetExpires: expires,
      },
      { where: { id: user.id } }
    );

    await Helper.sendPasswordResetEmail(user, token, "admin");

    await Helper.createAuthAuditLog(
      {
        ...user.toJSON(),
        userType: "BUSINESS",
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

  static async confirmPasswordReset(encryptedToken, req = null) {
    let user;
    try {
      const token = CryptoService.verifySecureToken(encryptedToken);
      const tokenHash = CryptoService.hashData(token);

      user = await models.User.findOne({
        where: {
          passwordResetToken: tokenHash,
          passwordResetExpires: { [models.Sequelize.Op.gt]: new Date() },
        },
        include: [
          {
            model: models.Role,
            as: "role",
            required: false,
          },
        ],
      });

      if (!user) {
        await Helper.createAuthAuditLog(
          { id: null, userType: "BUSINESS" },
          "PASSWORD_RESET_CONFIRMATION_FAILED",
          req,
          { reason: "INVALID_OR_EXPIRED_TOKEN" }
        );
        throw ApiError.badRequest("Invalid or expired token");
      }

      // Generate new password and transaction PIN
      const generatedPassword = Helper.generatePassword();
      const generatedTransactionPin = Helper.generateTransactionPin();

      await Helper.updateUserPassword(user.id, generatedPassword);
      await Helper.updateUserPin(user.id, generatedTransactionPin);

      // Send credentials email for business user
      await sendCredentialsEmail(
        user,
        generatedPassword,
        generatedTransactionPin, // Send the plain transaction PIN for email
        "reset",
        `Your business account password has been reset successfully. Here are your new login credentials.`,
        "BUSINESS",
        {
          role: user.role?.name || "Business User",
        }
      );

      await Helper.createAuthAuditLog(
        {
          ...user.toJSON(),
          userType: "BUSINESS",
        },
        "PASSWORD_RESET_CONFIRMED",
        req
      );

      return {
        message:
          "Password reset successfully. You can now login with your new password.",
      };
    } catch (error) {
      console.error("Business password reset confirmation error:", error);

      await Helper.createAuthAuditLog(
        {
          ...(user?.toJSON() || { userType: "BUSINESS" }),
          userType: "BUSINESS",
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
    currentUserType,
    targetUserId,
    credentialsData,
    currentUserRole,
    req,
  }) {
    const { User, Employee } = models;

    // 1. ACCESS CONTROL
    const isOwnUpdate = currentUserId === targetUserId;

    if (!isOwnUpdate) {
      // Check if target user is in business user's hierarchy
      const isChild = await HierarchyService.isChildOfAdmin(
        currentUserId,
        targetUserId
      );

      if (!isChild) {
        throw ApiError.forbidden(
          "You can update only your own users or users in your hierarchy"
        );
      }
    }

    // 2. Fetch Target User
    let targetUser;
    let targetUserType;
    let userModel;

    // Business users can only update BUSINESS users and EMPLOYEES
    const employeeUser = await Employee.findByPk(targetUserId);
    if (employeeUser) {
      targetUser = employeeUser;
      targetUserType = "EMPLOYEE";
      userModel = Employee;

      // Verify this employee belongs to current business user
      if (
        employeeUser.userId !== currentUserId &&
        employeeUser.createdById !== currentUserId
      ) {
        throw ApiError.forbidden("You can only update your own employees");
      }
    } else {
      const businessUser = await User.findByPk(targetUserId, {
        include: [
          {
            association: "role",
            attributes: ["type"],
          },
        ],
      });

      if (businessUser) {
        targetUser = businessUser;
        targetUserType = "BUSINESS";
        userModel = User;

        // For business users, verify hierarchy
        if (!isOwnUpdate) {
          const isChildBusiness = await HierarchyService.isChildOfAdmin(
            currentUserId,
            targetUserId
          );
          if (!isChildBusiness) {
            throw ApiError.forbidden(
              "You can only update users in your hierarchy"
            );
          }
        }
      } else {
        throw ApiError.notFound("User not found");
      }
    }

    // -------------------------------
    // 3. Verify current password for own updates
    // -------------------------------
    if (isOwnUpdate || credentialsData.currentPassword) {
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

    // Transaction PIN update (only for BUSINESS users)
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

      // Verify current transaction PIN for own updates
      if (isOwnUpdate) {
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
        currentUserType: "BUSINESS",
        userRole: currentUserRole,
        performedBy: "BUSINESS_ADMIN",
      }
    );

    return {
      message: "Credentials updated successfully",
      updatedFields,
      targetUserType,
    };
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

    return Helper.sanitizeUserData(user);
  }

  static async updateProfile(userId, updateData, req = null) {
    const user = await models.User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound("User not found");
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
      previousValues[key] = user[key];
    });

    await models.User.update(updatePayload, { where: { id: userId } });

    await Helper.createAuthAuditLog(user, "PROFILE_UPDATED", req, {
      updatedFields: Object.keys(updatePayload),
      previousValues,
    });

    return await this.getProfile(userId);
  }

  static async updateProfileImage(userId, profileImagePath, req = null) {
    try {
      const { User } = models;

      // Verify business user exists
      const user = await User.findByPk(userId);
      if (!user) {
        throw ApiError.notFound("Business user not found");
      }

      let oldImageDeleted = false;
      let profileImageUrl = "";

      // Delete old profile image if exists
      if (user.profileImage) {
        try {
          await S3Service.delete({ fileUrl: user.profileImage });
          oldImageDeleted = true;
          console.log("Old business profile image deleted", { userId });
        } catch (error) {
          console.error("Failed to delete old business profile image", {
            userId,
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

        console.log("New business profile image uploaded", { userId });
      } catch (uploadError) {
        console.error("Failed to upload business profile image", {
          userId,
          error: uploadError.message,
        });
        throw ApiError.internal("Failed to upload profile image");
      }

      // Update user record
      try {
        await User.update(
          { profileImage: profileImageUrl },
          { where: { id: userId } }
        );

        console.log("Business profile image updated in database", { userId });
      } catch (updateError) {
        console.error("Failed to update business profile image in database", {
          userId,
          error: updateError.message,
        });

        // Rollback: Delete uploaded image
        try {
          await S3Service.delete({ fileUrl: profileImageUrl });
        } catch (rollbackError) {
          console.error(
            "Failed to rollback business uploaded image",
            rollbackError
          );
        }

        throw ApiError.internal("Failed to update profile in database");
      }

      // Delete local file
      try {
        await Helper.deleteOldImage(profileImagePath);
      } catch (deleteError) {
        console.error("Failed to delete business local file", deleteError);
      }

      // Audit log
      if (req) {
        await Helper.createAuthAuditLog(
          { id: userId, userType: "BUSINESS" },
          "PROFILE_IMAGE_UPDATED",
          req,
          {
            oldImageDeleted,
            userType: "BUSINESS",
          }
        );
      }

      // Get updated user data
      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ["password", "refreshToken", "transactionPin"] },
        include: [
          {
            association: "role",
            attributes: ["id", "name"],
          },
        ],
      });

      return {
        user: updatedUser,
        message: "Business profile image updated successfully",
      };
    } catch (error) {
      console.error("Error in BusinessAuthService.updateProfileImage:", {
        userId,
        error: error.message,
      });

      // Cleanup local file
      try {
        await Helper.deleteOldImage(profileImagePath);
      } catch (cleanupError) {
        console.error("Failed to cleanup business local file", cleanupError);
      }

      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal("Failed to update business profile image");
    }
  }

  static async getAdminDashboard(adminUser, req = null) {
    if (!adminUser || adminUser.role !== "ADMIN") {
      throw ApiError.forbidden("Admin access required");
    }

    const adminId = adminUser.id;

    const [totalUsers, totalEmployees, pendingKyc, activeSessions] =
      await Promise.all([
        models.User.count({
          where: { parentId: adminId }, // 🔹 added here
          include: [
            {
              model: models.Role,
              as: "role",
              where: { name: { [models.Sequelize.Op.ne]: "ADMIN" } },
            },
          ],
        }),

        models.Employee.count({
          where: { createdById: adminId }, // 🔹 added here
        }),

        models.UserKyc.count({
          where: {
            status: "PENDING",
            verifiedById: adminId, // 🔹 added here
          },
        }),

        models.User.count({
          where: {
            parentId: adminId, // 🔹 added here
            refreshToken: { [models.Sequelize.Op.ne]: null },
          },
        }),
      ]);

    const dashboardStats = {
      totalUsers,
      totalEmployees,
      pendingKyc,
      activeSessions,
      totalRevenue: await this.getTotalRevenue(),
    };

    await Helper.createAuthAuditLog(adminUser, "DASHBOARD_ACCESSED", req, {
      dashboardType: "ADMIN_DASHBOARD",
    });

    return {
      dashboardStats,
    };
  }

  static async getTotalRevenue() {
    const result = await models.Wallet.sum("balance");
    return result || 0;
  }
}

export default BusinessAuthService;
