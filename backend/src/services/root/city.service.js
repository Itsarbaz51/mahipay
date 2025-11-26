// services/root/rootCity.service.js
import { Op } from "sequelize";
import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";

export class RootCityService {
  static async getAllCities(currentUser, options = {}) {
    try {
      const { page = 1, limit = 10, search } = options;
      const offset = (page - 1) * limit;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      let whereCondition = {};

      if (search) {
        whereCondition = {
          [Op.or]: [
            { cityName: { [Op.iLike]: `%${search}%` } },
            { cityCode: { [Op.iLike]: `%${search}%` } },
          ],
        };
      }

      const { count, rows: cities } = await models.City.findAndCountAll({
        where: whereCondition,
        order: [["cityName", "ASC"]],
        limit,
        offset,
        distinct: true,
      });

      // AUDIT LOG
      await AuditService.createLog({
        action: "GET_ALL_CITIES",
        entity: "City",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Root user viewed all cities. Filters: search=${search}`,
        status: "SUCCESS",
      });

      return {
        cities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      // AUDIT LOG FOR FAILED
      await AuditService.createLog({
        action: "GET_ALL_CITIES",
        entity: "City",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Root user failed to get cities",
        status: "FAILED",
        errorMessage: error.message,
      });

      throw ApiError.internal(`Failed to get cities: ${error.message}`);
    }
  }

  static async getCityById(cityId, currentUser) {
    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      const city = await models.City.findByPk(cityId);

      if (!city) {
        throw ApiError.notFound("City not found");
      }

      // AUDIT LOG
      await AuditService.createLog({
        action: "GET_CITY_BY_ID",
        entity: "City",
        entityId: cityId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Root user viewed city details: ${city.cityName}`,
        status: "SUCCESS",
      });

      return city;
    } catch (error) {
      // AUDIT LOG FOR FAILED
      await AuditService.createLog({
        action: "GET_CITY_BY_ID",
        entity: "City",
        entityId: cityId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Root user failed to get city details",
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to get city: ${error.message}`);
    }
  }

  static async upsertCity(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { id, cityName, cityCode } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      let actionType = "";
      let city;

      const formattedName =
        cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
      const formattedCode =
        cityCode || formattedName.toUpperCase().replace(/\s+/g, "_");

      // UPDATE SCENARIO
      if (id) {
        const existingCity = await models.City.findByPk(id, { transaction });

        if (!existingCity) {
          throw ApiError.notFound("City not found");
        }

        // Check if city name already exists (excluding current city)
        const existingCityName = await models.City.findOne({
          where: {
            cityName: formattedName,
            id: { [Op.ne]: id },
          },
          transaction,
        });

        if (existingCityName) {
          throw ApiError.conflict("A city with the same name already exists");
        }

        const updateData = {};
        const oldValues = {};
        const changedFields = [];

        if (cityName !== undefined && cityName !== existingCity.cityName) {
          updateData.cityName = formattedName;
          oldValues.cityName = existingCity.cityName;
          changedFields.push("cityName");
        }

        if (cityCode !== undefined && cityCode !== existingCity.cityCode) {
          updateData.cityCode = formattedCode;
          oldValues.cityCode = existingCity.cityCode;
          changedFields.push("cityCode");
        }

        if (Object.keys(updateData).length === 0) {
          throw ApiError.badRequest("No valid fields to update");
        }

        await existingCity.update(updateData, { transaction });
        city = await models.City.findByPk(id, { transaction });
        actionType = "UPDATE_CITY";

        // AUDIT LOG FOR UPDATE
        await AuditService.createLog({
          action: "UPDATE_CITY",
          entity: "City",
          entityId: id,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          oldValues: oldValues,
          newValues: updateData,
          changedFields: changedFields,
          description: `Root user updated city: ${existingCity.cityName} to ${formattedName}`,
          status: "SUCCESS",
        });
      }
      // CREATE SCENARIO
      else {
        if (!cityName) {
          throw ApiError.badRequest("City name is required for creation");
        }

        // Check if city name already exists
        const existingCity = await models.City.findOne({
          where: { cityName: formattedName },
          transaction,
        });

        if (existingCity) {
          throw ApiError.conflict("A city with the same name already exists");
        }

        city = await models.City.create(
          {
            cityName: formattedName,
            cityCode: formattedCode,
          },
          { transaction }
        );

        actionType = "CREATE_CITY";

        // AUDIT LOG FOR CREATE
        await AuditService.createLog({
          action: "CREATE_CITY",
          entity: "City",
          entityId: city.id,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          newValues: {
            cityName: formattedName,
            cityCode: formattedCode,
          },
          description: `Root user created new city: ${formattedName}`,
          status: "SUCCESS",
        });
      }

      await transaction.commit();

      return {
        action: actionType === "CREATE_CITY" ? "created" : "updated",
        city: city,
      };
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED UPSERT
      await AuditService.createLog({
        action: id ? "UPDATE_CITY" : "CREATE_CITY",
        entity: "City",
        entityId: id || "new",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Root user failed to ${id ? "update" : "create"} city: ${payload.cityName || ""}`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error.name === "SequelizeUniqueConstraintError") {
        if (error.fields && error.fields.city_name) {
          throw ApiError.conflict("City name already exists");
        }
        if (error.fields && error.fields.city_code) {
          throw ApiError.conflict("City code already exists");
        }
      }

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to upsert city: ${error.message}`);
    }
  }

  static async deleteCity(cityId, currentUser) {
    const transaction = await models.sequelize.transaction();

    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      const city = await models.City.findByPk(cityId, { transaction });

      if (!city) {
        throw ApiError.notFound("City not found");
      }

      // Check if city has linked addresses
      const linkedAddresses = await models.Address.count({
        where: { cityId },
        transaction,
      });

      if (linkedAddresses > 0) {
        throw ApiError.forbidden("Cannot delete city: linked addresses exist");
      }

      // Store city details for audit log
      const cityDetails = {
        id: city.id,
        cityName: city.cityName,
        cityCode: city.cityCode,
      };

      await models.City.destroy({
        where: { id: cityId },
        transaction,
      });

      // AUDIT LOG FOR SUCCESSFUL DELETE
      await AuditService.createLog({
        action: "DELETE_CITY",
        entity: "City",
        entityId: cityId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        oldValues: cityDetails,
        description: `Root user deleted city: ${city.cityName}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return { success: true };
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED DELETE
      await AuditService.createLog({
        action: "DELETE_CITY",
        entity: "City",
        entityId: cityId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Root user failed to delete city`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;

      if (error.name === "SequelizeForeignKeyConstraintError") {
        throw ApiError.conflict(
          "Cannot delete city due to existing references"
        );
      }

      throw ApiError.internal(`Failed to delete city: ${error.message}`);
    }
  }
}

export default RootCityService;
