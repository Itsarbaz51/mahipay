import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";

class EmployeeUserService {
  /**
   * Get Business Users (Employee can see users based on permissions)
   */
  static async getBusinessUsers(options = {}, employee, req = null) {
    if (!employee || employee.userType !== "employee") {
      throw ApiError.forbidden("Employee access required");
    }

    const { page = 1, limit = 20, status = "ALL", search = "" } = options;

    const offset = (page - 1) * limit;

    // Get business roles (exclude ADMIN)
    const businessRoles = await models.Role.findAll({
      where: {
        type: "business",
        name: { [models.Sequelize.Op.ne]: "ADMIN" },
      },
    });

    const businessRoleIds = businessRoles.map((role) => role.id);

    const whereConditions = {
      roleId: { [models.Sequelize.Op.in]: businessRoleIds },
    };

    if (status !== "ALL") whereConditions.status = status;

    if (search.trim()) {
      const searchTerm = `%${search.toLowerCase()}%`;
      whereConditions[models.Sequelize.Op.or] = [
        { username: { [models.Sequelize.Op.iLike]: searchTerm } },
        { firstName: { [models.Sequelize.Op.iLike]: searchTerm } },
        { lastName: { [models.Sequelize.Op.iLike]: searchTerm } },
        { email: { [models.Sequelize.Op.iLike]: searchTerm } },
      ];
    }

    const users = await models.User.findAndCountAll({
      where: whereConditions,
      include: [
        { model: models.Role, as: "role" },
        { model: models.Wallet, as: "wallets" },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit: parseInt(limit),
    });

    await AuditService.createLog({
      action: "BUSINESS_USERS_ACCESSED",
      entity: "USER",
      performedById: employee.id,
      performedByType: "EMPLOYEE",
      description: "Employee accessed business users",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        totalUsers: users.count,
        filters: { status, search },
      },
    });

    return {
      users: users.rows.map((user) => this.sanitizeUserData(user)),
      total: users.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(users.count / limit),
    };
  }

  /**
   * Get Business User by ID
   */
  static async getBusinessUserById(userId, employee, req = null) {
    if (!employee || employee.userType !== "employee") {
      throw ApiError.forbidden("Employee access required");
    }

    const user = await models.User.findByPk(userId, {
      include: [
        { model: models.Role, as: "role" },
        { model: models.Wallet, as: "wallets" },
      ],
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Ensure it's a business user (not admin)
    if (user.role.name === "ADMIN") {
      throw ApiError.forbidden("Cannot access admin user details");
    }

    await AuditService.createLog({
      action: "BUSINESS_USER_DETAILS_ACCESSED",
      entity: "USER",
      entityId: userId,
      performedById: employee.id,
      performedByType: "EMPLOYEE",
      description: "Employee accessed business user details",
      ipAddress: req ? Helper.getClientIP(req) : null,
    });

    return this.sanitizeUserData(user);
  }

  /**
   * Get User Statistics (Employee view)
   */
  static async getUserStatistics(employee, req = null) {
    if (!employee || employee.userType !== "employee") {
      throw ApiError.forbidden("Employee access required");
    }

    const totalUsers = await models.User.count({
      include: [
        {
          model: models.Role,
          as: "role",
          where: { name: { [models.Sequelize.Op.ne]: "ADMIN" } },
        },
      ],
    });

    const activeUsers = await models.User.count({
      where: { status: "ACTIVE" },
      include: [
        {
          model: models.Role,
          as: "role",
          where: { name: { [models.Sequelize.Op.ne]: "ADMIN" } },
        },
      ],
    });

    const pendingKyc = await models.UserKyc.count({
      where: { status: "PENDING" },
    });

    await AuditService.createLog({
      action: "USER_STATISTICS_ACCESSED",
      entity: "STATS",
      performedById: employee.id,
      performedByType: "EMPLOYEE",
      description: "Employee accessed user statistics",
      ipAddress: req ? Helper.getClientIP(req) : null,
    });

    return {
      totalUsers,
      activeUsers,
      pendingKyc,
      inactiveUsers: totalUsers - activeUsers,
    };
  }

  // ==================== HELPER METHODS ====================

  static sanitizeUserData(user) {
    const { password, transactionPin, refreshToken, ...safeData } =
      user.toJSON();
    return safeData;
  }
}

export default EmployeeUserService;
