import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { CryptoService } from "../utils/cryptoService.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";
import { sendCredentialsEmail } from "../utils/sendCredentialsEmail.js";

class EmployeeServices {
  // COMMON USER SELECT FIELDS (DRY Principle)
  static userSelectFields = {
    id: true,
    username: true,
    firstName: true,
    lastName: true,
    email: true,
    phoneNumber: true,
    profileImage: true,
    status: true,
    hierarchyLevel: true,
    hierarchyPath: true,
    createdAt: true,
    updatedAt: true,
  };

  static roleSelectFields = {
    id: true,
    name: true,
    level: true,
    description: true,
    type: true,
  };

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

    try {
      // Validate role
      const role = await this.validateEmployeeRole(roleId);

      // Check existing user
      await this.checkExistingUser({ email, phoneNumber, username });

      const generatedPassword = Helper.generatePassword();
      const hashedPassword = CryptoService.encrypt(generatedPassword);

      // Setup hierarchy
      const { hierarchyLevel, hierarchyPath } =
        await this.setupHierarchy(parentId);

      // Upload profile image
      const profileImageUrl = await this.handleProfileImageUpload(profileImage);

      const formattedFirstName = this.formatName(firstName);
      const formattedLastName = this.formatName(lastName);

      // Create user
      const user = await Prisma.user.create({
        data: {
          username,
          firstName: formattedFirstName,
          lastName: formattedLastName,
          profileImage: profileImageUrl,
          email: email.toLowerCase(),
          phoneNumber,
          password: hashedPassword,
          roleId,
          parentId,
          hierarchyLevel,
          hierarchyPath,
          status: "ACTIVE",
          deactivationReason: null,
          isKycVerified: true,
          emailVerifiedAt: new Date(),
        },
        include: {
          role: { select: this.roleSelectFields },
          parent: { select: this.userSelectFields },
        },
      });

      // Assign permissions
      if (permissions.length > 0) {
        await this.updateEmployeePermissions(
          user.id,
          permissions,
          parentId,
          "EMPLOYEE_PERMISSIONS_ASSIGNED"
        );
      }

      // Send credentials
      await this.sendEmployeeCredentials(user, generatedPassword, permissions);

      // Generate access token
      const accessToken = Helper.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role.name,
        roleLevel: user.role.level,
        permissions: permissions,
      });

      // Audit log
      // await this.createAuditLog(parentId, "EMPLOYEE_CREATED", user.id, {
      //   employeeEmail: user.email,
      //   employeeRole: user.role.name,
      //   permissionsCount: permissions.length,
      // });

      return { user, accessToken };
    } catch (error) {
      console.error("Employee registration error:", error);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Failed to create employee");
    } finally {
      if (profileImage) Helper.deleteOldImage(profileImage);
    }
  }

  // UNIFIED EMPLOYEE PERMISSIONS MANAGEMENT
  static async updateEmployeePermissions(
    employeeId,
    permissions,
    adminId,
    actionType = "EMPLOYEE_PERMISSIONS_UPDATED"
  ) {
    // Validate employee exists
    const employee = await Prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, email: true },
    });

    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    if (!Array.isArray(permissions)) {
      throw ApiError.badRequest("Permissions must be an array");
    }

    // Trim and normalize permissions
    const normalizedPermissions = permissions.map((p) => p.trim());
    const newPermissionSet = new Set(normalizedPermissions);

    // Get ALL permissions (both active and inactive) for this employee
    const allPermissions = await Prisma.employeePermission.findMany({
      where: { userId: employeeId },
    });

    const currentActivePermissions = allPermissions.filter((p) => p.isActive);
    const currentInactivePermissions = allPermissions.filter(
      (p) => !p.isActive
    );

    // Identify permissions to ACTIVATE (previously inactive, now in new set)
    const permissionsToActivate = currentInactivePermissions
      .filter((p) => newPermissionSet.has(p.permission))
      .map((p) => p.permission);

    // Identify permissions to DEACTIVATE (currently active, not in new set)
    const permissionsToDeactivate = currentActivePermissions
      .filter((p) => !newPermissionSet.has(p.permission))
      .map((p) => p.permission);

    // Identify permissions to CREATE (completely new permissions)
    const existingPermissionSet = new Set(
      allPermissions.map((p) => p.permission)
    );
    const permissionsToCreate = normalizedPermissions.filter(
      (permission) => !existingPermissionSet.has(permission)
    );

    // Use transaction for atomic operations
    await Prisma.$transaction(async (tx) => {
      // Activate previously inactive permissions
      if (permissionsToActivate.length > 0) {
        await tx.employeePermission.updateMany({
          where: {
            userId: employeeId,
            permission: { in: permissionsToActivate },
          },
          data: {
            isActive: true,
            assignedBy: adminId,
            assignedAt: new Date(),
            revokedAt: null,
          },
        });
      }

      // Deactivate permissions that are no longer in the set
      if (permissionsToDeactivate.length > 0) {
        await tx.employeePermission.updateMany({
          where: {
            userId: employeeId,
            permission: { in: permissionsToDeactivate },
          },
          data: {
            isActive: false,
            revokedAt: new Date(),
          },
        });
      }

      // Create completely new permissions
      if (permissionsToCreate.length > 0) {
        await tx.employeePermission.createMany({
          data: permissionsToCreate.map((permission) => ({
            userId: employeeId,
            permission: permission,
            assignedBy: adminId,
            assignedAt: new Date(),
            isActive: true,
          })),
          skipDuplicates: true,
        });
      }
    });

    // Create audit log
    // await this.createAuditLog(adminId, actionType, employeeId, {
    //   employeeEmail: employee.email,
    //   activated: permissionsToActivate,
    //   deactivated: permissionsToDeactivate,
    //   created: permissionsToCreate,
    //   finalPermissions: normalizedPermissions,
    //   totalPermissions: normalizedPermissions.length,
    // });

    // Get updated permissions for response
    const updatedPermissions = await this.getEmployeePermissions(employeeId);

    return {
      success: true,
      employeeId,
      employeeEmail: employee.email,
      activated: permissionsToActivate,
      deactivated: permissionsToDeactivate,
      created: permissionsToCreate,
      permissions: updatedPermissions,
      totalPermissions: updatedPermissions.length,
      message: `Permissions updated successfully. Activated: ${permissionsToActivate.length}, Deactivated: ${permissionsToDeactivate.length}, Created: ${permissionsToCreate.length}`,
    };
  }

  // GET EMPLOYEE PERMISSIONS
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
        orderBy: { assignedAt: "desc" },
      });

      return permissions.map((p) => p.permission);
    } catch (error) {
      console.error("Error fetching employee permissions:", error);
      return [];
    }
  }

  // EMPLOYEE PROFILE UPDATE
  static async updateProfile(userId, updateData, currentUserId) {
    const { username, phoneNumber, firstName, lastName, email, roleId } =
      updateData;

    const [currentUser, userToUpdate] = await Promise.all([
      Prisma.user.findUnique({
        where: { id: currentUserId },
        include: { role: { select: this.roleSelectFields } },
      }),
      Prisma.user.findUnique({
        where: { id: userId },
        include: { role: { select: this.roleSelectFields } },
      }),
    ]);

    if (!currentUser) throw ApiError.unauthorized("Current user not found");
    if (!userToUpdate) throw ApiError.notFound("Employee not found");
    if (userToUpdate.role.type !== "employee") {
      throw ApiError.badRequest("Can only update employees");
    }

    // Authorization check
    await this.authorizeEmployeeUpdate(
      currentUser,
      userToUpdate,
      userId,
      email,
      roleId
    );

    // Check unique constraints
    await this.checkUniqueConstraints(userId, { username, phoneNumber, email });

    const updatePayload = this.buildUpdatePayload(
      {
        username,
        firstName,
        lastName,
        phoneNumber,
        email,
        roleId,
      },
      currentUser.role.name === "ADMIN"
    );

    const updatedUser = await Prisma.user.update({
      where: { id: userId },
      data: updatePayload,
      include: {
        role: { select: this.roleSelectFields },
        parent: { select: this.userSelectFields },
      },
    });

    // Handle email change
    if (email && email !== userToUpdate.email) {
      await this.regenerateCredentialsAndNotify(userId, email);
    }

    // await this.createAuditLog(
    //   currentUserId,
    //   "EMPLOYEE_PROFILE_UPDATE",
    //   userId,
    //   {
    //     updatedFields: Object.keys(updateData),
    //     emailChanged: !!email,
    //   }
    // );

    return updatedUser;
  }

  // GET EMPLOYEE BY ID
  static async getEmployeeById(employeeId, currentUser) {
    const user = await Prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        EmployeePermissionsOwned: {
          where: { isActive: true },
          select: { permission: true, assignedAt: true },
        },
        role: { select: this.roleSelectFields },
        parent: { select: this.userSelectFields },
      },
    });

    if (!user) throw ApiError.notFound("Employee not found");
    if (user.role.type !== "employee") {
      throw ApiError.badRequest("User is not an employee");
    }

    return this.sanitizeUserData(user, currentUser);
  }

  // GET ALL EMPLOYEES BY PARENT ID (FIXED - Only active permissions)
  static async getAllEmployeesByParentId(parentId, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = "desc",
      status = "ALL",
      search = "",
    } = options;

    const skip = (page - 1) * limit;

    // Build query conditions
    const whereConditions = {
      parentId,
      role: { type: "employee" },
      deletedAt: null,
    };

    // Add status filter
    if (status !== "ALL") {
      whereConditions.status = status;
    }

    // Add search filter
    if (search.trim()) {
      const searchTerm = `%${search.toLowerCase()}%`;
      whereConditions.OR = [
        { username: { contains: searchTerm, mode: "insensitive" } },
        { firstName: { contains: searchTerm, mode: "insensitive" } },
        { lastName: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { phoneNumber: { contains: searchTerm } },
      ];
    }

    const [users, total] = await Promise.all([
      Prisma.user.findMany({
        where: whereConditions,
        include: {
          role: { select: this.roleSelectFields },
          parent: { select: this.userSelectFields },
          EmployeePermissionsOwned: {
            where: { isActive: true }, // ONLY ACTIVE PERMISSIONS
            select: { permission: true, isActive: true },
          },
        },
        orderBy: { createdAt: sort },
        skip,
        take: limit,
      }),
      Prisma.user.count({ where: whereConditions }),
    ]);

    const parent = await Prisma.user.findUnique({
      where: { id: parentId },
      include: { role: true },
    });

    const safeUsers = users.map((user) =>
      this.sanitizeUserData(user, { role: { name: parent.role.name } })
    );

    return {
      users: safeUsers,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    };
  }

  // PERMISSION CHECK METHODS
  static async checkPermission(userId, permission) {
    const userPermission = await Prisma.employeePermission.findFirst({
      where: {
        userId,
        permission,
        isActive: true,
      },
    });

    return !!userPermission;
  }

  static async checkPermissions(userId, permissions) {
    const userPermissions = await Prisma.employeePermission.findMany({
      where: {
        userId,
        permission: { in: permissions },
        isActive: true,
      },
      select: { permission: true },
    });

    const userPermissionSet = new Set(userPermissions.map((p) => p.permission));

    const result = {};
    permissions.forEach((permission) => {
      result[permission] = userPermissionSet.has(permission);
    });

    return {
      hasAll: permissions.every((p) => userPermissionSet.has(p)),
      hasAny: permissions.some((p) => userPermissionSet.has(p)),
      permissions: result,
      granted: Array.from(userPermissionSet),
      missing: permissions.filter((p) => !userPermissionSet.has(p)),
    };
  }

  // STATUS MANAGEMENT METHODS
  static async deactivateEmployee(employeeId, deactivatedBy, reason) {
    return this.updateEmployeeStatus(
      employeeId,
      deactivatedBy,
      "IN_ACTIVE",
      "EMPLOYEE_DEACTIVATED",
      reason
    );
  }

  static async reactivateEmployee(employeeId, reactivatedBy, reason) {
    return this.updateEmployeeStatus(
      employeeId,
      reactivatedBy,
      "ACTIVE",
      "EMPLOYEE_REACTIVATED",
      reason
    );
  }

  // HELPER METHODS
  static async validateEmployeeRole(roleId) {
    const role = await Prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw ApiError.badRequest("Invalid roleId");
    if (role.type !== "employee") {
      throw ApiError.badRequest("Only employee type roles can be assigned");
    }
    return role;
  }

  static async checkExistingUser({ email, phoneNumber, username }) {
    const existingUser = await Prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }, { username }],
      },
    });

    if (existingUser) {
      throw ApiError.badRequest("Employee already exists");
    }
  }

  static async setupHierarchy(parentId) {
    if (!parentId) return { hierarchyLevel: 0, hierarchyPath: "" };

    const parent = await Prisma.user.findUnique({
      where: { id: parentId },
      include: { role: true },
    });

    if (!parent) throw ApiError.badRequest("Invalid parentId");
    if (parent.role.name !== "ADMIN") {
      throw ApiError.forbidden("Only admin users can create employees");
    }

    return {
      hierarchyLevel: parent.hierarchyLevel + 1,
      hierarchyPath: parent.hierarchyPath
        ? `${parent.hierarchyPath}/${parentId}`
        : `${parentId}`,
    };
  }

  static async handleProfileImageUpload(profileImage) {
    if (!profileImage) return "";

    try {
      return (await S3Service.upload(profileImage, "profile")) ?? "";
    } catch (uploadErr) {
      console.warn("Profile image upload failed:", uploadErr);
      return "";
    }
  }

  static async sendEmployeeCredentials(user, password, permissions) {
    await sendCredentialsEmail(
      user,
      password,
      null,
      "created",
      `Your employee account has been created by admin. You have been assigned the role: ${user.role.name}`,
      "employee",
      {
        role: user.role.name,
        permissions: permissions,
      }
    );
  }

  // static async createAuditLog(userId, action, entityId, metadata = {}) {
  //   await Prisma.auditLog.create({
  //     data: {
  //       userId,
  //       action,
  //       entityType: "User",
  //       entityId,
  //       metadata,
  //     },
  //   });
  // }

  static async authorizeEmployeeUpdate(
    currentUser,
    userToUpdate,
    userId,
    email,
    roleId
  ) {
    const isAdmin = currentUser.role.name === "ADMIN";
    const isUpdatingOwnProfile = userId === currentUser.id;

    if (!isUpdatingOwnProfile && !isAdmin) {
      const canUpdate = await this.checkPermission(
        currentUser.id,
        "UPDATE_EMPLOYEE"
      );
      if (!canUpdate) {
        throw ApiError.forbidden(
          "You don't have permission to update this employee"
        );
      }
    }

    if (email && email !== userToUpdate.email && !isAdmin) {
      const permissionCheck = await this.checkPermissions(currentUser.id, [
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
  }

  static async checkUniqueConstraints(userId, fields) {
    const { username, phoneNumber, email } = fields;
    const conditions = [];

    if (username) conditions.push({ username });
    if (phoneNumber) conditions.push({ phoneNumber });
    if (email) conditions.push({ email });

    if (conditions.length === 0) return;

    const existingUser = await Prisma.user.findFirst({
      where: {
        AND: [{ id: { not: userId } }, { OR: conditions }],
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

  static buildUpdatePayload(fields, isAdmin) {
    const { username, firstName, lastName, phoneNumber, email, roleId } =
      fields;
    const payload = {};

    if (username) payload.username = username.trim();
    if (firstName) payload.firstName = this.formatName(firstName);
    if (lastName) payload.lastName = this.formatName(lastName);
    if (phoneNumber) payload.phoneNumber = phoneNumber;
    if (email) payload.email = email.trim().toLowerCase();
    if (roleId && isAdmin) payload.roleId = roleId;

    return payload;
  }

  static sanitizeUserData(user, currentUser) {
    const serialized = Helper.serializeUser(user);

    if (currentUser.role.name === "ADMIN") {
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

    if (currentUser.role.name === "EMPLOYEE" && user.id === currentUser.id) {
      const { password, transactionPin, refreshToken, ...safeData } =
        serialized;
      return safeData;
    }

    throw ApiError.forbidden("Access denied to employee data");
  }

  static async updateEmployeeStatus(
    employeeId,
    changedBy,
    status,
    action,
    reason
  ) {
    const [user, changer] = await Promise.all([
      Prisma.user.findUnique({
        where: { id: employeeId },
        include: { role: true },
      }),
      Prisma.user.findUnique({
        where: { id: changedBy },
        include: { role: true },
      }),
    ]);

    if (!user) throw ApiError.notFound("Employee not found");
    if (user.role.type !== "employee") {
      throw ApiError.badRequest(
        `Can only ${action.toLowerCase().split("_")[1]} employees`
      );
    }
    if (!changer || changer.role.name !== "ADMIN") {
      throw ApiError.forbidden(
        `Only administrators can ${action.toLowerCase().split("_")[1]} employees`
      );
    }

    if (user.status === status) {
      throw ApiError.badRequest(
        `Employee is already ${status === "ACTIVE" ? "active" : "deactivated"}`
      );
    }

    const updatedUser = await Prisma.user.update({
      where: { id: employeeId },
      data: {
        status,
        deactivationReason: reason,
        updatedAt: new Date(),
      },
      include: {
        role: { select: this.roleSelectFields },
        parent: { select: this.userSelectFields },
      },
    });

    // await this.createAuditLog(changedBy, action, employeeId, {
    //   previousStatus: user.status,
    //   newStatus: status,
    //   reason: reason || "No reason provided",
    // });

    return updatedUser;
  }

  static async regenerateCredentialsAndNotify(userId, newEmail) {
    const generatedPassword = Helper.generatePassword();
    const hashedPassword = CryptoService.encrypt(generatedPassword);

    const user = await Prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        email: newEmail,
      },
      include: { role: true },
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
