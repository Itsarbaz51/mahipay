import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";
import { CryptoService } from "../../utils/cryptoService.js";

class RootEmployeeService {
  /**
   * Get All Employees (Root can see all employees)
   */
  static async getAllEmployees(options = {}, rootUser, req = null) {
    const {
      page = 1,
      limit = 50,
      status = "ALL",
      departmentId = null,
      search = "",
    } = options;

    const offset = (page - 1) * limit;

    const whereConditions = {};
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
      action: "ALL_EMPLOYEES_ACCESSED",
      entity: "EMPLOYEE",
      performedById: rootUser.id,
      performedByType: "ROOT",
      description: "Root accessed all employees",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        totalEmployees: employees.count,
        filters: { status, departmentId, search },
      },
    });

    return {
      employees: employees.rows.map((emp) =>
        this.sanitizeEmployeeData(emp, true)
      ),
      total: employees.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(employees.count / limit),
    };
  }

  /**
   * Get Employee by ID
   */
  static async getEmployeeById(employeeId, rootUser, req = null) {
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

    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    await AuditService.createLog({
      action: "EMPLOYEE_DETAILS_ACCESSED",
      entity: "EMPLOYEE",
      entityId: employeeId,
      performedById: rootUser.id,
      performedByType: "ROOT",
      description: "Root accessed employee details",
      ipAddress: req ? Helper.getClientIP(req) : null,
    });

    return this.sanitizeEmployeeData(employee, true);
  }

  /**
   * Create Employee (Root can create employees for any admin)
   */
  static async createEmployee(payload, rootUser, req = null) {
    const {
      username,
      firstName,
      lastName,
      email,
      phoneNumber,
      departmentId,
      permissions = [],
      parentId,
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
      createdByType: "ROOT",
      createdById: rootUser.id,
      parentId: parentId || rootUser.id,
    });

    // Assign permissions
    if (permissions.length > 0) {
      await this.assignEmployeePermissions(
        employee.id,
        permissions,
        rootUser.id
      );
    }

    await AuditService.createLog({
      action: "EMPLOYEE_CREATED",
      entity: "EMPLOYEE",
      entityId: employee.id,
      performedById: rootUser.id,
      performedByType: "ROOT",
      description: "Root created new employee",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        employeeEmail: employee.email,
        permissionsCount: permissions.length,
        parentId: parentId || rootUser.id,
      },
    });

    return this.sanitizeEmployeeData(employee);
  }

  /**
   * Update Employee Permissions
   */
  static async updateEmployeePermissions(
    employeeId,
    permissions,
    rootUser,
    req = null
  ) {
    const employee = await models.Employee.findByPk(employeeId);
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
          createdByType: "ROOT",
          createdById: rootUser.id,
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
        performedById: rootUser.id,
        performedByType: "ROOT",
        description: "Root updated employee permissions",
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
    rootUser,
    reason = "No reason provided",
    req = null
  ) {
    const employee = await models.Employee.findByPk(employeeId);
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
        performedById: rootUser.id,
        performedByType: "ROOT",
        description: "Root permanently deleted employee",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          employeeEmail: employee.email,
          reason,
        },
      });

      return {
        success: true,
        message: "Employee permanently deleted",
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

  static async assignEmployeePermissions(employeeId, permissions, rootId) {
    const permissionRecords = permissions.map((permission) => ({
      employeeId,
      permission,
      createdByType: "ROOT",
      createdById: rootId,
      isActive: true,
      assignedAt: new Date(),
    }));

    await models.EmployeePermission.bulkCreate(permissionRecords);
  }

  static sanitizeEmployeeData(employee, isRoot = false) {
    const serialized = employee.toJSON ? employee.toJSON() : employee;

    if (isRoot) {
      // Root can see decrypted password
      if (serialized.password) {
        try {
          serialized.password = CryptoService.decrypt(serialized.password);
        } catch {
          serialized.password = "Encrypted";
        }
      }
    }

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

export default RootEmployeeService;
