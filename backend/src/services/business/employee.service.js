import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";
import { CryptoService } from "../../utils/cryptoService.js";
import Helper from "../../utils/helper.js";

class BusinessEmployeeService {
  /**
   * Get All Employees (Admin can see employees created by them)
   */
  static async getAllEmployees(options = {}, adminUser, req = null) {
    const {
      page = 1,
      limit = 20,
      status = "ALL",
      departmentId = null,
      search = "",
    } = options;

    const offset = (page - 1) * limit;

    const whereConditions = {
      createdById: adminUser.id,
    };

    if (status !== "ALL") whereConditions.status = status;
    if (departmentId) whereConditions.departmentId = departmentId;

    if (search.trim()) {
      const searchTerm = `%${search.toLowerCase()}%`;
      whereConditions[models.Sequelize.Op.or] = [
        { username: { [models.Sequelize.Op.iLike]: searchTerm } },
        { firstName: { [models.Sequelize.Op.iLike]: searchTerm } },
        { lastName: { [models.Sequelize.Op.iLike]: searchTerm } },
        { email: { [models.Sequelize.Op.iLike]: searchTerm } },
      ];
    }

    const employees = await models.Employee.findAndCountAll({
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
      order: [["createdAt", "DESC"]],
      offset,
      limit: parseInt(limit),
    });

    await AuditService.createLog({
      action: "EMPLOYEES_ACCESSED",
      entity: "EMPLOYEE",
      performedById: adminUser.id,
      performedByType: "ADMIN",
      description: "Admin accessed employees",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        totalEmployees: employees.count,
        filters: { status, departmentId, search },
      },
    });

    return {
      employees: employees.rows.map((emp) => this.sanitizeEmployeeData(emp)),
      total: employees.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(employees.count / limit),
    };
  }

  /**
   * Get Employee by ID
   */
  static async getEmployeeById(employeeId, adminUser, req = null) {
    const employee = await models.Employee.findOne({
      where: { id: employeeId, createdById: adminUser.id },
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

    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    await AuditService.createLog({
      action: "EMPLOYEE_DETAILS_ACCESSED",
      entity: "EMPLOYEE",
      entityId: employeeId,
      performedById: adminUser.id,
      performedByType: "ADMIN",
      description: "Admin accessed employee details",
      ipAddress: req ? Helper.getClientIP(req) : null,
    });

    return this.sanitizeEmployeeData(employee);
  }

  /**
   * Create Employee
   */
  static async createEmployee(payload, adminUser, req = null) {
    const {
      username,
      firstName,
      lastName,
      email,
      phoneNumber,
      departmentId,
      permissions = [],
    } = payload;

    // Check existing employee
    const existingEmployee = await models.Employee.findOne({
      where: {
        [models.Sequelize.Op.or]: [{ email }, { phoneNumber }, { username }],
      },
    });

    if (existingEmployee) {
      throw ApiError.badRequest("Employee already exists");
    }

    const generatedPassword = Helper.generatePassword();
    const hashedPassword = CryptoService.encrypt(generatedPassword);

    const employee = await models.Employee.create({
      username,
      firstName: this.formatName(firstName),
      lastName: this.formatName(lastName),
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
      departmentId,
      status: "ACTIVE",
      createdByType: "ADMIN",
      createdById: adminUser.id,
      parentId: adminUser.id,
    });

    // Assign permissions
    if (permissions.length > 0) {
      await this.assignEmployeePermissions(
        employee.id,
        permissions,
        adminUser.id
      );
    }

    await AuditService.createLog({
      action: "EMPLOYEE_CREATED",
      entity: "EMPLOYEE",
      entityId: employee.id,
      performedById: adminUser.id,
      performedByType: "ADMIN",
      description: "Admin created new employee",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        employeeEmail: employee.email,
        permissionsCount: permissions.length,
        departmentId,
      },
    });

    return this.sanitizeEmployeeData(employee);
  }

  /**
   * Update Employee
   */
  static async updateEmployee(employeeId, updateData, adminUser, req = null) {
    const employee = await models.Employee.findOne({
      where: { id: employeeId, createdById: adminUser.id },
    });

    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    const allowedFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "departmentId",
      "status",
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

    await models.Employee.update(updatePayload, { where: { id: employeeId } });

    await AuditService.createLog({
      action: "EMPLOYEE_UPDATED",
      entity: "EMPLOYEE",
      entityId: employeeId,
      performedById: adminUser.id,
      performedByType: "ADMIN",
      description: "Admin updated employee",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: { updatedFields: Object.keys(updatePayload) },
    });

    return await this.getEmployeeById(employeeId, adminUser);
  }

  /**
   * Update Employee Permissions
   */
  static async updateEmployeePermissions(
    employeeId,
    permissions,
    adminUser,
    req = null
  ) {
    const employee = await models.Employee.findOne({
      where: { id: employeeId, createdById: adminUser.id },
    });

    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    if (!Array.isArray(permissions)) {
      throw ApiError.badRequest("Permissions must be an array");
    }

    const transaction = await models.sequelize.transaction();

    try {
      // Deactivate all current permissions
      await models.EmployeePermission.update(
        { isActive: false, revokedAt: new Date() },
        { where: { employeeId }, transaction }
      );

      // Add new permissions
      if (permissions.length > 0) {
        const permissionRecords = permissions.map((permission) => ({
          employeeId,
          permission,
          createdByType: "ADMIN",
          createdById: adminUser.id,
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
        performedById: adminUser.id,
        performedByType: "ADMIN",
        description: "Admin updated employee permissions",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          permissions,
          totalPermissions: permissions.length,
        },
      });

      return {
        success: true,
        employeeId,
        permissions,
        totalPermissions: permissions.length,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete Employee
   */
  static async deleteEmployee(
    employeeId,
    adminUser,
    reason = "No reason provided",
    req = null
  ) {
    const employee = await models.Employee.findOne({
      where: { id: employeeId, createdById: adminUser.id },
    });

    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    const transaction = await models.sequelize.transaction();

    try {
      // Delete permissions
      await models.EmployeePermission.destroy({
        where: { employeeId },
        transaction,
      });

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
        performedById: adminUser.id,
        performedByType: "ADMIN",
        description: "Admin deleted employee",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          employeeEmail: employee.email,
          reason,
        },
      });

      return {
        success: true,
        message: "Employee deleted successfully",
        deletedEmployee: {
          id: employee.id,
          email: employee.email,
        },
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

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

  static sanitizeEmployeeData(employee) {
    const { password, refreshToken, ...safeData } = employee.toJSON();
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

export default BusinessEmployeeService;
