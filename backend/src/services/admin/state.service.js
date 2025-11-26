// services/admin/adminState.service.js
import { Op } from "sequelize";
import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";

export class AdminStateService {
  static async getAllStates(currentUser, options = {}) {
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
            { stateName: { [Op.iLike]: `%${search}%` } },
            { stateCode: { [Op.iLike]: `%${search}%` } },
          ],
        };
      }

      const { count, rows: states } = await models.State.findAndCountAll({
        where: whereCondition,
        order: [["stateName", "ASC"]],
        limit,
        offset,
        distinct: true,
      });

      // AUDIT LOG
      await AuditService.createLog({
        action: "GET_ALL_STATES",
        entity: "State",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin viewed all states. Filters: search=${search}`,
        status: "SUCCESS",
      });

      return {
        states,
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
        action: "GET_ALL_STATES",
        entity: "State",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Admin failed to get states",
        status: "FAILED",
        errorMessage: error.message,
      });

      throw ApiError.internal(`Failed to get states: ${error.message}`);
    }
  }

  static async getStateById(stateId, currentUser) {
    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      const state = await models.State.findByPk(stateId);

      if (!state) {
        throw ApiError.notFound("State not found");
      }

      // AUDIT LOG
      await AuditService.createLog({
        action: "GET_STATE_BY_ID",
        entity: "State",
        entityId: stateId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin viewed state details: ${state.stateName}`,
        status: "SUCCESS",
      });

      return state;
    } catch (error) {
      // AUDIT LOG FOR FAILED
      await AuditService.createLog({
        action: "GET_STATE_BY_ID",
        entity: "State",
        entityId: stateId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Admin failed to get state details",
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to get state: ${error.message}`);
    }
  }
}

export default AdminStateService;
