import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";

class EmployeeEmployeeService {
  /**
   * Get Employee Profile (Self)
   */
  static async getMyProfile(employeeId, req = null) {
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

    return this.sanitizeEmployeeData(employee);
  }

  /**
   * Update Employee Profile (Self)
   */
  static async updateMyProfile(employeeId, updateData, req = null) {
    const employee = await models.Employee.findByPk(employeeId);
    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    const allowedFields = ["firstName", "lastName", "phoneNumber"];
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
      action: "EMPLOYEE_PROFILE_UPDATED",
      entity: "EMPLOYEE",
      entityId: employeeId,
      performedById: employeeId,
      performedByType: "EMPLOYEE",
      description: "Employee updated own profile",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: { updatedFields: Object.keys(updatePayload) },
    });

    return await this.getMyProfile(employeeId);
  }

  /**
   * Get My Permissions
   */
  static async getMyPermissions(employeeId, req = null) {
    const permissions = await models.EmployeePermission.findAll({
      where: { employeeId, isActive: true },
      attributes: ["permission", "assignedAt"],
    });

    await AuditService.createLog({
      action: "EMPLOYEE_PERMISSIONS_ACCESSED",
      entity: "EMPLOYEE",
      entityId: employeeId,
      performedById: employeeId,
      performedByType: "EMPLOYEE",
      description: "Employee accessed own permissions",
      ipAddress: req ? Helper.getClientIP(req) : null,
    });

    return {
      permissions: permissions.map((p) => p.permission),
      totalPermissions: permissions.length,
      assignedAt: permissions[0]?.assignedAt,
    };
  }

  /**
   * Get My Login History
   */
  static async getMyLoginHistory(employeeId, options = {}, req = null) {
    const { limit = 10, page = 1 } = options;
    const offset = (page - 1) * limit;

    const logs = await AuditService.getLogs({
      where: {
        entity: "AUTH",
        entityId: employeeId,
        action: {
          [models.Sequelize.Op.in]: ["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT"],
        },
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    const loginHistory = logs.rows.map((log) => ({
      id: log.id,
      action: log.action,
      timestamp: log.createdAt,
      ipAddress: log.ipAddress,
      location: log.metadata?.location,
      userAgent: log.metadata?.userAgent,
      status: log.action === "LOGIN_SUCCESS" ? "SUCCESS" : "FAILED",
      reason: log.metadata?.reason,
    }));

    await AuditService.createLog({
      action: "EMPLOYEE_LOGIN_HISTORY_ACCESSED",
      entity: "EMPLOYEE",
      entityId: employeeId,
      performedById: employeeId,
      performedByType: "EMPLOYEE",
      description: "Employee accessed login history",
      ipAddress: req ? Helper.getClientIP(req) : null,
    });

    return {
      loginHistory,
      total: logs.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(logs.count / limit),
    };
  }

  /**
   * Change Password
   */
  static async changePassword(employeeId, passwordData, req = null) {
    const { currentPassword, newPassword } = passwordData;

    const employee = await models.Employee.findByPk(employeeId);
    if (!employee) {
      throw ApiError.notFound("Employee not found");
    }

    // Verify current password
    const decryptedPassword = CryptoService.decrypt(employee.password);
    if (decryptedPassword !== currentPassword) {
      throw ApiError.unauthorized("Current password is incorrect");
    }

    // Update password
    const hashedPassword = CryptoService.encrypt(newPassword);
    await models.Employee.update(
      { password: hashedPassword, refreshToken: null },
      { where: { id: employeeId } }
    );

    await AuditService.createLog({
      action: "EMPLOYEE_PASSWORD_CHANGED",
      entity: "EMPLOYEE",
      entityId: employeeId,
      performedById: employeeId,
      performedByType: "EMPLOYEE",
      description: "Employee changed password",
      ipAddress: req ? Helper.getClientIP(req) : null,
    });

    return { message: "Password changed successfully" };
  }

  // ==================== HELPER METHODS ====================

  static sanitizeEmployeeData(employee) {
    const { password, refreshToken, ...safeData } = employee.toJSON();
    return safeData;
  }
}

export default EmployeeEmployeeService;
