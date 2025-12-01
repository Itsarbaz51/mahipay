import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";
import { CryptoService } from "../../utils/cryptoService.js";
import { sendCredentialsEmail } from "../../utils/sendCredentialsEmail.js";
import S3Service from "../../utils/S3Service.js";

class RootAuthService {
  static async login(payload, req = null) {
    const { emailOrUsername, password } = payload;

    try {
      // SECURITY: Get client origin first
      const clientOrigin = req?.get("Origin");
      const clientIp = req ? await Helper.getClientIP(req) : "";

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
        await Helper.createAuthAuditLog(
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
      const isValidPassword = await Helper.verifyPassword(
        user.password,
        password
      );

      if (!isValidPassword) {
        await Helper.createAuthAuditLog(
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
      await Helper.checkUserStatus(user);

      // DYNAMIC ORIGIN VALIDATION: Get Root user's whitelist entries
      const rootWhitelistEntries = await models.IpWhitelist.findAll({
        where: {
          userId: user.id,
          userType: "ROOT",
        },
        attributes: ["id", "domainName", "serverIp", "localIp"],
      });

      // Validate origin against Root's whitelist domains
      if (
        !(await Helper.isValidOriginForRoot(clientOrigin, rootWhitelistEntries))
      ) {
        await Helper.createAuthAuditLog(
          { ...user.toJSON(), userType: "ROOT" },
          "LOGIN_FAILED",
          req,
          {
            reason: "ORIGIN_NOT_WHITELISTED_FOR_ROOT",
            clientOrigin,
            allowedDomains: rootWhitelistEntries
              .map((e) => e.domainName)
              .filter(Boolean),
          }
        );
        throw ApiError.forbidden(
          "Access denied: Origin not whitelisted for Root access"
        );
      }

      // Validate IP against Root's whitelist
      if (!(await Helper.isValidIpForRoot(clientIp, rootWhitelistEntries))) {
        await Helper.createAuthAuditLog(
          { ...user.toJSON(), userType: "ROOT" },
          "LOGIN_FAILED",
          req,
          {
            reason: "IP_NOT_WHITELISTED_FOR_ROOT",
            clientIp,
            allowedIps: rootWhitelistEntries
              .flatMap((e) => [e.serverIp, e.localIp])
              .filter(Boolean),
          }
        );
        throw ApiError.forbidden(
          "Access denied: IP address not whitelisted for Root access"
        );
      }

      // Build token payload
      const tokenPayload = {
        id: user.id,
        email: user.email,
        username: user.username,
        userType: "ROOT",
        role: "ROOT",
        roleLevel: 0,
        loginOrigin: clientOrigin,
        loginIp: clientIp,
      };

      // Generate tokens
      const accessToken = Helper.generateAccessToken(tokenPayload);
      const refreshToken = Helper.generateRefreshToken(tokenPayload);

      // Update refresh token and login info
      await models.Root.update(
        {
          refreshToken,
          lastLoginAt: new Date(),
          lastLoginIp: clientIp,
          lastLoginOrigin: clientOrigin,
        },
        { where: { id: user.id } }
      );

      await Helper.createAuthAuditLog(
        {
          ...user.toJSON(),
          userType: "ROOT",
        },
        "LOGIN_SUCCESS",
        req,
        {
          origin: clientOrigin,
          ip: clientIp,
          hasWhitelist: rootWhitelistEntries.length > 0,
          allowedDomains: rootWhitelistEntries
            .map((e) => e.domainName)
            .filter(Boolean),
        }
      );

      return {
        user: Helper.sanitizeUserData(user),
        accessToken,
        refreshToken,
        userType: "root",
        securityContext: {
          origin: clientOrigin,
          requiresWhitelist: rootWhitelistEntries.length > 0,
          allowedDomains: rootWhitelistEntries
            .map((e) => e.domainName)
            .filter(Boolean),
        },
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

      await Helper.createAuthAuditLog(
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
      await Helper.createAuthAuditLog(
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
      await Helper.createAuthAuditLog(
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

    await Helper.createAuthAuditLog(user, "REFRESH_TOKEN_SUCCESS", req);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: Helper.sanitizeUserData(user),
    };
  }

  static async requestPasswordReset(email, req = null) {
    const user = await models.Root.findOne({
      where: { email },
    });

    if (!user) {
      await Helper.createAuthAuditLog(
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

    await Helper.sendPasswordResetEmail(user, token, "root");

    await Helper.createAuthAuditLog(
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
    let user;
    try {
      const token = CryptoService.verifySecureToken(encryptedToken);
      const tokenHash = CryptoService.hashData(token);

      user = await models.Root.findOne({
        where: {
          passwordResetToken: tokenHash,
          passwordResetExpires: { [models.Sequelize.Op.gt]: new Date() },
        },
        include: [
          {
            association: "role",
            attributes: ["name"],
            required: false,
          },
        ],
      });

      if (!user) {
        await Helper.createAuthAuditLog(
          { id: null, userType: "ROOT" },
          "PASSWORD_RESET_CONFIRMATION_FAILED",
          req,
          { reason: "INVALID_OR_EXPIRED_TOKEN" }
        );
        throw ApiError.badRequest("Invalid or expired token");
      }

      const generatedPassword = Helper.generatePassword();

      await Helper.updateRootPassword(user.id, generatedPassword);

      await sendCredentialsEmail(
        user,
        generatedPassword,
        null,
        "reset",
        `Your root account password has been reset successfully. Here are your new login credentials.`,
        "ROOT", // Changed to uppercase to match your sendCredentialsEmail function
        {
          role: user.role?.name || "Root Administrator",
        }
      );

      await Helper.createAuthAuditLog(user, "PASSWORD_RESET_CONFIRMED", req);

      return {
        message:
          "Password reset successfully. You can now login with your new password.",
      };
    } catch (error) {
      console.error("Root password reset confirmation error:", error);

      await Helper.createAuthAuditLog(
        {
          ...(user?.toJSON() || { userType: "ROOT" }),
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

  static async updateCredentials({
    currentUserId,
    targetUserId,
    credentialsData,
    req,
    currentUserType,
  }) {
    // ACCESS CONTROL - Root has full access
    // No restrictions for ROOT user
    const { User, Root, Employee } = models;

    let targetUser;
    let targetUserType;
    let userModel;

    // Determine target user type
    const rootUser = await Root.findByPk(targetUserId);
    if (rootUser) {
      targetUser = rootUser;
      targetUserType = "ROOT";
      userModel = Root;
    } else {
      const employeeUser = await Employee.findByPk(targetUserId, {
        include: [
          {
            association: "department",
            attributes: ["name"],
          },
        ],
      });
      if (employeeUser) {
        targetUser = employeeUser;
        targetUserType = employeeUser.department.name;
        userModel = Employee;
      } else {
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
          targetUserType = businessUser.role.name;
          userModel = User;
        } else {
          throw ApiError.notFound("User not found");
        }
      }
    }

    if (!targetUser) {
      throw ApiError.notFound("User not found");
    }

    const isOwnUpdate = currentUserId === targetUserId;

    // -------------------------------
    // 3. Prepare update data
    // -------------------------------
    const updateData = {};
    const updatedFields = [];

    // Password update
    if (credentialsData.newPassword) {
      // Root doesn't need current password for others, but needs for self
      if (isOwnUpdate && credentialsData.currentPassword) {
        const decryptedStoredPassword = CryptoService.decrypt(
          targetUser.password
        );
        if (decryptedStoredPassword !== credentialsData.currentPassword) {
          throw ApiError.unauthorized("Current password is incorrect");
        }
      }

      updateData.password = CryptoService.encrypt(credentialsData.newPassword);
      updateData.refreshToken = null;
      updatedFields.push("password");
    }

    // Transaction PIN update (only for BUSINESS users)
    if (credentialsData.newTransactionPin && targetUserType === "BUSINESS") {
      // Root doesn't need current PIN for others
      if (isOwnUpdate && credentialsData.currentTransactionPin) {
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
    // 4. Update in Database
    // -------------------------------
    await userModel.update(updateData, {
      where: { id: targetUserId },
    });

    // -------------------------------
    // 5. AUDIT LOG
    // -------------------------------
    await Helper.createAuthAuditLog(
      { id: currentUserId, userType: currentUserType }, // user object
      "CREDENTIALS_UPDATED", // action
      req, // request object
      {
        updatedFields,
        isOwnUpdate,
        targetUserId,
        targetUserType,
        performedById: currentUserId,
        performedByType: currentUserType,
      }
    );

    return {
      message: "Credentials updated successfully",
      updatedFields,
      targetUserType,
    };
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

    return Helper.sanitizeUserData(user);
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

    await models.Root.update(updatePayload, { where: { id: rootId } });

    await Helper.createAuthAuditLog(user, "PROFILE_UPDATED", req, {
      updatedFields: Object.keys(updatePayload),
      previousValues,
    });

    return await this.getProfile(rootId);
  }

  static async updateProfileImage(rootId, profileImagePath, req = null) {
    try {
      const { Root } = models;

      // Verify root user exists
      const root = await Root.findByPk(rootId);
      if (!root) {
        throw ApiError.notFound("Root user not found");
      }

      let oldImageDeleted = false;
      let profileImageUrl = "";

      // Delete old profile image if exists
      if (root.profileImage) {
        try {
          await S3Service.delete({ fileUrl: root.profileImage });
          oldImageDeleted = true;
          console.log("Old root profile image deleted", { rootId });
        } catch (error) {
          console.error("Failed to delete old root profile image", {
            rootId,
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

        console.log("New root profile image uploaded", { rootId });
      } catch (uploadError) {
        console.error("Failed to upload root profile image", {
          rootId,
          error: uploadError.message,
        });
        throw ApiError.internal("Failed to upload profile image");
      }

      // Update root record
      try {
        await Root.update(
          { profileImage: profileImageUrl },
          { where: { id: rootId } }
        );

        console.log("Root profile image updated in database", { rootId });
      } catch (updateError) {
        console.error("Failed to update root profile image in database", {
          rootId,
          error: updateError.message,
        });

        // Rollback: Delete uploaded image
        try {
          await S3Service.delete({ fileUrl: profileImageUrl });
        } catch (rollbackError) {
          console.error(
            "Failed to rollback root uploaded image",
            rollbackError
          );
        }

        throw ApiError.internal("Failed to update profile in database");
      }

      // Delete local file
      try {
        await Helper.deleteOldImage(profileImagePath);
      } catch (deleteError) {
        console.error("Failed to delete root local file", deleteError);
      }

      // Audit log
      if (req) {
        await Helper.createAuthAuditLog(
          { id: rootId, userType: "ROOT" },
          "PROFILE_IMAGE_UPDATED",
          req,
          {
            oldImageDeleted,
            userType: "ROOT",
          }
        );
      }

      // Get updated root data
      const updatedRoot = await Root.findByPk(rootId, {
        attributes: { exclude: ["password", "refreshToken"] },
      });

      return {
        user: updatedRoot,
        message: "Root profile image updated successfully",
      };
    } catch (error) {
      console.error("Error in RootAuthService.updateProfileImage:", {
        rootId,
        error: error.message,
      });

      // Cleanup local file
      try {
        await Helper.deleteOldImage(profileImagePath);
      } catch (cleanupError) {
        console.error("Failed to cleanup root local file", cleanupError);
      }

      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal("Failed to update root profile image");
    }
  }

  static async getRootDashboard(rootUser, req = null) {
    if (!rootUser || rootUser.userType !== "ROOT") {
      throw ApiError.forbidden("Root access required");
    }

    const [totalAdmins, totalBusinessUsers, totalEmployees, pendingKyc] =
      await Promise.all([
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
        models.UserKyc.count({ where: { status: "PENDING" } }),
      ]);

    const systemStats = {
      totalAdmins,
      totalBusinessUsers,
      totalEmployees,
      pendingKyc,
      systemRevenue: await this.getSystemRevenue(),
    };

    const recentActivities = await this.getRecentSystemActivities();

    await Helper.createAuthAuditLog(rootUser, "DASHBOARD_ACCESSED", req, {
      dashboardType: "ROOT_DASHBOARD",
    });

    return {
      systemStats,
      recentActivities: recentActivities.slice(0, 10),
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
