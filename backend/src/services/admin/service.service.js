import { Op } from "sequelize";
import models from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import AuditService from "./audit.service.js";

export class AdminServiceService {
  /**
   * Get hierarchy users for admin
   */
  static async getHierarchyUsers(adminId) {
    const getAllChildrenIds = async (parentId) => {
      const children = await models.User.findAll({
        where: { parentId },
        attributes: ["id"],
        include: [
          {
            model: models.Role,
            attributes: ["name"],
          },
        ],
      });

      let allIds = [];

      for (const child of children) {
        // Exclude ROOT and ROOT_EMPLOYEE from hierarchy
        if (child.role.name !== "ROOT" && child.role.name !== "ROOT_EMPLOYEE") {
          allIds.push(child.id);
          const grandchildrenIds = await getAllChildrenIds(child.id);
          allIds = [...allIds, ...grandchildrenIds];
        }
      }

      return allIds;
    };

    return await getAllChildrenIds(adminId);
  }

  /**
   * Assign Services - Handles both Single and Bulk for Admin Hierarchy
   */
  static async assignServices(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      // Check if it's bulk (array) or single (object)
      const isBulk = Array.isArray(payload);
      const assignments = isBulk ? payload : [payload];

      const results = {
        successful: [],
        failed: [],
      };

      // Get admin's hierarchy and root ID once
      const hierarchyUsers = await this.getHierarchyUsers(currentUser.id);
      const rootId = await this.getAdminRootId(currentUser.id);

      for (const assignment of assignments) {
        try {
          const {
            userId,
            integrationId,
            serviceName,
            hierarchyLevel,
            hierarchyPath,
          } = assignment;

          // Check if user is in admin's hierarchy
          if (!hierarchyUsers.includes(parseInt(userId))) {
            throw new Error(
              "You can only assign services to users in your hierarchy"
            );
          }

          // Check if integration exists and is active
          const integrationExists = await models.ApiIntegration.findOne({
            where: {
              id: integrationId,
              rootId,
              isActive: true,
            },
          });

          if (!integrationExists) {
            throw new Error("Active API integration not found");
          }

          // Check if service already exists
          const existingService = await models.ServiceProvider.findOne({
            where: {
              userId,
              integrationId,
              rootId,
            },
          });

          if (existingService) {
            throw new Error(
              "Service already exists for this user and integration"
            );
          }

          // Create service
          const service = await models.ServiceProvider.create(
            {
              userId,
              integrationId,
              serviceName: serviceName || integrationExists.serviceName,
              status: "ACTIVE",
              assignedByType:
                currentUser.role === "ADMIN" ? "ADMIN" : "ADMIN_EMPLOYEE",
              assignedById: currentUser.id,
              rootId,
              hierarchyLevel: hierarchyLevel || 0,
              hierarchyPath: hierarchyPath || "0",
              canReassign: true,
            },
            { transaction }
          );

          results.successful.push({
            id: service.id,
            userId: service.userId,
            serviceName: service.serviceName,
            status: "SUCCESS",
          });
        } catch (error) {
          results.failed.push({
            assignment,
            error: error.message,
            status: "FAILED",
          });
        }
      }

      // Audit log
      const action = isBulk ? "BULK_ASSIGN_SERVICES" : "ASSIGN_SERVICE";
      await AuditService.createLog({
        action,
        entity: "ServiceProvider",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: isBulk
          ? `Bulk assigned ${results.successful.length} services in hierarchy, ${results.failed.length} failed`
          : `Assigned service to user in hierarchy`,
        status: "SUCCESS",
      });

      await transaction.commit();

      // Return single result for single assignment, bulk result for bulk
      return isBulk ? results : results.successful[0];
    } catch (error) {
      await transaction.rollback();

      await AuditService.createLog({
        action: "ASSIGN_SERVICES",
        entity: "ServiceProvider",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Failed to assign services in hierarchy`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to assign services: ${error.message}`);
    }
  }

  /**
   * Update Service Status - Handles both Single and Bulk for Admin Hierarchy
   */
  static async updateServiceStatus(currentUser, serviceIdentifier, status) {
    const transaction = await models.sequelize.transaction();

    try {
      // Check if it's bulk (array) or single (string)
      const isBulk = Array.isArray(serviceIdentifier);
      const serviceIds = isBulk ? serviceIdentifier : [serviceIdentifier];

      const results = {
        successful: [],
        failed: [],
      };

      // Get hierarchy users once
      const hierarchyUsers = await this.getHierarchyUsers(currentUser.id);

      for (const serviceId of serviceIds) {
        try {
          const service = await models.ServiceProvider.findByPk(serviceId, {
            include: [
              {
                model: models.User,
                as: "user",
                attributes: ["id"],
              },
            ],
            transaction,
          });

          if (!service) {
            throw new Error("Service not found");
          }

          // Check if service belongs to admin's hierarchy
          if (!hierarchyUsers.includes(service.user.id)) {
            throw new Error("You don't have permission to update this service");
          }

          const oldStatus = service.status;

          if (oldStatus === status) {
            throw new Error(`Service is already ${status}`);
          }

          await service.update({ status }, { transaction });

          results.successful.push({
            id: service.id,
            serviceName: service.serviceName,
            oldStatus,
            newStatus: status,
            status: "SUCCESS",
          });
        } catch (error) {
          results.failed.push({
            serviceId,
            error: error.message,
            status: "FAILED",
          });
        }
      }

      // Audit log
      const action = isBulk
        ? "BULK_UPDATE_SERVICE_STATUS"
        : "UPDATE_SERVICE_STATUS";
      await AuditService.createLog({
        action,
        entity: "ServiceProvider",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: isBulk
          ? `Bulk updated ${results.successful.length} services in hierarchy to ${status}, ${results.failed.length} failed`
          : `Updated service status in hierarchy from ${results.successful[0]?.oldStatus} to ${status}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      // Return single result for single update, bulk result for bulk
      return isBulk ? results : results.successful[0];
    } catch (error) {
      await transaction.rollback();

      await AuditService.createLog({
        action: "UPDATE_SERVICE_STATUS",
        entity: "ServiceProvider",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Failed to update service status in hierarchy`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        `Failed to update service status: ${error.message}`
      );
    }
  }

  /**
   * Delete Services - Handles both Single and Bulk for Admin Hierarchy
   */
  static async deleteServices(currentUser, serviceIdentifier) {
    const transaction = await models.sequelize.transaction();

    try {
      // Check if it's bulk (array) or single (string)
      const isBulk = Array.isArray(serviceIdentifier);
      const serviceIds = isBulk ? serviceIdentifier : [serviceIdentifier];

      const results = {
        successful: [],
        failed: [],
      };

      // Get hierarchy users once
      const hierarchyUsers = await this.getHierarchyUsers(currentUser.id);

      for (const serviceId of serviceIds) {
        try {
          const service = await models.ServiceProvider.findByPk(serviceId, {
            include: [
              {
                model: models.User,
                as: "user",
                attributes: ["id"],
              },
            ],
            transaction,
          });

          if (!service) {
            throw new Error("Service not found");
          }

          // Check if service belongs to admin's hierarchy
          if (!hierarchyUsers.includes(service.user.id)) {
            throw new Error("You don't have permission to delete this service");
          }

          await service.destroy({ transaction });

          results.successful.push({
            serviceId,
            serviceName: service.serviceName,
            status: "SUCCESS",
          });
        } catch (error) {
          results.failed.push({
            serviceId,
            error: error.message,
            status: "FAILED",
          });
        }
      }

      // Audit log
      const action = isBulk ? "BULK_DELETE_SERVICES" : "DELETE_SERVICE";
      await AuditService.createLog({
        action,
        entity: "ServiceProvider",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: isBulk
          ? `Bulk deleted ${results.successful.length} services from hierarchy, ${results.failed.length} failed`
          : `Deleted service from hierarchy: ${results.successful[0]?.serviceName}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      // Return single result for single delete, bulk result for bulk
      return isBulk ? results : { message: "Service deleted successfully" };
    } catch (error) {
      await transaction.rollback();

      await AuditService.createLog({
        action: "DELETE_SERVICES",
        entity: "ServiceProvider",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Failed to delete services from hierarchy`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to delete services: ${error.message}`);
    }
  }

  /**
   * Get services for admin's hierarchy
   */
  static async getServices(currentUser, filters = {}) {
    try {
      const {
        status = "ALL",
        userId,
        platformName,
        serviceName,
        page = 1,
        limit = 10,
        sort = "desc",
      } = filters;

      const offset = (page - 1) * limit;

      // Get hierarchy users
      const hierarchyUsers = await this.getHierarchyUsers(currentUser.id);

      if (hierarchyUsers.length === 0) {
        return {
          services: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        };
      }

      let whereCondition = {
        userId: { [Op.in]: hierarchyUsers },
      };

      if (status && status !== "ALL") {
        whereCondition.status = status;
      }

      if (userId) {
        whereCondition.userId = userId;
      }

      if (serviceName) {
        whereCondition.serviceName = { [Op.iLike]: `%${serviceName}%` };
      }

      if (platformName) {
        whereCondition["$integration.platformName$"] = {
          [Op.iLike]: `%${platformName}%`,
        };
      }

      const { count, rows: services } =
        await models.ServiceProvider.findAndCountAll({
          where: whereCondition,
          include: [
            {
              model: models.User,
              as: "user",
              attributes: ["id", "firstName", "lastName", "email", "username"],
            },
            {
              model: models.ApiIntegration,
              as: "integration",
              attributes: ["id", "platformName", "serviceName", "isActive"],
            },
          ],
          order: [["createdAt", sort.toUpperCase()]],
          limit,
          offset,
          distinct: true,
        });

      return {
        services,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      throw ApiError.internal(`Failed to get services: ${error.message}`);
    }
  }

  /**
   * Get admin's root ID
   */
  static async getAdminRootId(adminId) {
    const admin = await models.User.findByPk(adminId, {
      include: [
        {
          model: models.Root,
          as: "root",
          required: false,
        },
      ],
    });

    if (admin.root) {
      return admin.root.id;
    }

    throw new ApiError.internal("Could not determine root ID for admin");
  }
}

export default AdminServiceService;
