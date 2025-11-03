import asyncHandler from "../utils/AsyncHandler.js";
import AuditLogService from "./AuditLogService.js";
import ApiResponse from "../utils/ApiResponse.js";

class AuditLogController {
  static index = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      ipAddress,
    } = req.query;

    const filters = {
      ...(userId && { userId }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(action && { action }),
      ...(ipAddress && { ipAddress }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const result = await AuditLogService.getAuditLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      filters,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          auditLogs: result.auditLogs,
          pagination: result.pagination,
        },
        "Audit logs fetched successfully"
      )
    );
  });

  static show = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const auditLog = await AuditLogService.getAuditLogById(id);

    if (!auditLog) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Audit log not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, auditLog, "Audit log fetched successfully"));
  });

  static store = asyncHandler(async (req, res) => {
    const { userId, action, entityType, entityId, ipAddress, metadata } =
      req.body;

    // Validation
    if (!action) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Action is required"));
    }

    const auditLog = await AuditLogService.createAuditLog({
      userId: userId || req.user?.id,
      action,
      entityType,
      entityId,
      ipAddress: ipAddress || req.ip,
      metadata: metadata || {},
    });

    return res
      .status(201)
      .json(new ApiResponse(201, auditLog, "Audit log created successfully"));
  });

  // Delete specific audit log (admin only)
  static destroy = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const auditLog = await AuditLogService.deleteAuditLog(id);

    if (!auditLog) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Audit log not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Audit log deleted successfully"));
  });

  // Get audit logs for current user
  static getMyAuditLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const result = await AuditLogService.getAuditLogsByUser(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          auditLogs: result.auditLogs,
          pagination: result.pagination,
        },
        "User audit logs fetched successfully"
      )
    );
  });

  // Get audit logs by entity
  static getEntityAuditLogs = asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await AuditLogService.getAuditLogsByEntity(
      entityType,
      entityId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
      }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          auditLogs: result.auditLogs,
          pagination: result.pagination,
        },
        "Entity audit logs fetched successfully"
      )
    );
  });

  // Cleanup old logs (Admin only - for manual trigger)
  static cleanupOldLogs = asyncHandler(async (req, res) => {
    const { days = 30 } = req.body;

    const result = await AuditLogService.deleteOldAuditLogs(parseInt(days));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          `Deleted ${result.deletedCount} audit logs older than ${days} days`
        )
      );
  });
}

export default AuditLogController;
