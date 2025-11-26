import { Op } from "sequelize";
import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";

export class EmployeeStateService {
  static async getAllStates(currentUser, options = {}) {
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
        description: `Root user viewed all states. Filters: search=${search}`,
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
        description: "Root user failed to get states",
        status: "FAILED",
        errorMessage: error.message,
      });

      throw ApiError.internal(`Failed to get states: ${error.message}`);
    }
  }

  static async upsertState(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { id, stateName, stateCode } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      let actionType = "";
      let state;

      const formattedName =
        stateName.charAt(0).toUpperCase() + stateName.slice(1).toLowerCase();
      const formattedCode =
        stateCode || formattedName.toUpperCase().replace(/\s+/g, "_");

      // UPDATE SCENARIO
      if (id) {
        const existingState = await models.State.findByPk(id, { transaction });

        if (!existingState) {
          throw ApiError.notFound("State not found");
        }

        // Check if state name already exists (excluding current state)
        const existingStateName = await models.State.findOne({
          where: {
            stateName: formattedName,
            id: { [Op.ne]: id },
          },
          transaction,
        });

        if (existingStateName) {
          throw ApiError.conflict("A state with the same name already exists");
        }

        const updateData = {};
        const oldValues = {};
        const changedFields = [];

        if (stateName !== undefined && stateName !== existingState.stateName) {
          updateData.stateName = formattedName;
          oldValues.stateName = existingState.stateName;
          changedFields.push("stateName");
        }

        if (stateCode !== undefined && stateCode !== existingState.stateCode) {
          updateData.stateCode = formattedCode;
          oldValues.stateCode = existingState.stateCode;
          changedFields.push("stateCode");
        }

        if (Object.keys(updateData).length === 0) {
          throw ApiError.badRequest("No valid fields to update");
        }

        await existingState.update(updateData, { transaction });
        state = await models.State.findByPk(id, { transaction });
        actionType = "UPDATE_STATE";

        // AUDIT LOG FOR UPDATE
        await AuditService.createLog({
          action: "UPDATE_STATE",
          entity: "State",
          entityId: id,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          oldValues: oldValues,
          newValues: updateData,
          changedFields: changedFields,
          description: `Root user updated state: ${existingState.stateName} to ${formattedName}`,
          status: "SUCCESS",
        });
      }
      // CREATE SCENARIO
      else {
        if (!stateName) {
          throw ApiError.badRequest("State name is required for creation");
        }

        // Check if state name already exists
        const existingState = await models.State.findOne({
          where: { stateName: formattedName },
          transaction,
        });

        if (existingState) {
          throw ApiError.conflict("A state with the same name already exists");
        }

        state = await models.State.create(
          {
            stateName: formattedName,
            stateCode: formattedCode,
          },
          { transaction }
        );

        actionType = "CREATE_STATE";

        // AUDIT LOG FOR CREATE
        await AuditService.createLog({
          action: "CREATE_STATE",
          entity: "State",
          entityId: state.id,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          newValues: {
            stateName: formattedName,
            stateCode: formattedCode,
          },
          description: `Root user created new state: ${formattedName}`,
          status: "SUCCESS",
        });
      }

      await transaction.commit();

      return {
        action: actionType === "CREATE_STATE" ? "created" : "updated",
        state: state,
      };
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED UPSERT
      await AuditService.createLog({
        action: id ? "UPDATE_STATE" : "CREATE_STATE",
        entity: "State",
        entityId: id || "new",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Root user failed to ${id ? "update" : "create"} state: ${payload.stateName || ""}`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error.name === "SequelizeUniqueConstraintError") {
        if (error.fields && error.fields.state_name) {
          throw ApiError.conflict("State name already exists");
        }
        if (error.fields && error.fields.state_code) {
          throw ApiError.conflict("State code already exists");
        }
      }

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to upsert state: ${error.message}`);
    }
  }

  static async deleteState(stateId, currentUser) {
    const transaction = await models.sequelize.transaction();

    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      const state = await models.State.findByPk(stateId, { transaction });

      if (!state) {
        throw ApiError.notFound("State not found");
      }

      // Check if state has linked addresses
      const linkedAddresses = await models.Address.count({
        where: { stateId },
        transaction,
      });

      if (linkedAddresses > 0) {
        throw ApiError.forbidden("Cannot delete state: linked addresses exist");
      }

      // Store state details for audit log
      const stateDetails = {
        id: state.id,
        stateName: state.stateName,
        stateCode: state.stateCode,
      };

      await models.State.destroy({
        where: { id: stateId },
        transaction,
      });

      // AUDIT LOG FOR SUCCESSFUL DELETE
      await AuditService.createLog({
        action: "DELETE_STATE",
        entity: "State",
        entityId: stateId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        oldValues: stateDetails,
        description: `Root user deleted state: ${state.stateName}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return { success: true };
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED DELETE
      await AuditService.createLog({
        action: "DELETE_STATE",
        entity: "State",
        entityId: stateId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Root user failed to delete state`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;

      if (error.name === "SequelizeForeignKeyConstraintError") {
        throw ApiError.conflict(
          "Cannot delete state due to existing references"
        );
      }

      throw ApiError.internal(`Failed to delete state: ${error.message}`);
    }
  }
}

export default EmployeeStateService;
