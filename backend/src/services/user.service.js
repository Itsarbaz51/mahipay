import models from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { CryptoService } from "../utils/cryptoService.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";
import { sendCredentialsEmail } from "../utils/sendCredentialsEmail.js";
import AuditService from "./audit.service.js";
import PermissionRegistry from "../utils/PermissionRegistry.js";

class UserServices {
  // BUSINESS USER REGISTRATION
  static async register(payload, req = null) {
    const {
      username,
      firstName,
      lastName,
      profileImage,
      email,
      phoneNumber,
      roleId,
      parentId,
    } = payload;

    let profileImageUrl = "";

    try {
      // Check for existing user
      const existingUser = await models.User.findOne({
        where: {
          [models.Sequelize.Op.or]: [{ email }, { phoneNumber }, { username }],
        },
      });

      if (existingUser) {
        await AuditService.createLog({
          action: "BUSINESS_USER_REGISTRATION_FAILED",
          entity: "USER",
          performedById: parentId,
          performedByType: "USER",
          description: "User already exists",
          metadata: {
            email,
            phoneNumber,
            username,
            reason: "USER_ALREADY_EXISTS",
          },
        });
        throw ApiError.badRequest("User already exists");
      }

      const role = await models.Role.findByPk(roleId);
      if (!role) {
        await AuditService.createLog({
          action: "BUSINESS_USER_REGISTRATION_FAILED",
          entity: "USER",
          performedById: parentId,
          performedByType: "USER",
          description: "Invalid role",
          metadata: { roleId, reason: "INVALID_ROLE_ID" },
        });
        throw ApiError.badRequest("Invalid role");
      }

      // Ensure only business roles are assigned
      if (role.type !== "business") {
        await AuditService.createLog({
          action: "BUSINESS_USER_REGISTRATION_FAILED",
          entity: "USER",
          performedById: parentId,
          performedByType: "USER",
          description: "Non-business role assigned",
          metadata: {
            roleName: role.name,
            roleType: role.type,
            reason: "NON_BUSINESS_ROLE",
          },
        });
        throw ApiError.badRequest("Only business type roles can be assigned");
      }

      const generatedPassword = Helper.generatePassword();
      const generatedTransactionPin = Helper.generateTransactionPin();

      const hashedPassword = CryptoService.encrypt(generatedPassword);
      const hashedPin = CryptoService.encrypt(generatedTransactionPin);

      let hierarchyLevel = 0;
      let hierarchyPath = "";

      if (parentId) {
        const parent = await models.User.findByPk(parentId);
        if (!parent) {
          await AuditService.createLog({
            action: "BUSINESS_USER_REGISTRATION_FAILED",
            entity: "USER",
            performedById: parentId,
            performedByType: "USER",
            description: "Invalid parent user",
            metadata: { parentId, reason: "INVALID_PARENT_ID" },
          });
          throw ApiError.badRequest("Invalid parent user");
        }
        hierarchyLevel = parent.hierarchyLevel + 1;
        hierarchyPath = parent.hierarchyPath
          ? `${parent.hierarchyPath}/${parentId}`
          : `${parentId}`;
      }

      if (profileImage) {
        try {
          profileImageUrl =
            (await S3Service.upload(profileImage, "profile")) ?? "";
        } catch (uploadErr) {
          console.warn("Profile image upload failed:", uploadErr);
        }
      }

      const formattedFirstName = this.formatName(firstName);
      const formattedLastName = this.formatName(lastName);

      // Create user with Sequelize
      const user = await models.User.create({
        username,
        firstName: formattedFirstName,
        lastName: formattedLastName,
        profileImage: profileImageUrl,
        email,
        phoneNumber,
        password: hashedPassword,
        transactionPin: hashedPin,
        roleId,
        parentId,
        hierarchyLevel,
        hierarchyPath,
        status: "INACTIVE",
        deactivationReason:
          "Kindly contact the administrator to have your account activated.",
        isKycVerified: false,
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

      // Send credentials email
      await sendCredentialsEmail(
        user,
        generatedPassword,
        generatedTransactionPin,
        "created",
        "Your business account has been successfully created.",
        "business"
      );

      const accessToken = Helper.generateAccessToken({
        id: user.id,
        email: user.email,
        role: role.name,
        roleLevel: role.hierarchyLevel,
      });

      await AuditService.createLog({
        action: "BUSINESS_USER_REGISTERED",
        entity: "USER",
        entityId: user.id,
        performedById: parentId,
        performedByType: "USER",
        description: "Business user registered successfully",
        metadata: {
          businessUserName: `${formattedFirstName} ${formattedLastName}`,
          businessUserEmail: user.email,
          hierarchyLevel: user.hierarchyLevel,
          hasProfileImage: !!profileImageUrl,
        },
      });

      return { user, accessToken };
    } catch (err) {
      console.error("Business user registration error", err);

      if (err instanceof ApiError) throw err;

      await AuditService.createLog({
        action: "BUSINESS_USER_REGISTRATION_FAILED",
        entity: "USER",
        performedById: parentId,
        performedByType: "USER",
        description: "Registration failed",
        metadata: {
          reason: "UNKNOWN_ERROR",
          error: err.message,
        },
      });

      throw ApiError.internal("Failed to register business user");
    } finally {
      if (profileImage) Helper.deleteOldImage(profileImage);
    }
  }

  // BUSINESS USER PROFILE UPDATE
  static async updateProfile(userId, updateData, currentUserId) {
    const { username, phoneNumber, firstName, lastName, email, roleId } =
      updateData;

    const [currentUser, userToUpdate] = await Promise.all([
      models.User.findByPk(currentUserId, {
        include: [{ model: models.Role, as: "role" }],
      }),
      models.User.findByPk(userId, {
        include: [{ model: models.Role, as: "role" }],
      }),
    ]);

    if (!currentUser || !userToUpdate) {
      throw ApiError.notFound("User not found");
    }

    // Ensure it's a business user
    if (userToUpdate.role.type !== "business") {
      throw ApiError.badRequest("Can only update business users");
    }

    const isAdmin = currentUser.role.name === "ADMIN";
    const isUpdatingOwnProfile = userId === currentUserId;

    // Authorization check
    if (!isUpdatingOwnProfile && !isAdmin) {
      const hasPermission = await this.checkUserPermission(
        currentUserId,
        "user:update"
      );
      if (!hasPermission) {
        throw ApiError.forbidden("Insufficient permissions to update user");
      }
    }

    // Check unique constraints
    await this.checkUniqueConstraints(userId, { username, phoneNumber, email });

    const updatePayload = {};
    const updatedFields = [];

    if (username) {
      updatePayload.username = username.trim();
      updatedFields.push("username");
    }
    if (firstName) {
      updatePayload.firstName = this.formatName(firstName);
      updatedFields.push("firstName");
    }
    if (lastName) {
      updatePayload.lastName = this.formatName(lastName);
      updatedFields.push("lastName");
    }
    if (phoneNumber) {
      updatePayload.phoneNumber = phoneNumber;
      updatedFields.push("phoneNumber");
    }
    if (email) {
      updatePayload.email = email.trim().toLowerCase();
      updatedFields.push("email");
    }

    if (roleId && isAdmin) {
      const roleRecord = await models.Role.findByPk(roleId);
      if (!roleRecord || roleRecord.type !== "business") {
        throw ApiError.badRequest("Invalid business role");
      }
      updatePayload.roleId = roleRecord.id;
      updatedFields.push("roleId");
    }

    const [_, [updatedUser]] = await models.User.update(updatePayload, {
      where: { id: userId },
      returning: true,
    });

    // Handle email change
    if (email && email !== userToUpdate.email) {
      await this.regenerateCredentialsAndNotify(userId, email, currentUserId);
    }

    await AuditService.createLog({
      action: "BUSINESS_PROFILE_UPDATED",
      entity: "USER",
      entityId: userId,
      performedById: currentUserId,
      performedByType: "USER",
      description: "Business profile updated",
      metadata: {
        updatedFields,
        emailChanged: !!email,
        isAdmin,
        isOwnProfile: isUpdatingOwnProfile,
      },
    });

    return updatedUser;
  }

  // BUSINESS USER PROFILE IMAGE UPDATE
  static async updateProfileImage(userId, profileImagePath) {
    try {
      const user = await models.User.findByPk(userId, {
        include: [{ model: models.Role, as: "role" }],
      });

      if (!user) {
        throw ApiError.notFound("User not found");
      }

      if (user.role.type !== "business") {
        throw ApiError.badRequest(
          "Can only update business user profile images"
        );
      }

      let oldImageDeleted = false;
      if (user.profileImage) {
        try {
          await S3Service.delete({ fileUrl: user.profileImage });
          oldImageDeleted = true;
        } catch (error) {
          console.error("Failed to delete old profile image:", error);
        }
      }

      const profileImageUrl =
        (await S3Service.upload(profileImagePath, "profile")) ?? "";

      const [_, [updatedUser]] = await models.User.update(
        { profileImage: profileImageUrl },
        {
          where: { id: userId },
          returning: true,
        }
      );

      await AuditService.createLog({
        action: "BUSINESS_PROFILE_IMAGE_UPDATED",
        entity: "USER",
        entityId: userId,
        performedById: userId,
        performedByType: "USER",
        description: "Profile image updated",
        metadata: {
          oldImageDeleted,
          newImageUrl: profileImageUrl,
        },
      });

      return updatedUser;
    } finally {
      if (profileImagePath) Helper.deleteOldImage(profileImagePath);
    }
  }

  // GET BUSINESS USER BY ID
  static async getUserById(userId, currentUser = null) {
    const user = await models.User.findByPk(userId, {
      include: [
        { model: models.Role, as: "role" },
        { model: models.Wallet, as: "wallets" },
        { model: models.User, as: "parent" },
        { model: models.User, as: "children" },
        {
          model: models.UserKyc,
          as: "userKyc",
          include: [
            {
              model: models.Address,
              as: "address",
              include: [
                { model: models.State, as: "state" },
                { model: models.City, as: "city" },
              ],
            },
          ],
        },
        {
          model: models.BankDetail,
          as: "bankAccounts",
          where: { status: "VERIFIED" },
          required: false,
        },
      ],
    });

    if (!user) throw ApiError.notFound("User not found");

    if (user.role.type !== "business") {
      throw ApiError.badRequest("User is not a business user");
    }

    const transformedUser = {
      ...user.toJSON(),
      kycInfo: user.userKyc
        ? {
            currentStatus: user.userKyc.status,
            isKycSubmitted: true,
            latestKyc: user.userKyc,
            kycHistory: [user.userKyc],
            totalKycAttempts: 1,
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

    return this.sanitizeUserData(transformedUser, currentUser);
  }

  // GET ALL BUSINESS USERS BY PARENT ID
  static async getAllRoleTypeUsersByParentId(parentId, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = "desc",
      status = "ALL",
      search = "",
    } = options;

    const offset = (page - 1) * limit;

    const parent = await models.User.findByPk(parentId, {
      include: [{ model: models.Role, as: "role" }],
    });

    if (!parent) {
      throw ApiError.notFound("Parent user not found");
    }

    // Get business type roles (exclude ADMIN)
    const businessRoles = await models.Role.findAll({
      where: {
        type: "business",
        name: {
          [models.Sequelize.Op.ne]: "ADMIN",
        },
      },
    });

    const businessRoleIds = businessRoles.map((role) => role.id);

    let targetParentId = parentId;

    // If parent user is employee, use admin's ID instead
    if (parent.role.type === "employee") {
      const adminUser = await models.User.findOne({
        where: { "$role.name$": "ADMIN" },
        include: [{ model: models.Role, as: "role" }],
      });

      if (!adminUser) {
        throw new Error("Admin user not found");
      }
      targetParentId = adminUser.id;
    }

    let queryWhere = {};

    // Build query based on user role
    if (parent.role.name === "ADMIN" || parent.role.type === "employee") {
      queryWhere = {
        roleId: { [models.Sequelize.Op.in]: businessRoleIds },
        ...(status !== "ALL" ? { status } : {}),
      };
    } else {
      queryWhere = {
        parentId: targetParentId,
        roleId: { [models.Sequelize.Op.in]: businessRoleIds },
        ...(status !== "ALL" ? { status } : {}),
      };
    }

    if (search.trim()) {
      const searchTerm = `%${search.toLowerCase()}%`;
      queryWhere[models.Sequelize.Op.or] = [
        { username: { [models.Sequelize.Op.iLike]: searchTerm } },
        { firstName: { [models.Sequelize.Op.iLike]: searchTerm } },
        { lastName: { [models.Sequelize.Op.iLike]: searchTerm } },
        { email: { [models.Sequelize.Op.iLike]: searchTerm } },
        { phoneNumber: { [models.Sequelize.Op.iLike]: searchTerm } },
      ];
    }

    const { count, rows: users } = await models.User.findAndCountAll({
      where: queryWhere,
      include: [
        { model: models.Role, as: "role" },
        { model: models.Wallet, as: "wallets" },
        { model: models.User, as: "parent" },
        { model: models.User, as: "children" },
      ],
      order: [["createdAt", sort === "desc" ? "DESC" : "ASC"]],
      offset,
      limit,
    });

    // Filter only business users
    const filteredUsers = users.filter(
      (user) => user.role.type === "business" && user.role.name !== "ADMIN"
    );

    const safeUsers = filteredUsers.map((user) =>
      this.sanitizeUserData(user, parent.role)
    );

    return {
      users: safeUsers,
      total: filteredUsers.length,
      meta: {
        parentRole: parent.role.name,
        parentRoleType: parent.role.type,
        isEmployeeViewingAdminData: parent.role.type === "employee",
        targetParentId,
      },
    };
  }

  // BUSINESS USER DEACTIVATION
  static async deactivateUser(userId, deactivatedBy, reason) {
    return this.updateUserStatus(
      userId,
      deactivatedBy,
      "INACTIVE",
      "BUSINESS_USER_DEACTIVATED",
      reason
    );
  }

  // BUSINESS USER REACTIVATION
  static async reactivateUser(userId, reactivatedBy, reason) {
    return this.updateUserStatus(
      userId,
      reactivatedBy,
      "ACTIVE",
      "BUSINESS_USER_REACTIVATED",
      reason
    );
  }

  // BUSINESS USER SOFT DELETE
  static async deleteUser(userId, deletedBy, reason) {
    const user = await models.User.findByPk(userId, {
      include: [{ model: models.Role, as: "role" }],
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (user.role.type !== "business") {
      throw ApiError.badRequest("Can only delete business users");
    }

    const deleter = await models.User.findByPk(deletedBy, {
      include: [{ model: models.Role, as: "role" }],
    });

    if (!deleter) {
      throw ApiError.unauthorized("Invalid deleter user");
    }

    const isAdmin = deleter.role.name === "ADMIN";
    if (!isAdmin) {
      throw ApiError.forbidden("Only ADMIN can delete users");
    }

    const [_, [updatedUser]] = await models.User.update(
      {
        status: "DELETED",
        deactivationReason: reason,
        deletedAt: new Date(),
      },
      {
        where: { id: userId },
        returning: true,
      }
    );

    await AuditService.createLog({
      action: "BUSINESS_USER_DELETED",
      entity: "USER",
      entityId: userId,
      performedById: deletedBy,
      performedByType: "USER",
      description: "Business user deleted",
      metadata: {
        previousStatus: user.status,
        newStatus: "DELETED",
        reason: reason || "No reason provided",
        deleterRole: deleter.role.name,
      },
    });

    return updatedUser;
  }

  // HELPER METHODS
  static async checkUniqueConstraints(userId, fields) {
    const { username, phoneNumber, email } = fields;
    const conditions = [];

    if (username) conditions.push({ username });
    if (phoneNumber) conditions.push({ phoneNumber });
    if (email) conditions.push({ email });

    if (conditions.length === 0) return;

    const existingUser = await models.User.findOne({
      where: {
        [models.Sequelize.Op.and]: [
          { id: { [models.Sequelize.Op.ne]: userId } },
          { [models.Sequelize.Op.or]: conditions },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === username)
        throw ApiError.badRequest("Username already taken");
      if (existingUser.phoneNumber === phoneNumber)
        throw ApiError.badRequest("Phone number already registered");
      if (existingUser.email === email)
        throw ApiError.badRequest("Email already registered");
    }
  }

  static async updateUserStatus(userId, changedBy, status, action, reason) {
    const [user, changer] = await Promise.all([
      models.User.findByPk(userId, {
        include: [{ model: models.Role, as: "role" }],
      }),
      models.User.findByPk(changedBy, {
        include: [{ model: models.Role, as: "role" }],
      }),
    ]);

    if (!user || !changer) {
      throw ApiError.notFound("User not found");
    }

    if (user.role.type !== "business") {
      throw ApiError.badRequest("Can only modify business users");
    }

    if (user.status === status) {
      throw ApiError.badRequest(`User is already ${status.toLowerCase()}`);
    }

    const isAdmin = changer.role.name === "ADMIN";
    const isParent = user.parentId === changedBy;
    const hasHigherRole =
      changer.role.hierarchyLevel > user.role.hierarchyLevel;

    if (!isAdmin && !isParent && !hasHigherRole) {
      throw ApiError.forbidden("You don't have permission to modify this user");
    }

    const [_, [updatedUser]] = await models.User.update(
      {
        status,
        deactivationReason: reason,
        updatedAt: new Date(),
      },
      {
        where: { id: userId },
        returning: true,
      }
    );

    await AuditService.createLog({
      action,
      entity: "USER",
      entityId: userId,
      performedById: changedBy,
      performedByType: "USER",
      description: `User status changed to ${status}`,
      metadata: {
        previousStatus: user.status,
        newStatus: status,
        reason: reason || "No reason provided",
        changerRole: changer.role.name,
      },
    });

    return updatedUser;
  }

  static sanitizeUserData(user, currentUserRole) {
    const serialized = Helper.serializeUser(user);

    // ADMIN can see decrypted data
    if (
      currentUserRole &&
      (currentUserRole.name === "ADMIN" || currentUserRole.type === "employee")
    ) {
      if (serialized.password) {
        try {
          serialized.password = CryptoService.decrypt(serialized.password);
        } catch {
          serialized.password = "Error decrypting";
        }
      }

      if (serialized.transactionPin) {
        try {
          serialized.transactionPin = CryptoService.decrypt(
            serialized.transactionPin
          );
        } catch {
          serialized.transactionPin = "Error decrypting";
        }
      }

      const { refreshToken, ...safeData } = serialized;
      return safeData;
    }

    // For non-admin users, remove sensitive data
    const { password, transactionPin, refreshToken, ...safeData } = serialized;
    return safeData;
  }

  static async checkUserPermission(userId, permission) {
    if (!PermissionRegistry.isValid(permission)) {
      return false;
    }

    const user = await models.User.findByPk(userId, {
      include: [
        {
          model: models.UserPermission,
          as: "userPermissions",
          where: { permission },
        },
      ],
    });

    return !!user;
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

  static async regenerateCredentialsAndNotify(userId, newEmail, currentUserId) {
    const newPassword = Helper.generatePassword();
    const newTransactionPin = Helper.generateTransactionPin();

    const hashedPassword = CryptoService.encrypt(newPassword);
    const hashedTransactionPin = CryptoService.encrypt(newTransactionPin);

    const [_, [user]] = await models.User.update(
      {
        password: hashedPassword,
        transactionPin: hashedTransactionPin,
        email: newEmail,
      },
      {
        where: { id: userId },
        returning: true,
      }
    );

    await sendCredentialsEmail(
      user,
      newPassword,
      newTransactionPin,
      "reset",
      "Your business account credentials have been reset.",
      "business"
    );

    await AuditService.createLog({
      action: "BUSINESS_CREDENTIALS_REGENERATED",
      entity: "USER",
      entityId: userId,
      performedById: currentUserId,
      performedByType: "USER",
      description: "Credentials regenerated",
      metadata: {
        reason: "EMAIL_UPDATED",
        newEmail,
      },
    });

    return user;
  }
}

export default UserServices;
