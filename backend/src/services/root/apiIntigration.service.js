import { Op } from "sequelize";
import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";
import { CryptoService } from "../../utils/cryptoService.js";

export class RootApiIntegrationService {
  static async getAllApiIntegrations(currentUser, options = {}) {
    try {
      const {
        status = "ALL",
        page = 1,
        limit = 10,
        sort = "desc",
        search,
      } = options;

      const offset = (page - 1) * limit;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      let whereCondition = {
        rootId: currentUser.id,
      };

      if (status && status !== "ALL") {
        if (status === "ACTIVE") {
          whereCondition.isActive = true;
        } else if (status === "INACTIVE") {
          whereCondition.isActive = false;
        }
      }

      if (search) {
        whereCondition[Op.or] = [
          { platformName: { [Op.iLike]: `%${search}%` } },
          { serviceName: { [Op.iLike]: `%${search}%` } },
          { apiBaseUrl: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: apiIntegrations } =
        await models.ApiIntegration.findAndCountAll({
          where: whereCondition,
          include: [
            {
              model: models.Root,
              as: "root",
              attributes: ["id", "firstName", "lastName", "email"],
            },
            {
              model: models.Root,
              as: "createdByRoot",
              attributes: ["id", "firstName", "lastName", "email"],
            },
            {
              model: models.ServiceProvider,
              as: "serviceProviders",
              attributes: ["id", "userId", "status"],
              include: [
                {
                  model: models.User,
                  as: "user",
                  attributes: ["firstName", "lastName", "email"],
                },
              ],
            },
          ],
          order: [["createdAt", sort.toUpperCase()]],
          limit,
          offset,
          distinct: true,
        });

      const formattedIntegrations = apiIntegrations.map((integration) => ({
        id: integration.id,
        platform: {
          name: integration.platformName,
          service: integration.serviceName,
          baseUrl: integration.apiBaseUrl,
        },
        status: integration.isActive ? "ACTIVE" : "INACTIVE",
        assignments: integration.serviceProviders.length,
        activeAssignments: integration.serviceProviders.filter(
          (sp) => sp.status === "ACTIVE"
        ).length,
        createdBy: {
          id: integration.createdByRoot.id,
          name: `${integration.createdByRoot.firstName} ${integration.createdByRoot.lastName}`,
          email: integration.createdByRoot.email,
        },
        credentials: {
          hasCredentials: Object.keys(integration.credentials).length > 0,
          // Don't expose actual credentials in list
        },
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      }));

      // AUDIT LOG FOR GET ALL
      await AuditService.createLog({
        action: "GET_ALL_API_INTEGRATIONS",
        entity: "ApiIntegration",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Root user viewed all API integrations. Filters: status=${status}, search=${search}`,
        status: "SUCCESS",
      });

      return {
        apiIntegrations: formattedIntegrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      // AUDIT LOG FOR FAILED GET ALL
      await AuditService.createLog({
        action: "GET_ALL_API_INTEGRATIONS",
        entity: "ApiIntegration",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Root user failed to get API integrations",
        status: "FAILED",
        errorMessage: error.message,
      });

      throw ApiError.internal(
        `Failed to get API integrations: ${error.message}`
      );
    }
  }

  static async getApiIntegrationById(integrationId, currentUser) {
    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      const integration = await models.ApiIntegration.findByPk(integrationId, {
        include: [
          {
            model: models.Root,
            as: "root",
            attributes: ["id", "firstName", "lastName", "email"],
          },
          {
            model: models.Root,
            as: "createdByRoot",
            attributes: ["id", "firstName", "lastName", "email"],
          },
          {
            model: models.ServiceProvider,
            as: "serviceProviders",
            attributes: [
              "id",
              "userId",
              "status",
              "commissionRate",
              "hierarchyLevel",
              "assignedByType",
              "createdAt",
            ],
            include: [
              {
                model: models.User,
                as: "user",
                attributes: [
                  "id",
                  "firstName",
                  "lastName",
                  "email",
                  "phoneNumber",
                  "hierarchyLevel",
                  "hierarchyPath",
                ],
                include: [
                  {
                    model: models.User,
                    as: "parent",
                    attributes: ["firstName", "lastName", "username"],
                  },
                ],
              },
              {
                model: models.Root,
                as: "assignedByRoot",
                attributes: ["firstName", "lastName"],
              },
              {
                model: models.User,
                as: "assignedByAdmin",
                attributes: ["firstName", "lastName"],
              },
            ],
          },
        ],
      });

      if (!integration) {
        throw ApiError.notFound("API integration not found");
      }

      // Check if integration belongs to current root
      if (integration.rootId !== currentUser.id) {
        throw ApiError.forbidden("Access denied for this API integration");
      }

      // Format service providers with assigner info
      const formattedServiceProviders = integration.serviceProviders.map(
        (sp) => ({
          id: sp.id,
          user: {
            id: sp.user.id,
            name: `${sp.user.firstName} ${sp.user.lastName}`,
            email: sp.user.email,
            phone: sp.user.phoneNumber,
            hierarchyLevel: sp.user.hierarchyLevel,
            parent: sp.user.parent
              ? `${sp.user.parent.firstName} ${sp.user.parent.lastName}`
              : "N/A",
          },
          assigner:
            sp.assignedByType === "ROOT"
              ? {
                  type: "ROOT",
                  name: sp.assignedByRoot
                    ? `${sp.assignedByRoot.firstName} ${sp.assignedByRoot.lastName}`
                    : "Root User",
                }
              : {
                  type: "ADMIN",
                  name: sp.assignedByAdmin
                    ? `${sp.assignedByAdmin.firstName} ${sp.assignedByAdmin.lastName}`
                    : "Admin User",
                },
          commissionRate: sp.commissionRate,
          status: sp.status,
          assignedAt: sp.createdAt,
        })
      );

      // AUDIT LOG FOR GET BY ID
      await AuditService.createLog({
        action: "GET_API_INTEGRATION_BY_ID",
        entity: "ApiIntegration",
        entityId: integrationId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Root user viewed API integration details: ${integration.platformName} - ${integration.serviceName}`,
        status: "SUCCESS",
      });

      return {
        id: integration.id,
        platform: {
          name: integration.platformName,
          service: integration.serviceName,
          baseUrl: integration.apiBaseUrl,
        },
        credentials: {
          // Return encrypted credentials for display
          encrypted: true,
          keys: Object.keys(integration.credentials),
        },
        status: integration.isActive ? "ACTIVE" : "INACTIVE",
        statistics: {
          totalAssignments: integration.serviceProviders.length,
          activeAssignments: integration.serviceProviders.filter(
            (sp) => sp.status === "ACTIVE"
          ).length,
          averageCommission: integration.serviceProviders.length
            ? integration.serviceProviders.reduce(
                (sum, sp) => sum + parseFloat(sp.commissionRate),
                0
              ) / integration.serviceProviders.length
            : 0,
        },
        createdBy: {
          id: integration.createdByRoot.id,
          name: `${integration.createdByRoot.firstName} ${integration.createdByRoot.lastName}`,
          email: integration.createdByRoot.email,
        },
        serviceProviders: formattedServiceProviders,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      };
    } catch (error) {
      // AUDIT LOG FOR FAILED GET BY ID
      await AuditService.createLog({
        action: "GET_API_INTEGRATION_BY_ID",
        entity: "ApiIntegration",
        entityId: integrationId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Root user failed to get API integration details",
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        `Failed to get API integration: ${error.message}`
      );
    }
  }

  static async createApiIntegration(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { platformName, serviceName, apiBaseUrl, credentials } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      // Check if integration already exists for this root
      const existingIntegration = await models.ApiIntegration.findOne({
        where: {
          platformName,
          serviceName,
          rootId: currentUser.id,
        },
        transaction,
      });

      if (existingIntegration) {
        throw ApiError.conflict(
          `API integration already exists for ${platformName} - ${serviceName}`
        );
      }

      // Encrypt sensitive credentials
      const encryptedCredentials = {};
      for (const [key, value] of Object.entries(credentials)) {
        if (typeof value === "string" && value.length > 0) {
          encryptedCredentials[key] = CryptoService.encrypt(value);
        } else {
          encryptedCredentials[key] = value;
        }
      }

      const apiIntegration = await models.ApiIntegration.create(
        {
          platformName,
          serviceName,
          apiBaseUrl,
          credentials: encryptedCredentials,
          createdByRootId: currentUser.id,
          rootId: currentUser.id,
          isActive: true,
        },
        { transaction }
      );

      // AUDIT LOG FOR CREATION
      await AuditService.createLog({
        action: "CREATE_API_INTEGRATION",
        entity: "ApiIntegration",
        entityId: apiIntegration.id,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        newValues: {
          platformName,
          serviceName,
          apiBaseUrl,
          hasCredentials: Object.keys(credentials).length > 0,
        },
        description: `Root user created new API integration: ${platformName} - ${serviceName}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return {
        id: apiIntegration.id,
        platformName: apiIntegration.platformName,
        serviceName: apiIntegration.serviceName,
        apiBaseUrl: apiIntegration.apiBaseUrl,
        status: apiIntegration.isActive ? "ACTIVE" : "INACTIVE",
        createdAt: apiIntegration.createdAt,
      };
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED CREATION
      await AuditService.createLog({
        action: "CREATE_API_INTEGRATION",
        entity: "ApiIntegration",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Root user failed to create API integration",
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        `Failed to create API integration: ${error.message}`
      );
    }
  }

  static async updateApiIntegration(integrationId, currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      const integration = await models.ApiIntegration.findByPk(integrationId, {
        transaction,
      });

      if (!integration) {
        throw ApiError.notFound("API integration not found");
      }

      // Check if integration belongs to current root
      if (integration.rootId !== currentUser.id) {
        throw ApiError.forbidden("Access denied for this API integration");
      }

      const oldValues = {
        platformName: integration.platformName,
        serviceName: integration.serviceName,
        apiBaseUrl: integration.apiBaseUrl,
        isActive: integration.isActive,
      };

      const updateData = { ...payload };

      // Encrypt credentials if provided
      if (payload.credentials) {
        const encryptedCredentials = {};
        for (const [key, value] of Object.entries(payload.credentials)) {
          if (typeof value === "string" && value.length > 0) {
            encryptedCredentials[key] = CryptoService.encrypt(value);
          } else {
            encryptedCredentials[key] = value;
          }
        }
        updateData.credentials = {
          ...integration.credentials,
          ...encryptedCredentials,
        };
      }

      await integration.update(updateData, { transaction });

      // AUDIT LOG FOR UPDATE
      await AuditService.createLog({
        action: "UPDATE_API_INTEGRATION",
        entity: "ApiIntegration",
        entityId: integrationId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        oldValues,
        newValues: updateData,
        description: `Root user updated API integration: ${integration.platformName} - ${integration.serviceName}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return {
        id: integration.id,
        platformName: integration.platformName,
        serviceName: integration.serviceName,
        apiBaseUrl: integration.apiBaseUrl,
        status: integration.isActive ? "ACTIVE" : "INACTIVE",
        updatedAt: integration.updatedAt,
      };
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED UPDATE
      await AuditService.createLog({
        action: "UPDATE_API_INTEGRATION",
        entity: "ApiIntegration",
        entityId: integrationId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Root user failed to update API integration",
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        `Failed to update API integration: ${error.message}`
      );
    }
  }

  static async toggleApiIntegrationStatus(
    integrationId,
    currentUser,
    isActive
  ) {
    const transaction = await models.sequelize.transaction();

    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      const integration = await models.ApiIntegration.findByPk(integrationId, {
        transaction,
      });

      if (!integration) {
        throw ApiError.notFound("API integration not found");
      }

      // Check if integration belongs to current root
      if (integration.rootId !== currentUser.id) {
        throw ApiError.forbidden("Access denied for this API integration");
      }

      const oldStatus = integration.isActive;

      await integration.update({ isActive }, { transaction });

      // AUDIT LOG FOR STATUS TOGGLE
      await AuditService.createLog({
        action: isActive
          ? "ACTIVATE_API_INTEGRATION"
          : "DEACTIVATE_API_INTEGRATION",
        entity: "ApiIntegration",
        entityId: integrationId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        oldValues: { isActive: oldStatus },
        newValues: { isActive },
        description: `Root user ${isActive ? "activated" : "deactivated"} API integration: ${integration.platformName} - ${integration.serviceName}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return {
        id: integration.id,
        platformName: integration.platformName,
        serviceName: integration.serviceName,
        status: integration.isActive ? "ACTIVE" : "INACTIVE",
        updatedAt: integration.updatedAt,
      };
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED STATUS TOGGLE
      await AuditService.createLog({
        action: isActive
          ? "ACTIVATE_API_INTEGRATION"
          : "DEACTIVATE_API_INTEGRATION",
        entity: "ApiIntegration",
        entityId: integrationId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Root user failed to ${isActive ? "activate" : "deactivate"} API integration`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        `Failed to toggle API integration status: ${error.message}`
      );
    }
  }
}

export default RootApiIntegrationService;
