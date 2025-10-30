import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { CryptoService } from "../utils/cryptoService.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";

class UserServices {
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

      await this.sendCredentialsEmail(
        user,
        generatedPassword,
        generatedTransactionPin
      );

      const accessToken = Helper.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role.name,
        roleLevel: user.role.level,
      });

      await Prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "REGISTER",
          metadata: {},
        },
      });

      return { user, accessToken };
    } catch (err) {
      console.error("Registration error", {
        email,
        error: err.message,
        stack: err.stack,
      });

      if (err instanceof ApiError) throw err;
      throw ApiError.internal("Failed to register user. Please try again.");
    } finally {
      Helper.deleteOldImage(profileImage);
    }
  }

  static async updateProfile(userId, updateData) {
    const { username, phoneNumber, firstName, lastName, email, roleId } =
      updateData;

    const currentUser = await Prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const isEmailChanged = email && email !== currentUser.email;

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

    if (roleId) {
      const roleRecord = await Prisma.role.findUnique({
        where: { id: roleId },
      });
      if (!roleRecord) throw ApiError.badRequest("Invalid role");
      formattedData.role = { connect: { id: roleRecord.id } };
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

    await Prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE_PROFILE",
        metadata: {
          updatedFields: Object.keys(updateData),
          emailChanged: isEmailChanged,
        },
      },
    });

    return updatedUser;
  }

  static async updateProfileImage(userId, profileImagePath) {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: { id: true, name: true, level: true, description: true },
          },
          wallets: true,
        },
      });

      if (!user) {
        throw ApiError.notFound("User not found");
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

      await Prisma.auditLog.create({
        data: {
          userId,
          action: "UPDATE_PROFILE_IMAGE",
          metadata: { newImage: profileImageUrl },
        },
      });

      return updatedUser;
    } finally {
      Helper.deleteOldImage(profileImagePath);
    }
  }

  static async getUserById(userId) {
    const user = await Prisma.user.findUnique({
      where: { id: userId },
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
                type: true,
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

    // Use user's role instead of parent.role
    if (user.role.name === "ADMIN") {
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
      safeUser = Helper.serializeUser(transformedUser);
    }

    return safeUser;
  }

  static async getAllUsersByRole(roleId) {
    if (!roleId) {
      console.warn("Get users by role attempted without role ID");
      throw ApiError.badRequest("roleId is required");
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

  static async getAllUsersByParentId(parentId, options = {}) {
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
      status = "ACTIVE",
      search = "",
    } = options;

    const skip = (page - 1) * limit;
    const isAll = status === "ALL";

    const adminRole = await Prisma.role.findFirst({
      where: { name: "ADMIN" },
      select: { id: true },
    });

    let queryWhere =
      parent.role?.name === "ADMIN"
        ? {
            ...(adminRole && {
              roleId: {
                not: adminRole.id,
              },
            }),
            ...(isAll ? {} : { status }),
          }
        : {
            parentId,
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
        orderBy: { createdAt: sort },
        skip,
        take: limit,
      }),
      Prisma.user.count({
        where: queryWhere,
      }),
    ]);
    let safeUsers;

    if (parent.role.name === "ADMIN") {
      safeUsers = users.map((user) => {
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
      safeUsers = users.map((user) => Helper.serializeUser(user));
    }

    return { users: safeUsers, total };
  }

  static async getAllUsersByChildrenId(userId) {
    if (!userId) {
      console.warn("Get children users attempted without user ID");
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
      console.warn("Get users count by parent attempted without parent ID");
      throw ApiError.badRequest("parentId is required");
    }

    const count = await Prisma.user.count({
      where: {
        parentId,
        status: "ACTIVE",
      },
    });

    return { count };
  }

  static async getAllUsersCountByChildrenId(userId) {
    if (!userId) {
      console.warn("Get children count attempted without user ID");
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
      },
    });

    return { count };
  }

  static async updateUserStatus(userId, status, updatedBy) {
    const user = await Prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const updatedUser = await Prisma.user.update({
      where: { id: userId },
      data: { status },
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

    await Prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: "UPDATE_USER_STATUS",
        entityType: "User",
        entityId: userId,
        metadata: {
          previousStatus: user.status,
          newStatus: status,
          updatedUserId: userId,
        },
      },
    });

    return updatedUser;
  }

  static async searchUsers(searchTerm, options = {}) {
    const { page = 1, limit = 10, roleId, status = "ACTIVE" } = options;

    const skip = (page - 1) * limit;

    const searchConditions = {
      OR: [
        { username: { contains: searchTerm, mode: "insensitive" } },
        { firstName: { contains: searchTerm, mode: "insensitive" } },
        { lastName: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { phoneNumber: { contains: searchTerm } },
      ],
      status,
    };

    if (roleId) {
      searchConditions.roleId = roleId;
    }

    const [users, total] = await Promise.all([
      Prisma.user.findMany({
        where: searchConditions,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      Prisma.user.count({ where: searchConditions }),
    ]);

    const safeUsers = users.map((user) => Helper.serializeUser(user));

    return { users: safeUsers, total };
  }

  static async getUserHierarchy(userId) {
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      select: {
        parentId: true,
        hierarchyPath: true,
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const [parent, children, siblings] = await Promise.all([
      user.parentId
        ? Prisma.user.findUnique({
            where: { id: user.parentId },
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                  description: true,
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
            },
          })
        : null,
      Prisma.user.findMany({
        where: {
          parentId: userId,
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
        },
        orderBy: { hierarchyLevel: "asc" },
      }),
      user.parentId
        ? Prisma.user.findMany({
            where: {
              parentId: user.parentId,
              id: { not: userId },
              status: "ACTIVE",
            },
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                  description: true,
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
            },
            orderBy: { createdAt: "asc" },
          })
        : [],
    ]);

    return {
      parent: parent ? Helper.serializeUser(parent) : null,
      children: children.map((child) => Helper.serializeUser(child)),
      siblings: siblings.map((sibling) => Helper.serializeUser(sibling)),
    };
  }

  static async deactivateUser(userId, deactivatedBy, reason) {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user) {
        throw ApiError.notFound("User not found");
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

      await Prisma.auditLog.create({
        data: {
          userId: deactivatedBy,
          action: "DEACTIVATE_USER",
          entityType: "User",
          metadata: {
            previousStatus: user.status,
            newStatus: "IN_ACTIVE",
            reason: reason || "No reason provided",
            deactivatedBy,
            timestamp: new Date().toISOString(),
            targetUserId: userId,
          },
        },
      });

      return updatedUser;
    } catch (error) {
      console.error("Failed to deactivate user", {
        userId,
        deactivatedBy,
        error: error.message,
        stack: error.stack,
      });

      if (error instanceof ApiError) throw error;

      if (error.code) {
        console.error("Prisma error details:", {
          code: error.code,
          meta: error.meta,
        });
      }

      throw ApiError.internal("Failed to deactivate user. Please try again.");
    }
  }

  static async reactivateUser(userId, reactivatedBy, reason) {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user) {
        throw ApiError.notFound("User not found");
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

      await Prisma.auditLog.create({
        data: {
          userId: reactivatedBy,
          action: "REACTIVATE_USER",
          entityType: "User",
          metadata: {
            previousStatus: user.status,
            newStatus: "ACTIVE",
            reason: reason || "No reason provided",
            reactivatedBy,
            timestamp: new Date().toISOString(),
            targetUserId: userId,
          },
        },
      });

      return updatedUser;
    } catch (error) {
      console.error("Failed to reactivate user", {
        userId,
        reactivatedBy,
        error: error.message,
        stack: error.stack,
      });

      if (error instanceof ApiError) throw error;

      if (error.code) {
        console.error("Prisma error details:", {
          code: error.code,
          meta: error.meta,
        });
      }

      throw ApiError.internal("Failed to reactivate user. Please try again.");
    }
  }

  static async deleteUser(userId, deletedBy, reason) {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user) {
        throw ApiError.notFound("User not found");
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

      await Prisma.auditLog.create({
        data: {
          userId: deletedBy,
          action: "DELETE_USER",
          entityType: "User",
          metadata: {
            previousStatus: user.status,
            newStatus: "DELETE",
            reason: reason || "No reason provided",
            deletedBy,
            timestamp: new Date().toISOString(),
            targetUserId: userId,
          },
        },
      });

      return updatedUser;
    } catch (error) {
      console.error("Failed to delete user", {
        userId,
        deletedBy,
        error: error.message,
        stack: error.stack,
      });

      if (error instanceof ApiError) throw error;

      if (error.code) {
        console.error("Prisma error details:", {
          code: error.code,
          meta: error.meta,
        });
      }

      throw ApiError.internal("Failed to delete user. Please try again.");
    }
  }

  static async sendCredentialsEmail(user, password, transactionPin) {
    try {
      const formattedFirstName = this.formatName(user.firstName);

      const subject = "Your Account Credentials";
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                .credentials { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4F46E5; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Our Platform!</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>${formattedFirstName}</strong>,</p>
                    
                    <p>Your account has been successfully created. Here are your login credentials:</p>
                    
                    <div class="credentials">
                        <h3>Your Account Details:</h3>
                        <p><strong>Username:</strong> ${user.username}</p>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Password:</strong> ${password}</p>
                        <p><strong>Transaction PIN:</strong> ${transactionPin}</p>
                    </div>
                    
                    <div class="warning">
                        <strong>Important Security Notice:</strong>
                        <ul>
                            <li>Keep your credentials secure and confidential</li>
                            <li>Change your password after first login</li>
                            <li>Do not share your Transaction PIN with anyone</li>
                            <li>These credentials are for your use only</li>
                        </ul>
                    </div>
                    
                    <p>You can login to your account using the above credentials.</p>
                    
                    <p>If you have any questions, please contact our support team.</p>
                    
                    <p>Best regards,<br>Support Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `;

      const text = `
        Welcome to Our Platform!

        Hello ${formattedFirstName},

        Your account has been successfully created. Here are your login credentials:

        Username: ${user.username}
        Email: ${user.email}
        Password: ${password}
        Transaction PIN: ${transactionPin}

        Important Security Notice:
        - Keep your credentials secure and confidential
        - Change your password after first login
        - Do not share your Transaction PIN with anyone
        - These credentials are for your use only

        You can login to your account using the above credentials.

        If you have any questions, please contact our support team.

        Best regards,
        Support Team

        This is an automated message. Please do not reply to this email.
      `;

      await Helper.sendEmail({
        to: user.email,
        subject,
        text,
        html,
      });

    } catch (emailError) {
      console.error("Failed to send credentials email:", {
        userId: user.id,
        email: user.email,
        error: emailError.message,
      });
    }
  }

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
        },
      });

      await this.sendCredentialsEmail(user, newPassword, newTransactionPin);

      await Prisma.auditLog.create({
        data: {
          userId,
          action: "CREDENTIALS_REGENERATED",
          metadata: {
            reason: "EMAIL_UPDATED",
            newEmail: newEmail,
          },
        },
      });
    } catch (error) {
      console.error("Error regenerating credentials:", error);
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
}

export default UserServices;
