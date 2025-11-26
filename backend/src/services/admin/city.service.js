import { Op } from "sequelize";
import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";

export class AdminCityService {
  static async getAllCities(currentUser, options = {}) {
    try {
      const { page = 1, limit = 10, search } = options;
      const offset = (page - 1) * limit;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

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
        description: `Admin viewed all cities. Filters: search=${search}`,
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
        description: "Admin failed to get cities",
        status: "FAILED",
        errorMessage: error.message,
      });

      throw ApiError.internal(`Failed to get cities: ${error.message}`);
    }
  }

  static async getCityById(cityId, currentUser) {
    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

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
        description: `Admin viewed city details: ${city.cityName}`,
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
        description: "Admin failed to get city details",
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to get city: ${error.message}`);
    }
  }
}

export default AdminCityService;
