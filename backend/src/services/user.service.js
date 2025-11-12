import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { CryptoService } from "../utils/cryptoService.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";
import { sendCredentialsEmail } from "../utils/sendCredentialsEmail.js";

class UserServices {
  // BUSINESS USER REGISTRATION
  static async register(payload) {
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
      const existingUser = await Prisma.user.findFirst({
        where: {
          OR: [{ email }, { phoneNumber }, { username }],
        },
      });

      if (existingUser) {
        throw ApiError.badRequest("User already exists");
      }

      const role = await Prisma.role.findUnique({ where: { id: roleId } });
      if (!role) throw ApiError.badRequest("Invalid roleId");

      // Ensure only business roles are assigned
      if (role.type !== "business") {
        throw ApiError.badRequest("Only business type roles can be assigned");
      }

      const generatedPassword = Helper.generatePassword();
      const generatedTransactionPin = Helper.generateTransactionPin();

      const hashedPassword = CryptoService.encrypt(generatedPassword);
      const hashedPin = CryptoService.encrypt(generatedTransactionPin);

      let hierarchyLevel = 0;
      let hierarchyPath = "";

      if (parentId) {
        const parent = await Prisma.user.findUnique({
          where: { id: parentId },
        });
        if (!parent) throw ApiError.badRequest("Invalid parentId");
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

      const user = await Prisma.user.create({
        data: {
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
          status: "IN_ACTIVE",
          deactivationReason:
            "Kindly contact the administrator to have your account activated.",
          isKycVerified: false,
          refreshToken: null,
          passwordResetToken: null,
          passwordResetExpires: null,
          emailVerificationToken: null,
          emailVerifiedAt: null,
          emailVerificationTokenExpires: null,
        },
        include: {
          role: {
            select: { id: true, name: true, level: true, description: true },
          },
          wallets: true,
          parent: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
            },
          },
          children: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              status: true,
              createdAt: true,
            },
          },
          bankAccounts: {
            where: {
              status: "VERIFIED",
            },
            orderBy: {
              isPrimary: "desc",
            },
          },
        },
      });

      // Create wallet for business user
      await Prisma.wallet.create({
        data: {
          userId: user.id,
          balance: BigInt(0),
          currency: "INR",
          walletType: "PRIMARY",
          holdBalance: BigInt(0),
          availableBalance: BigInt(0),
          isActive: true,
          version: 1,
        },
      });

      // Send business-specific credentials email
      await sendCredentialsEmail(
        user,
        generatedPassword,
        generatedTransactionPin,
        "created",
        "Your business account has been successfully created. Here are your login credentials:",
        "business"
      );

      const accessToken = Helper.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role.name,
        roleLevel: user.role.level,
      });

      // await Prisma.auditLog.create({
      //   data: {
      //     userId: user.id,
      //     action: "BUSINESS_USER_REGISTER",
      //     metadata: {
      //       role: user.role.name,
      //       createdBy: parentId,
      //     },
      //   },
      // });

      return { user, accessToken };
    } catch (err) {
      console.error("Business user registration error", {
        email,
        error: err.message,
        stack: err.stack,
      });

      if (err instanceof ApiError) throw err;
      throw ApiError.internal(
        "Failed to register business user. Please try again."
      );
    } finally {
      Helper.deleteOldImage(profileImage);
    }
  }

  // BUSINESS USER PROFILE UPDATE
  static async updateProfile(userId, updateData, currentUserId) {
    const { username, phoneNumber, firstName, lastName, email, roleId } =
      updateData;

    const currentUser = await Prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        role: {
          select: { name: true, level: true },
        },
      },
    });

    if (!currentUser) {
      throw ApiError.unauthorized("Current user not found");
    }

    const userToUpdate = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: { level: true, name: true, type: true },
        },
      },
    });

    if (!userToUpdate) {
      throw ApiError.notFound("User to update not found");
    }

    // Ensure we're updating a business user
    if (userToUpdate.role.type !== "business") {
      throw ApiError.badRequest("Can only update business users");
    }

    const isAdmin = currentUser.role.name === "ADMIN";
    const isUpdatingOwnProfile = userId === currentUserId;

    const isEmailChanged = email && email !== userToUpdate.email;

    if (isEmailChanged && !isAdmin) {
      throw ApiError.forbidden(
        "Only administrators can update email addresses"
      );
    }

    if (roleId && !isAdmin) {
      throw ApiError.forbidden("Only administrators can change user roles");
    }

    if (username || phoneNumber || email) {
      const existingUser = await Prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(username ? [{ username }] : []),
                ...(phoneNumber ? [{ phoneNumber }] : []),
                ...(email ? [{ email }] : []),
              ],
            },
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

    const formattedData = {};

    if (username) formattedData.username = username.trim();
    if (firstName) formattedData.firstName = this.formatName(firstName);
    if (lastName) formattedData.lastName = this.formatName(lastName);
    if (phoneNumber) formattedData.phoneNumber = phoneNumber;
    if (email) formattedData.email = email.trim().toLowerCase();

    if (roleId && isAdmin) {
      const roleRecord = await Prisma.role.findUnique({
        where: { id: roleId },
      });
      if (!roleRecord) throw ApiError.badRequest("Invalid role");
      if (roleRecord.type !== "business") {
        throw ApiError.badRequest("Can only assign business roles");
      }
      formattedData.roleId = roleRecord.id;
    }

    const updatedUser = await Prisma.user.update({
      where: { id: userId },
      data: formattedData,
      include: {
        role: {
          select: { id: true, name: true, level: true, description: true },
        },
        wallets: true,
        parent: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
          },
        },
        children: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (isEmailChanged) {
      await this.regenerateCredentialsAndNotify(userId, email);
    }

    // await Prisma.auditLog.create({
    //   data: {
    //     userId: currentUserId,
    //     action: "BUSINESS_PROFILE_UPDATE",
    //     entityType: "User",
    //     entityId: userId,
    //     metadata: {
    //       updatedFields: Object.keys(updateData),
    //       emailChanged: isEmailChanged,
    //       isAdmin: isAdmin,
    //       isOwnProfile: isUpdatingOwnProfile,
    //     },
    //   },
    // });

    return updatedUser;
  }

  // BUSINESS USER PROFILE IMAGE UPDATE
  static async updateProfileImage(userId, profileImagePath) {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              level: true,
              description: true,
              type: true,
            },
          },
          wallets: true,
        },
      });

      if (!user) {
        throw ApiError.notFound("User not found");
      }

      // Ensure it's a business user
      if (user.role.type !== "business") {
        throw ApiError.badRequest(
          "Can only update business user profile images"
        );
      }

      if (user.profileImage) {
        try {
          await S3Service.delete({ fileUrl: user.profileImage });
        } catch (error) {
          console.error("Failed to delete old profile image", {
            userId,
            profileImage: user.profileImage,
            error,
          });
        }
      }

      const profileImageUrl =
        (await S3Service.upload(profileImagePath, "profile")) ?? "";

      const updatedUser = await Prisma.user.update({
        where: { id: userId },
        data: { profileImage: profileImageUrl },
        include: {
          role: {
            select: { id: true, name: true, level: true, description: true },
          },
          wallets: true,
          parent: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
            },
          },
          children: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      // await Prisma.auditLog.create({
      //   data: {
      //     userId,
      //     action: "BUSINESS_PROFILE_IMAGE_UPDATE",
      //     metadata: { newImage: profileImageUrl },
      //   },
      // });

      return updatedUser;
    } finally {
      Helper.deleteOldImage(profileImagePath);
    }
  }

  // GET BUSINESS USER BY ID
  static async getUserById(userId, currentUser = null) {
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            level: true,
            description: true,
            type: true,
          },
        },
        wallets: true,
        parent: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
          },
        },
        children: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
            status: true,
            createdAt: true,
          },
        },
        kycs: {
          include: {
            address: {
              include: {
                state: {
                  select: {
                    id: true,
                    stateName: true,
                    stateCode: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
                city: {
                  select: {
                    id: true,
                    cityName: true,
                    cityCode: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        bankAccounts: {
          where: { status: "VERIFIED" },
          orderBy: { isPrimary: "desc" },
        },
        userPermissions: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                code: true,
                isActive: true,
              },
            },
          },
        },
        piiConsents: {
          select: {
            id: true,
            piiType: true,
            scope: true,
            providedAt: true,
            expiresAt: true,
            userKycId: true,
          },
          where: { expiresAt: { gt: new Date() } },
        },
      },
    });

    if (!user) throw ApiError.notFound("User not found");

    // Ensure it's a business user
    if (user.role.type !== "business") {
      throw ApiError.badRequest("User is not a business user");
    }

    const transformedUser = {
      ...user,
      kycInfo:
        user.kycs.length > 0
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
        totalAccounts: user.bankAccounts.length,
        primaryAccount: user.bankAccounts.find((acc) => acc.isPrimary) || null,
        verifiedAccounts: user.bankAccounts.filter(
          (acc) => acc.status === "VERIFIED"
        ),
      },
      kycs: undefined,
      bankAccounts: undefined,
    };

    let safeUser;

    const isCurrentUserAdmin = currentUser && currentUser.role === "ADMIN";

    if (isCurrentUserAdmin) {
      const serialized = Helper.serializeUser(transformedUser);

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

      safeUser = serialized;
    } else {
      const serialized = Helper.serializeUser(transformedUser);
      const { password, transactionPin, refreshToken, ...safeData } =
        serialized;
      safeUser = safeData;
    }

    return safeUser;
  }

  // GET ALL BUSINESS USERS BY ROLE
  static async getAllUsersByRole(roleId) {
    if (!roleId) {
      throw ApiError.badRequest("roleId is required");
    }

    // Verify role is business type
    const role = await Prisma.role.findUnique({
      where: { id: roleId },
      select: { type: true },
    });

    if (!role || role.type !== "business") {
      throw ApiError.badRequest("Invalid business role");
    }

    const users = await Prisma.user.findMany({
      where: {
        roleId,
        status: "ACTIVE",
      },
      include: {
        role: {
          select: { id: true, name: true, level: true, description: true },
        },
        wallets: true,
        parent: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
          },
        },
        children: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
            status: true,
            createdAt: true,
          },
        },
        bankAccounts: {
          where: {
            status: "VERIFIED",
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const safeUsers = users.map((user) => Helper.serializeUser(user));

    return safeUsers;
  }

  // GET ALL BUSINESS USERS BY PARENT ID
  static async getAllRoleTypeUsersByParentId(parentId, options = {}) {
    const parent = await Prisma.user.findUnique({
      where: { id: parentId },
      include: {
        role: true,
      },
    });

    if (!parent) {
      throw ApiError.notFound("Parent user not found");
    }

    const {
      page = 1,
      limit = 10,
      sort = "desc",
      status = "ALL",
      search = "",
    } = options;

    const skip = (page - 1) * limit;
    const isAll = status === "ALL";

    // Get only business type roles
    const businessRoles = await Prisma.role.findMany({
      where: {
        type: "business",
        name: {
          not: "ADMIN", // Exclude ADMIN role
        },
      },
      select: { id: true, name: true },
    });

    const businessRoleIds = businessRoles.map((role) => role.id);

    let queryWhere =
      parent.role?.name === "ADMIN"
        ? {
            roleId: {
              in: businessRoleIds,
            },
            ...(isAll ? {} : { status }),
          }
        : {
            parentId,
            roleId: {
              in: businessRoleIds,
            },
            ...(isAll ? {} : { status }),
          };

    if (search && search.trim() !== "") {
      const searchTerm = search.toLowerCase();

      const searchConditions = {
        OR: [
          {
            username: {
              contains: searchTerm,
            },
          },
          {
            firstName: {
              contains: searchTerm,
            },
          },
          {
            lastName: {
              contains: searchTerm,
            },
          },
          {
            email: {
              contains: searchTerm,
            },
          },
          {
            phoneNumber: {
              contains: searchTerm,
            },
          },
        ],
      };

      queryWhere = {
        ...queryWhere,
        ...searchConditions,
      };
    }

    const [users, total] = await Promise.all([
      Prisma.user.findMany({
        where: queryWhere,
        include: {
          role: {
            select: {
              id: true,
              name: true,
              level: true,
              description: true,
              type: true,
            },
          },
          wallets: true,
          parent: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
            },
          },
          children: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: sort },
        skip,
        take: limit,
      }),
      Prisma.user.count({
        where: queryWhere,
      }),
    ]);

    // Additional safety filter to ensure only business users are returned
    const filteredUsers = users.filter(
      (user) => user.role.type === "business" && user.role.name !== "ADMIN"
    );

    let safeUsers;

    if (parent.role.name === "ADMIN") {
      safeUsers = filteredUsers.map((user) => {
        const serialized = Helper.serializeUser(user);

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

        return serialized;
      });
    } else {
      safeUsers = filteredUsers.map((user) => {
        const serialized = Helper.serializeUser(user);
        const { password, transactionPin, refreshToken, ...safeUser } =
          serialized;
        return safeUser;
      });
    }

    return { users: safeUsers, total: filteredUsers.length };
  }

  // BUSINESS USER DEACTIVATION
  static async deactivateUser(userId, deactivatedBy, reason) {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user) {
        throw ApiError.notFound("User not found");
      }

      // Ensure it's a business user
      if (user.role.type !== "business") {
        throw ApiError.badRequest("Can only deactivate business users");
      }

      if (user.status === "IN_ACTIVE") {
        throw ApiError.badRequest("User is already deactivated");
      }

      const deactivator = await Prisma.user.findUnique({
        where: { id: deactivatedBy },
        include: { role: true },
      });

      if (!deactivator) {
        throw ApiError.unauthorized("Invalid deactivator user");
      }

      const isAdmin = deactivator.role.name === "ADMIN";
      const isParent = user.parentId === deactivatedBy;
      const hasHigherRole = deactivator.role.level > user.role.level;

      if (!isAdmin && !isParent && !hasHigherRole) {
        throw ApiError.forbidden(
          "You don't have permission to deactivate this user"
        );
      }

      const updatedUser = await Prisma.user.update({
        where: { id: userId },
        data: {
          status: "IN_ACTIVE",
          deactivationReason: reason,
          updatedAt: new Date(),
        },
        include: {
          role: {
            select: { id: true, name: true, level: true, description: true },
          },
          wallets: true,
          parent: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
            },
          },
          children: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      // await Prisma.auditLog.create({
      //   data: {
      //     userId: deactivatedBy,
      //     action: "BUSINESS_USER_DEACTIVATE",
      //     entityType: "User",
      //     metadata: {
      //       previousStatus: user.status,
      //       newStatus: "IN_ACTIVE",
      //       reason: reason || "No reason provided",
      //       deactivatedBy,
      //       timestamp: new Date().toISOString(),
      //       targetUserId: userId,
      //     },
      //   },
      // });

      return updatedUser;
    } catch (error) {
      console.error("Failed to deactivate business user", {
        userId,
        deactivatedBy,
        error: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        "Failed to deactivate business user. Please try again."
      );
    }
  }

  // BUSINESS USER REACTIVATION
  static async reactivateUser(userId, reactivatedBy, reason) {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user) {
        throw ApiError.notFound("User not found");
      }

      // Ensure it's a business user
      if (user.role.type !== "business") {
        throw ApiError.badRequest("Can only reactivate business users");
      }

      if (user.status === "DELETE") {
        throw ApiError.badRequest("Cannot reactivate a deleted user");
      }

      if (user.status === "ACTIVE") {
        throw ApiError.badRequest("User is already active");
      }

      const activator = await Prisma.user.findUnique({
        where: { id: reactivatedBy },
        include: { role: true },
      });

      if (!activator) {
        throw ApiError.unauthorized("Invalid activator user");
      }

      const isAdmin = activator.role.name === "ADMIN";
      const isParent = user.parentId === reactivatedBy;
      const hasHigherRole = activator.role.level > user.role.level;

      if (!isAdmin && !isParent && !hasHigherRole) {
        throw ApiError.forbidden(
          "You don't have permission to reactivate this user"
        );
      }

      const updatedUser = await Prisma.user.update({
        where: { id: userId },
        data: {
          status: "ACTIVE",
          deactivationReason: reason,
          updatedAt: new Date(),
        },
        include: {
          role: {
            select: { id: true, name: true, level: true, description: true },
          },
          wallets: true,
          parent: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
            },
          },
          children: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      // await Prisma.auditLog.create({
      //   data: {
      //     userId: reactivatedBy,
      //     action: "BUSINESS_USER_REACTIVATE",
      //     entityType: "User",
      //     metadata: {
      //       previousStatus: user.status,
      //       newStatus: "ACTIVE",
      //       reason: reason || "No reason provided",
      //       reactivatedBy,
      //       timestamp: new Date().toISOString(),
      //       targetUserId: userId,
      //     },
      //   },
      // });

      return updatedUser;
    } catch (error) {
      console.error("Failed to reactivate business user", {
        userId,
        reactivatedBy,
        error: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        "Failed to reactivate business user. Please try again."
      );
    }
  }

  // BUSINESS USER SOFT DELETE
  static async deleteUser(userId, deletedBy, reason) {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user) {
        throw ApiError.notFound("User not found");
      }

      // Ensure it's a business user
      if (user.role.type !== "business") {
        throw ApiError.badRequest("Can only delete business users");
      }

      const deleter = await Prisma.user.findUnique({
        where: { id: deletedBy },
        include: { role: true },
      });

      if (!deleter) {
        throw ApiError.unauthorized("Invalid deleter user");
      }

      const isAdmin = deleter.role.name === "ADMIN";
      if (!isAdmin) {
        throw ApiError.forbidden("Only ADMIN can delete users");
      }

      const updatedUser = await Prisma.user.update({
        where: { id: userId },
        data: {
          status: "DELETE",
          deactivationReason: reason,
          updatedAt: new Date(),
          deletedAt: new Date(),
        },
        include: {
          role: {
            select: { id: true, name: true, level: true, description: true },
          },
          wallets: true,
          parent: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
            },
          },
          children: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      // await Prisma.auditLog.create({
      //   data: {
      //     userId: deletedBy,
      //     action: "BUSINESS_USER_DELETE",
      //     entityType: "User",
      //     metadata: {
      //       previousStatus: user.status,
      //       newStatus: "DELETE",
      //       reason: reason || "No reason provided",
      //       deletedBy,
      //       timestamp: new Date().toISOString(),
      //       targetUserId: userId,
      //     },
      //   },
      // });

      return updatedUser;
    } catch (error) {
      console.error("Failed to delete business user", {
        userId,
        deletedBy,
        error: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        "Failed to delete business user. Please try again."
      );
    }
  }

  // HELPER METHODS
  static async regenerateCredentialsAndNotify(userId, newEmail) {
    try {
      const newPassword = Helper.generatePassword();
      const newTransactionPin = Helper.generateTransactionPin();

      const hashedPassword = CryptoService.encrypt(newPassword);
      const hashedTransactionPin = CryptoService.encrypt(newTransactionPin);

      const user = await Prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          transactionPin: hashedTransactionPin,
          email: newEmail,
        },
        include: {
          role: true,
        },
      });

      await sendCredentialsEmail(
        user,
        newPassword,
        newTransactionPin,
        "reset",
        "Your business account credentials have been reset. Here are your new login credentials:",
        "business"
      );

      // await Prisma.auditLog.create({
      //   data: {
      //     userId,
      //     action: "BUSINESS_CREDENTIALS_REGENERATED",
      //     metadata: {
      //       reason: "EMAIL_UPDATED",
      //       newEmail: newEmail,
      //     },
      //   },
      // });

      return user;
    } catch (error) {
      console.error("Error regenerating business credentials:", error);
      throw ApiError.internal("Failed to regenerate business credentials");
    }
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

  // BUSINESS SPECIFIC METHODS
  static async getAllUsersByChildrenId(userId) {
    if (!userId) {
      throw ApiError.badRequest("userId is required");
    }

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, hierarchyPath: true },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const users = await Prisma.user.findMany({
      where: {
        hierarchyPath: {
          contains: userId,
        },
        status: "ACTIVE",
        role: {
          type: "business", // Only business users
        },
      },
      include: {
        role: {
          select: { id: true, name: true, level: true, description: true },
        },
        wallets: true,
        parent: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
          },
        },
        children: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImage: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { hierarchyLevel: "asc" },
    });

    const safeUsers = users.map((user) => Helper.serializeUser(user));

    return safeUsers;
  }

  static async getAllUsersCountByParentId(parentId) {
    if (!parentId) {
      throw ApiError.badRequest("parentId is required");
    }

    const count = await Prisma.user.count({
      where: {
        parentId,
        status: "ACTIVE",
        role: {
          type: "business", // Only business users
        },
      },
    });

    return { count };
  }

  static async getAllUsersCountByChildrenId(userId) {
    if (!userId) {
      throw ApiError.badRequest("userId is required");
    }

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      select: { hierarchyPath: true },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const count = await Prisma.user.count({
      where: {
        hierarchyPath: {
          contains: userId,
        },
        status: "ACTIVE",
        role: {
          type: "business", // Only business users
        },
      },
    });

    return { count };
  }
}

export default UserServices;
