import models from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import { CryptoService } from "../utils/cryptoService.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";
import { sendCredentialsEmail } from "../utils/sendCredentialsEmail.js";
import AuditService from "./audit.service.js";
import PermissionRegistry from "../utils/PermissionRegistry.js";

class EmployeeServices {
  // EMPLOYEE REGISTRATION
  static async register(payload, req = null) {
    const {
      username,
      firstName,
      lastName,
      profileImage,
      email,
      phoneNumber,
      departmentId,
      permissions = [],
      parentId,
    } = payload;

    try {
      // Check existing employee
      await this.checkExistingEmployee({ email, phoneNumber, username });

      const generatedPassword = Helper.generatePassword();
      const hashedPassword = CryptoService.encrypt(generatedPassword);

      // Setup hierarchy
      const { hierarchyLevel, hierarchyPath } =
        await this.setupHierarchy(parentId);

      // Upload profile image
      const profileImageUrl = await this.handleProfileImageUpload(profileImage);

      const formattedFirstName = this.formatName(firstName);
      const formattedLastName = this.formatName(lastName);

      // Create employee
      const employee = await models.Employee.create({
        username,
        firstName: formattedFirstName,
        lastName: formattedLastName,
        profileImage: profileImageUrl,
        email: email.toLowerCase(),
        phoneNumber,
        password: hashedPassword,
        departmentId,
        hierarchyLevel,
        hierarchyPath,
        status: "ACTIVE",
        createdByType: "ADMIN",
        createdById: parentId,
      });

      // Assign permissions
      if (permissions.length > 0) {
        await this.assignEmployeePermissions(
          employee.id,
          permissions,
          parentId
        );
      }

      // Send credentials
      await this.sendEmployeeCredentials(
        employee,
        generatedPassword,
        permissions
      );

      // Generate access token
      const accessToken = Helper.generateAccessToken({
        id: employee.id,
        email: employee.email,
        userType: "employee",
        permissions: permissions,
      });

      await AuditService.createLog({
        action: "EMPLOYEE_CREATED",
        entity: "EMPLOYEE",
        entityId: employee.id,
        performedById: parentId,
        performedByType: "USER",
        description: "Employee created successfully",
        metadata: {
          employeeEmail: employee.email,
          permissionsCount: permissions.length,
          createdBy: parentId,
        },
      });

      return { user: employee, accessToken };
    } catch (error) {
      console.error("Employee registration error:", error);

      if (error instanceof ApiError) throw error;

      await AuditService.createLog({
        action: "EMPLOYEE_CREATION_FAILED",
        entity: "EMPLOYEE",
        performedById: parentId,
        performedByType: "USER",
        description: "Employee creation failed",
        metadata: {
          reason: "UNKNOWN_ERROR",
          error: error.message,
        },
      });

      throw ApiError.internal("Failed to create employee");
    } finally {
      if (profileImage) Helper.deleteOldImage(profileImage);
    }
  }

  // UPDATE EMPLOYEE PERMISSIONS
  static async updateEmployeePermissions(employeeId, permissions, adminId) {
    const employee = await models.Employee.findByPk(employeeId);
    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    if (!Array.isArray(permissions)) {
      throw ApiError.badRequest("Permissions must be an array");
    }

    // Validate permissions
    const invalidPermissions = permissions.filter(
      (p) => !PermissionRegistry.isValid(p)
    );
    if (invalidPermissions.length > 0) {
      throw ApiError.badRequest(
        `Invalid permissions: ${invalidPermissions.join(", ")}`
      );
    }

    // Get current permissions
    const currentPermissions = await models.EmployeePermission.findAll({
      where: { employeeId, isActive: true },
    });

    const currentPermissionSet = new Set(
      currentPermissions.map((p) => p.permission)
    );
    const newPermissionSet = new Set(permissions);

    // Identify changes
    const permissionsToAdd = permissions.filter(
      (p) => !currentPermissionSet.has(p)
    );
    const permissionsToRemove = currentPermissions
      .filter((p) => !newPermissionSet.has(p.permission))
      .map((p) => p.permission);

    // Use transaction
    const transaction = await models.sequelize.transaction();

    try {
      // Deactivate removed permissions
      if (permissionsToRemove.length > 0) {
        await models.EmployeePermission.update(
          { isActive: false, revokedAt: new Date() },
          {
            where: {
              employeeId,
              permission: permissionsToRemove,
            },
            transaction,
          }
        );
      }

      // Add new permissions
      if (permissionsToAdd.length > 0) {
        const permissionRecords = permissionsToAdd.map((permission) => ({
          employeeId,
          permission,
          createdByType: "ADMIN",
          createdById: adminId,
          isActive: true,
          assignedAt: new Date(),
        }));

        await models.EmployeePermission.bulkCreate(permissionRecords, {
          transaction,
        });
      }

      await transaction.commit();

      await AuditService.createLog({
        action: "EMPLOYEE_PERMISSIONS_UPDATED",
        entity: "EMPLOYEE",
        entityId: employeeId,
        performedById: adminId,
        performedByType: "USER",
        description: "Employee permissions updated",
        metadata: {
          added: permissionsToAdd,
          removed: permissionsToRemove,
          finalPermissions: permissions,
          totalPermissions: permissions.length,
        },
      });

      return {
        success: true,
        employeeId,
        added: permissionsToAdd,
        removed: permissionsToRemove,
        permissions,
        totalPermissions: permissions.length,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // GET EMPLOYEE PERMISSIONS
  static async getEmployeePermissions(employeeId) {
    const permissions = await models.EmployeePermission.findAll({
      where: { employeeId, isActive: true },
      attributes: ["permission"],
    });

    return permissions.map((p) => p.permission);
  }

  // EMPLOYEE PROFILE UPDATE
  static async updateProfile(employeeId, updateData, currentUserId) {
    const { username, phoneNumber, firstName, lastName, email } = updateData;

    const [currentUser, employee] = await Promise.all([
      models.User.findByPk(currentUserId),
      models.Employee.findByPk(employeeId),
    ]);

    if (!currentUser || !employee) {
      throw ApiError.notFound("User not found");
    }

    // Check unique constraints
    await this.checkUniqueConstraints(employeeId, {
      username,
      phoneNumber,
      email,
    });

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

    const [_, [updatedEmployee]] = await models.Employee.update(updatePayload, {
      where: { id: employeeId },
      returning: true,
    });

    await AuditService.createLog({
      action: "EMPLOYEE_PROFILE_UPDATED",
      entity: "EMPLOYEE",
      entityId: employeeId,
      performedById: currentUserId,
      performedByType: "USER",
      description: "Employee profile updated",
      metadata: { updatedFields },
    });

    return updatedEmployee;
  }

  // GET EMPLOYEE BY ID
  static async getEmployeeById(employeeId, currentUser = null) {
    const employee = await models.Employee.findByPk(employeeId, {
      include: [
        { model: models.Department, as: "department" },
        {
          model: models.EmployeePermission,
          as: "employeePermissions",
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!employee) throw ApiError.notFound("Employee not found");

    return this.sanitizeEmployeeData(employee, currentUser);
  }

  // GET ALL EMPLOYEES BY PARENT ID
  static async getAllEmployeesByParentId(parentId, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = "desc",
      status = "ALL",
      search = "",
    } = options;

    const offset = (page - 1) * limit;

    const whereConditions = {
      createdById: parentId,
      ...(status !== "ALL" ? { status } : {}),
    };

    if (search.trim()) {
      const searchTerm = `%${search.toLowerCase()}%`;
      whereConditions[models.Sequelize.Op.or] = [
        { username: { [models.Sequelize.Op.iLike]: searchTerm } },
        { firstName: { [models.Sequelize.Op.iLike]: searchTerm } },
        { lastName: { [models.Sequelize.Op.iLike]: searchTerm } },
        { email: { [models.Sequelize.Op.iLike]: searchTerm } },
        { phoneNumber: { [models.Sequelize.Op.iLike]: searchTerm } },
      ];
    }

    const { count, rows: employees } = await models.Employee.findAndCountAll({
      where: whereConditions,
      include: [
        { model: models.Department, as: "department" },
        {
          model: models.EmployeePermission,
          as: "employeePermissions",
          where: { isActive: true },
          required: false,
        },
      ],
      order: [["createdAt", sort === "desc" ? "DESC" : "ASC"]],
      offset,
      limit,
    });

    const safeEmployees = employees.map((employee) =>
      this.sanitizeEmployeeData(employee)
    );

    return {
      users: safeEmployees,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
    };
  }

  // EMPLOYEE STATUS MANAGEMENT
  static async deactivateEmployee(employeeId, deactivatedBy, reason) {
    return this.updateEmployeeStatus(
      employeeId,
      deactivatedBy,
      "INACTIVE",
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

  // DELETE EMPLOYEE
  static async deleteEmployee(employeeId, deletedBy, reason) {
    const employee = await models.Employee.findByPk(employeeId);
    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    const deleter = await models.User.findByPk(deletedBy);
    if (!deleter) {
      throw ApiError.unauthorized("Invalid deleter user");
    }

    // Use transaction for deletion
    const transaction = await models.sequelize.transaction();

    try {
      // Delete permissions first
      await models.EmployeePermission.destroy({
        where: { employeeId },
        transaction,
      });

      // Delete profile image from S3 if exists
      if (employee.profileImage) {
        try {
          await S3Service.delete({ fileUrl: employee.profileImage });
        } catch (s3Error) {
          console.warn("Failed to delete profile image from S3:", s3Error);
        }
      }

      // Delete employee
      await models.Employee.destroy({
        where: { id: employeeId },
        transaction,
      });

      await transaction.commit();

      await AuditService.createLog({
        action: "EMPLOYEE_DELETED",
        entity: "EMPLOYEE",
        entityId: employeeId,
        performedById: deletedBy,
        performedByType: "USER",
        description: "Employee permanently deleted",
        metadata: {
          reason: reason || "No reason provided",
          employeeEmail: employee.email,
        },
      });

      return {
        success: true,
        message: "Employee permanently deleted successfully",
        deletedEmployee: {
          id: employee.id,
          email: employee.email,
          username: employee.username,
        },
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // PERMISSION CHECK METHODS
  static async checkPermission(employeeId, permission) {
    const employeePermission = await models.EmployeePermission.findOne({
      where: {
        employeeId,
        permission,
        isActive: true,
      },
    });

    return !!employeePermission;
  }

  static async checkPermissions(employeeId, permissions) {
    const employeePermissions = await models.EmployeePermission.findAll({
      where: {
        employeeId,
        permission: { [models.Sequelize.Op.in]: permissions },
        isActive: true,
      },
      attributes: ["permission"],
    });

    const permissionSet = new Set(employeePermissions.map((p) => p.permission));

    const result = {};
    permissions.forEach((permission) => {
      result[permission] = permissionSet.has(permission);
    });

    return {
      hasAll: permissions.every((p) => permissionSet.has(p)),
      hasAny: permissions.some((p) => permissionSet.has(p)),
      permissions: result,
      granted: Array.from(permissionSet),
      missing: permissions.filter((p) => !permissionSet.has(p)),
    };
  }

  // HELPER METHODS
  static async checkExistingEmployee({ email, phoneNumber, username }) {
    const existingEmployee = await models.Employee.findOne({
      where: {
        [models.Sequelize.Op.or]: [{ email }, { phoneNumber }, { username }],
      },
    });

    if (existingEmployee) {
      throw ApiError.badRequest("Employee already exists");
    }
  }

  static async setupHierarchy(parentId) {
    if (!parentId) return { hierarchyLevel: 0, hierarchyPath: "" };

    const parent = await models.User.findByPk(parentId);
    if (!parent) {
      throw ApiError.badRequest("Invalid parent user");
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

  static async assignEmployeePermissions(employeeId, permissions, adminId) {
    const permissionRecords = permissions.map((permission) => ({
      employeeId,
      permission,
      createdByType: "ADMIN",
      createdById: adminId,
      isActive: true,
      assignedAt: new Date(),
    }));

    await models.EmployeePermission.bulkCreate(permissionRecords);
  }

  static async sendEmployeeCredentials(employee, password, permissions) {
    await sendCredentialsEmail(
      employee,
      password,
      null,
      "created",
      "Your employee account has been created.",
      "employee",
      {
        permissions: permissions,
      }
    );
  }

  static async checkUniqueConstraints(employeeId, fields) {
    const { username, phoneNumber, email } = fields;
    const conditions = [];

    if (username) conditions.push({ username });
    if (phoneNumber) conditions.push({ phoneNumber });
    if (email) conditions.push({ email });

    if (conditions.length === 0) return;

    const existingEmployee = await models.Employee.findOne({
      where: {
        [models.Sequelize.Op.and]: [
          { id: { [models.Sequelize.Op.ne]: employeeId } },
          { [models.Sequelize.Op.or]: conditions },
        ],
      },
    });

    if (existingEmployee) {
      if (existingEmployee.username === username)
        throw ApiError.badRequest("Username already taken");
      if (existingEmployee.phoneNumber === phoneNumber)
        throw ApiError.badRequest("Phone number already registered");
      if (existingEmployee.email === email)
        throw ApiError.badRequest("Email already registered");
    }
  }

  static async updateEmployeeStatus(
    employeeId,
    changedBy,
    status,
    action,
    reason
  ) {
    const [employee, changer] = await Promise.all([
      models.Employee.findByPk(employeeId),
      models.User.findByPk(changedBy),
    ]);

    if (!employee || !changer) {
      throw ApiError.notFound("Employee not found");
    }

    if (employee.status === status) {
      throw ApiError.badRequest(`Employee is already ${status.toLowerCase()}`);
    }

    const [_, [updatedEmployee]] = await models.Employee.update(
      {
        status,
        deactivationReason: reason,
        updatedAt: new Date(),
      },
      {
        where: { id: employeeId },
        returning: true,
      }
    );

    await AuditService.createLog({
      action,
      entity: "EMPLOYEE",
      entityId: employeeId,
      performedById: changedBy,
      performedByType: "USER",
      description: `Employee status changed to ${status}`,
      metadata: {
        previousStatus: employee.status,
        newStatus: status,
        reason: reason || "No reason provided",
      },
    });

    return updatedEmployee;
  }

  static sanitizeEmployeeData(employee, currentUser = null) {
    const serialized = Helper.serializeUser(employee);

    // Remove sensitive data for all users
    const { password, refreshToken, ...safeData } = serialized;
    return safeData;
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
