import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { CryptoService } from "../utils/cryptoService.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";
import { sendCredentialsEmail } from "../utils/sendCredentialsEmail.js";

class EmployeeServices {
  // EMPLOYEE REGISTRATION
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
      permissions = [],
    } = payload;

    let profileImageUrl = "";

    try {
      // Check if role exists and is of type "employee"
      const role = await Prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw ApiError.badRequest("Invalid roleId");
      }

      if (role.type !== "employee") {
        throw ApiError.badRequest("Only employee type roles can be assigned");
      }

      const existingUser = await Prisma.user.findFirst({
        where: {
          OR: [{ email }, { phoneNumber }, { username }],
        },
      });

      if (existingUser) {
        throw ApiError.badRequest("Employee already exists");
      }

      const generatedPassword = Helper.generatePassword();
      const hashedPassword = CryptoService.encrypt(generatedPassword);

      let hierarchyLevel = 0;
      let hierarchyPath = "";

      if (parentId) {
        const parent = await Prisma.user.findUnique({
          where: { id: parentId },
          include: { role: true },
        });

        if (!parent) throw ApiError.badRequest("Invalid parentId");

        // Check if parent is ADMIN or has permission to create employees
        if (parent.role.name !== "ADMIN") {
          throw ApiError.forbidden("Only admin users can create employees");
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

      const user = await Prisma.user.create({
        data: {
          username,
          firstName: formattedFirstName,
          lastName: formattedLastName,
          profileImage: profileImageUrl,
          email,
          phoneNumber,
          password: hashedPassword,
          roleId,
          parentId,
          hierarchyLevel,
          hierarchyPath,
          status: "ACTIVE",
          deactivationReason: null,
          isKycVerified: true, // Employees are KYC verified by default
          refreshToken: null,
          passwordResetToken: null,
          passwordResetExpires: null,
          emailVerificationToken: null,
          emailVerifiedAt: new Date(),
          emailVerificationTokenExpires: null,
        },
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
          parent: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
              role: {
                select: {
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (permissions && permissions.length > 0) {
        await this.assignPermissionsToEmployee(user.id, permissions, parentId);
      }

      // Send employee-specific credentials email
      await sendCredentialsEmail(
        user,
        generatedPassword,
        null, // No transaction pin for employees
        "created",
        `Your employee account has been created by admin. You have been assigned the role: ${user.role.name}`,
        "employee",
        {
          role: user.role.name,
          permissions: permissions,
        }
      );

      const accessToken = Helper.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role.name,
        roleLevel: user.role.level,
        permissions: permissions,
      });

      // Audit log for employee creation
      await Prisma.auditLog.create({
        data: {
          userId: parentId,
          action: "EMPLOYEE_CREATED",
          entityType: "User",
          entityId: user.id,
          metadata: {
            employeeEmail: user.email,
            employeeRole: user.role.name,
            permissions: permissions,
            permissionsCount: permissions.length,
            isKycVerified: true,
            hasWallet: false,
            createdBy: parentId,
          },
        },
      });

      return { user, accessToken };
    } catch (err) {
      console.error("Employee registration error", {
        email,
        error: err.message,
        stack: err.stack,
      });

      if (err instanceof ApiError) throw err;
      throw ApiError.internal("Failed to create employee. Please try again.");
    } finally {
      Helper.deleteOldImage(profileImage);
    }
  }

  // EMPLOYEE PERMISSIONS MANAGEMENT
  static async assignPermissionsToEmployee(
    employeeId,
    permissions,
    assignedBy
  ) {
    try {
      if (!Array.isArray(permissions)) {
        throw ApiError.badRequest("Permissions must be an array");
      }

      const uniquePermissions = [...new Set(permissions)];

      const permissionRecords = uniquePermissions.map((permission) => ({
        userId: employeeId,
        permission: permission.trim(),
        assignedBy: assignedBy,
        assignedAt: new Date(),
        isActive: true,
      }));

      await Prisma.employeePermission.createMany({
        data: permissionRecords,
        skipDuplicates: true,
      });

      await Prisma.auditLog.create({
        data: {
          userId: assignedBy,
          action: "EMPLOYEE_PERMISSIONS_ASSIGNED",
          entityType: "User",
          entityId: employeeId,
          metadata: {
            permissions: uniquePermissions,
            permissionsCount: uniquePermissions.length,
            assignedTo: employeeId,
          },
        },
      });

      return uniquePermissions;
    } catch (error) {
      console.error("Error assigning permissions to employee:", error);
      throw ApiError.internal("Failed to assign permissions to employee");
    }
  }

  static async updateEmployeePermissions(employeeId, permissions, adminId) {
    try {
      // Get current permissions
      const currentPermissions = await Prisma.employeePermission.findMany({
        where: { userId: employeeId, isActive: true },
      });

      const currentPermissionSet = new Set(
        currentPermissions.map((p) => p.permission)
      );
      const newPermissionSet = new Set(permissions);

      const permissionsToAdd = permissions.filter(
        (permission) => !currentPermissionSet.has(permission)
      );
      const permissionsToRemove = currentPermissions
        .filter((permission) => !newPermissionSet.has(permission.permission))
        .map((p) => p.permission);

      // Add new permissions
      if (permissionsToAdd.length > 0) {
        const permissionRecords = permissionsToAdd.map((permission) => ({
          userId: employeeId,
          permission: permission.trim(),
          assignedBy: adminId,
          assignedAt: new Date(),
          isActive: true,
        }));

        await Prisma.employeePermission.createMany({
          data: permissionRecords,
          skipDuplicates: true,
        });
      }

      // Remove old permissions
      if (permissionsToRemove.length > 0) {
        await Prisma.employeePermission.updateMany({
          where: {
            userId: employeeId,
            permission: { in: permissionsToRemove },
          },
          data: { isActive: false },
        });
      }

      await Prisma.auditLog.create({
        data: {
          userId: adminId,
          action: "EMPLOYEE_PERMISSIONS_UPDATED",
          entityType: "User",
          entityId: employeeId,
          metadata: {
            added: permissionsToAdd,
            removed: permissionsToRemove,
            finalPermissions: permissions,
            updatedBy: adminId,
          },
        },
      });

      return {
        added: permissionsToAdd,
        removed: permissionsToRemove,
        finalPermissions: permissions,
      };
    } catch (error) {
      console.error("Error updating employee permissions:", error);
      throw ApiError.internal("Failed to update employee permissions");
    }
  }

  // EMPLOYEE PROFILE UPDATE
  static async updateProfile(userId, updateData, currentUserId) {
    const { username, phoneNumber, firstName, lastName, email, roleId } =
      updateData;

    const currentUser = await Prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        role: {
          select: { name: true, level: true, type: true },
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
      throw ApiError.notFound("Employee to update not found");
    }

    // Ensure it's an employee
    if (userToUpdate.role.type !== "employee") {
      throw ApiError.badRequest("Can only update employees");
    }

    const isAdmin = currentUser.role.name === "ADMIN";
    const isUpdatingOwnProfile = userId === currentUserId;

    const canUpdateEmployee = await this.checkEmployeeUpdatePermission(
      currentUser,
      userToUpdate
    );

    if (!canUpdateEmployee && !isUpdatingOwnProfile) {
      throw ApiError.forbidden(
        "You don't have permission to update this employee"
      );
    }

    const isEmailChanged = email && email !== userToUpdate.email;
    if (isEmailChanged && !isAdmin) {
      const permissionCheck = await this.checkPermissions(currentUserId, [
        "UPDATE_EMPLOYEE_EMAIL",
        "FULL_EMPLOYEE_ACCESS",
      ]);
      if (!permissionCheck.hasAny) {
        throw ApiError.forbidden(
          "You don't have permission to update email addresses"
        );
      }
    }

    if (roleId && !isAdmin) {
      throw ApiError.forbidden("Only administrators can change employee roles");
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
      if (roleRecord.type !== "employee") {
        throw ApiError.badRequest("Can only assign employee roles");
      }
      formattedData.roleId = roleRecord.id;
    }

    const updatedUser = await Prisma.user.update({
      where: { id: userId },
      data: formattedData,
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
    });

    if (isEmailChanged) {
      await this.regenerateCredentialsAndNotify(userId, email);
    }

    await Prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: "EMPLOYEE_PROFILE_UPDATE",
        entityType: "User",
        entityId: userId,
        metadata: {
          updatedFields: Object.keys(updateData),
          emailChanged: isEmailChanged,
          isAdmin: isAdmin,
          isOwnProfile: isUpdatingOwnProfile,
        },
      },
    });

    return updatedUser;
  }

  // EMPLOYEE PROFILE IMAGE UPDATE
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
        },
      });

      if (!user) {
        throw ApiError.notFound("Employee not found");
      }

      // Ensure it's an employee
      if (user.role.type !== "employee") {
        throw ApiError.badRequest("Can only update employee profile images");
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
            select: {
              id: true,
              name: true,
              level: true,
              description: true,
              type: true,
            },
          },
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
      });

      await Prisma.auditLog.create({
        data: {
          userId,
          action: "EMPLOYEE_PROFILE_IMAGE_UPDATE",
          metadata: { newImage: profileImageUrl },
        },
      });

      return updatedUser;
    } finally {
      Helper.deleteOldImage(profileImagePath);
    }
  }

  // GET EMPLOYEE BY ID
  static async getEmployeeById(employeeId, currentUser) {
    const user = await Prisma.user.findUnique({
      where: { id: employeeId },
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
    });

    if (!user) {
      throw ApiError.notFound("Employee not found");
    }

    // Ensure it's an employee
    if (user.role.type !== "employee") {
      throw ApiError.badRequest("User is not an employee");
    }

    const currentUserRole = currentUser.role;
    const currentUserId = currentUser.id;

    if (currentUserRole === "ADMIN") {
      const serialized = Helper.serializeUser(user);

      if (serialized.password) {
        try {
          serialized.password = CryptoService.decrypt(serialized.password);
        } catch {
          serialized.password = "Error decrypting";
        }
      }

      const { transactionPin, refreshToken, ...safeData } = serialized;

      return safeData;
    }

    if (currentUserRole === "EMPLOYEE") {
      if (user.id === currentUserId) {
        const { password, transactionPin, refreshToken, ...safeData } = user;

        return safeData; // Employee can access their own profile
      }
      throw ApiError.forbidden("You can only access your own profile");
    }

    throw ApiError.forbidden("Access denied to employee data");
  }

  // GET ALL EMPLOYEES BY PARENT ID
  static async getAllEmployeesByParentId(parentId, options = {}) {
    try {
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

      let queryWhere = {
        parentId: parentId,
        role: {
          type: "employee",
        },
        deletedAt: null,
      };

      if (!isAll && status) {
        queryWhere.status = status;
      }

      if (search && search.trim() !== "") {
        const searchTerm = search.toLowerCase();

        queryWhere.OR = [
          {
            username: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            firstName: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            phoneNumber: {
              contains: searchTerm,
            },
          },
        ];
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

          const { transactionPin, refreshToken, ...safeUser } = serialized;
          return safeUser;
        });
      } else {
        safeUsers = users.map((user) => {
          const serialized = Helper.serializeUser(user);
          const { password, transactionPin, refreshToken, ...safeUser } =
            serialized;
          return safeUser;
        });
      }

      return {
        users: safeUsers,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      };
    } catch (error) {
      console.error("Error fetching employees by parent ID:", error);
      throw error;
    }
  }

  // EMPLOYEE PERMISSIONS
  static async getEmployeePermissions(employeeId) {
    try {
      const permissions = await Prisma.employeePermission.findMany({
        where: {
          userId: employeeId,
          isActive: true,
        },
        select: {
          permission: true,
          assignedAt: true,
          assigner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
      });

      return permissions.map((p) => p.permission);
    } catch (error) {
      console.error("Error fetching employee permissions:", error);
      return [];
    }
  }

  static async checkPermission(userId, permission) {
    const userPermission = await Prisma.employeePermission.findFirst({
      where: {
        userId: userId,
        permission: permission,
        isActive: true,
      },
    });

    return !!userPermission;
  }

  static async checkPermissions(userId, permissions) {
    try {
      const userPermissions = await Prisma.employeePermission.findMany({
        where: {
          userId: userId,
          permission: { in: permissions },
          isActive: true,
        },
        select: { permission: true },
      });

      const userPermissionSet = new Set(
        userPermissions.map((p) => p.permission)
      );

      const result = {};
      const hasAll = permissions.every((permission) =>
        userPermissionSet.has(permission)
      );
      const hasAny = permissions.some((permission) =>
        userPermissionSet.has(permission)
      );

      permissions.forEach((permission) => {
        result[permission] = userPermissionSet.has(permission);
      });

      return {
        hasAll,
        hasAny,
        permissions: result,
        granted: Array.from(userPermissionSet),
        missing: permissions.filter((p) => !userPermissionSet.has(p)),
      };
    } catch (error) {
      console.error("Error checking permissions:", error);
      return {
        hasAll: false,
        hasAny: false,
        permissions: {},
        granted: [],
        missing: permissions,
      };
    }
  }

  // EMPLOYEE DEACTIVATION
  static async deactivateEmployee(employeeId, deactivatedBy, reason) {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: employeeId },
        include: { role: true },
      });

      if (!user) {
        throw ApiError.notFound("Employee not found");
      }

      // Ensure it's an employee
      if (user.role.type !== "employee") {
        throw ApiError.badRequest("Can only deactivate employees");
      }

      if (user.status === "IN_ACTIVE") {
        throw ApiError.badRequest("Employee is already deactivated");
      }

      const deactivator = await Prisma.user.findUnique({
        where: { id: deactivatedBy },
        include: { role: true },
      });

      if (!deactivator) {
        throw ApiError.unauthorized("Invalid deactivator user");
      }

      const isAdmin = deactivator.role.name === "ADMIN";
      if (!isAdmin) {
        throw ApiError.forbidden(
          "Only administrators can deactivate employees"
        );
      }

      const updatedUser = await Prisma.user.update({
        where: { id: employeeId },
        data: {
          status: "IN_ACTIVE",
          deactivationReason: reason,
          updatedAt: new Date(),
        },
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
      });

      await Prisma.auditLog.create({
        data: {
          userId: deactivatedBy,
          action: "EMPLOYEE_DEACTIVATED",
          entityType: "User",
          metadata: {
            previousStatus: user.status,
            newStatus: "IN_ACTIVE",
            reason: reason || "No reason provided",
            deactivatedBy,
            timestamp: new Date().toISOString(),
            targetEmployeeId: employeeId,
          },
        },
      });

      return updatedUser;
    } catch (error) {
      console.error("Failed to deactivate employee", {
        employeeId,
        deactivatedBy,
        error: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        "Failed to deactivate employee. Please try again."
      );
    }
  }

  // EMPLOYEE REACTIVATION
  static async reactivateEmployee(employeeId, reactivatedBy, reason) {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: employeeId },
        include: { role: true },
      });

      if (!user) {
        throw ApiError.notFound("Employee not found");
      }

      // Ensure it's an employee
      if (user.role.type !== "employee") {
        throw ApiError.badRequest("Can only reactivate employees");
      }

      if (user.status === "DELETE") {
        throw ApiError.badRequest("Cannot reactivate a deleted employee");
      }

      if (user.status === "ACTIVE") {
        throw ApiError.badRequest("Employee is already active");
      }

      const activator = await Prisma.user.findUnique({
        where: { id: reactivatedBy },
        include: { role: true },
      });

      if (!activator) {
        throw ApiError.unauthorized("Invalid activator user");
      }

      const isAdmin = activator.role.name === "ADMIN";
      if (!isAdmin) {
        throw ApiError.forbidden(
          "Only administrators can reactivate employees"
        );
      }

      const updatedUser = await Prisma.user.update({
        where: { id: employeeId },
        data: {
          status: "ACTIVE",
          deactivationReason: reason,
          updatedAt: new Date(),
        },
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
      });

      await Prisma.auditLog.create({
        data: {
          userId: reactivatedBy,
          action: "EMPLOYEE_REACTIVATED",
          entityType: "User",
          metadata: {
            previousStatus: user.status,
            newStatus: "ACTIVE",
            reason: reason || "No reason provided",
            reactivatedBy,
            timestamp: new Date().toISOString(),
            targetEmployeeId: employeeId,
          },
        },
      });

      return updatedUser;
    } catch (error) {
      console.error("Failed to reactivate employee", {
        employeeId,
        reactivatedBy,
        error: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        "Failed to reactivate employee. Please try again."
      );
    }
  }

  // EMPLOYEE PERMANENT DELETE
  static async deleteEmployee(employeeId, deletedBy, reason) {
    try {
      const user = await Prisma.user.findUnique({
        where: { id: employeeId },
        include: { role: true },
      });

      if (!user) {
        throw ApiError.notFound("Employee not found");
      }

      // Ensure it's an employee
      if (user.role.type !== "employee") {
        throw ApiError.badRequest("Can only delete employees");
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
        throw ApiError.forbidden("Only ADMIN can delete employees");
      }

      // PERMANENT DELETE - not soft delete
      await Prisma.auditLog.create({
        data: {
          userId: deletedBy,
          action: "EMPLOYEE_DELETED",
          entityType: "User",
          metadata: {
            previousStatus: user.status,
            reason: reason || "No reason provided",
            deletedBy,
            timestamp: new Date().toISOString(),
            targetEmployeeId: employeeId,
          },
        },
      });

      // Delete related records
      await Prisma.employeePermission.deleteMany({
        where: { userId: employeeId },
      });

      await Prisma.auditLog.deleteMany({
        where: { userId: employeeId },
      });

      // Finally delete the employee
      await Prisma.user.delete({
        where: { id: employeeId },
      });

      return { message: "Employee permanently deleted" };
    } catch (error) {
      console.error("Failed to delete employee", error);
      throw error;
    }
  }

  // HELPER METHODS
  static async checkEmployeeUpdatePermission(currentUser, employeeToUpdate) {
    if (currentUser.role.name === "ADMIN") {
      return true;
    }

    // Check if current user has permission to update employees
    const hasPermission = await this.checkPermission(
      currentUser.id,
      "UPDATE_EMPLOYEE"
    );

    return hasPermission;
  }

  static async regenerateCredentialsAndNotify(userId, newEmail) {
    try {
      const generatedPassword = Helper.generatePassword();
      const hashedPassword = CryptoService.encrypt(generatedPassword);

      const user = await Prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          email: newEmail,
        },
        include: {
          role: true,
        },
      });

      const permissions = await this.getEmployeePermissions(userId);

      await sendCredentialsEmail(
        user,
        generatedPassword,
        null,
        "updated",
        `Your employee account credentials have been updated. Here are your new login credentials.`,
        "employee",
        {
          role: user.role.name,
          permissions: permissions,
        }
      );

      return user;
    } catch (error) {
      console.error("Error regenerating employee credentials:", error);
      throw ApiError.internal("Failed to update employee credentials");
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

export default EmployeeServices;
