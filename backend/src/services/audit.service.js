import models from "../models/index.js";

class AuditService {
  static async createLog({
    action,
    entity,
    entityId,
    performedByType,
    performedById,
    targetUserType = null,
    targetUserId = null,
    oldValues = null,
    newValues = null,
    changedFields = null,
    ipAddress = null,
    userAgent = null,
    requestId = null,
    description = null,
    status = null,
    errorMessage = null,
  }) {
    try {
      const auditLog = await models.AuditLog.create({
        action,
        entity,
        entityId: entityId.toString(),
        performedByType,
        performedById,
        targetUserType,
        targetUserId,
        oldValues,
        newValues,
        changedFields,
        ipAddress,
        userAgent,
        requestId,
        description,
        status,
        errorMessage,
      });

      return auditLog;
    } catch (error) {
      console.error("❌ Failed to create audit log:", error);
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs({
    page = 1,
    limit = 50,
    entity = null,
    entityId = null,
    action = null,
    performedByType = null,
    performedById = null,
    startDate = null,
    endDate = null,
  } = {}) {
    const offset = (page - 1) * limit;

    const where = {};

    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (performedByType) where.performedByType = performedByType;
    if (performedById) where.performedById = performedById;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[models.Sequelize.Op.gte] = startDate;
      if (endDate) where.createdAt[models.Sequelize.Op.lte] = endDate;
    }

    const { count, rows } = await models.AuditLog.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: models.Root,
          as: "performedByRoot",
          attributes: ["id", "username", "email", "firstName", "lastName"],
          required: false,
        },
        {
          model: models.User,
          as: "performedByUser",
          attributes: ["id", "username", "email", "firstName", "lastName"],
          required: false,
        },
        {
          model: models.Employee,
          as: "performedByEmployee",
          attributes: ["id", "username", "email", "firstName", "lastName"],
          required: false,
        },
        {
          model: models.User,
          as: "targetUser",
          attributes: ["id", "username", "email", "firstName", "lastName"],
          required: false,
        },
      ],
    });

    return {
      logs: rows,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get audit log by ID with full details
   */
  static async getAuditLogById(id) {
    return await models.AuditLog.findByPk(id, {
      include: [
        {
          model: models.Root,
          as: "performedByRoot",
          attributes: ["id", "username", "email", "firstName", "lastName"],
          required: false,
        },
        {
          model: models.User,
          as: "performedByUser",
          attributes: ["id", "username", "email", "firstName", "lastName"],
          required: false,
        },
        {
          model: models.Employee,
          as: "performedByEmployee",
          attributes: ["id", "username", "email", "firstName", "lastName"],
          required: false,
        },
        {
          model: models.Root,
          as: "targetRoot",
          attributes: ["id", "username", "email", "firstName", "lastName"],
          required: false,
        },
        {
          model: models.User,
          as: "targetUser",
          attributes: ["id", "username", "email", "firstName", "lastName"],
          required: false,
        },
        {
          model: models.Employee,
          as: "targetEmployee",
          attributes: ["id", "username", "email", "firstName", "lastName"],
          required: false,
        },
      ],
    });
  }
}

export default AuditService;
