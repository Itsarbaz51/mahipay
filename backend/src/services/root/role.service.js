import { Op } from "sequelize";
import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";

export class RootRoleService {
  static async getAllRoles(currentUser) {
    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootexists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootexists) throw ApiError.notFound("Root user not found");

      // Get current user's role to determine hierarchy level
      const userRole = await models.Role.findOne({
        where: { name: currentUser.role },
        attributes: ["hierarchyLevel"],
      });

      if (!userRole)
        throw ApiError.notFound(`Your ${currentUser.role} not found`);

      const userHierarchyLevel = userRole.hierarchyLevel;

      // Return roles with hierarchy level GREATER than current user's level
      const whereCondition = {
        hierarchyLevel: {
          [Op.gt]: userHierarchyLevel, // Only roles with higher hierarchy level
        },
      };

      const roles = await models.Role.findAll({
        where: whereCondition,
        order: [["hierarchyLevel", "ASC"]],
        attributes: { exclude: ["createdByType", "createdById"] },
      });

      return {
        roles,
        count: roles.length,
      };
    } catch (error) {
      throw ApiError.internal(`Failed to get roles: ${error.message}`);
    }
  }

  static async upsertRole(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { id, name, description = null } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootexists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootexists) throw ApiError.notFound("Root user not found");

      // Get current user's role to determine hierarchy level
      const userRole = await models.Role.findOne({
        where: { name: currentUser.role },
        attributes: ["hierarchyLevel"],
      });

      if (!userRole)
        throw ApiError.notFound(`Your ${currentUser.role} not found`);

      let actionType = "";
      let role;

      // UPDATE SCENARIO - Role ID provided
      if (id) {
        const existingRole = await models.Role.findByPk(id, { transaction });

        if (!existingRole) {
          throw ApiError.notFound("Role not found");
        }

        // Check if user can update this role (only roles with lower hierarchy)
        if (existingRole.hierarchyLevel <= userRole.hierarchyLevel) {
          throw ApiError.forbidden(
            "Cannot update role with equal or higher hierarchy level than your own"
          );
        }

        // Only allow updating name and description
        const updateData = {};
        const oldValues = {};
        const changedFields = [];

        if (name !== undefined && name !== existingRole.name) {
          updateData.name = name;
          oldValues.name = existingRole.name;
          changedFields.push("name");
        }
        if (
          description !== undefined &&
          description !== existingRole.description
        ) {
          updateData.description = description;
          oldValues.description = existingRole.description;
          changedFields.push("description");
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
          throw ApiError.badRequest("No valid fields to update");
        }

        await existingRole.update(updateData, { transaction });

        // Return updated role
        role = await models.Role.findByPk(id, { transaction });
        actionType = "UPDATE_ROLE";

        // ✅ AUDIT LOG FOR UPDATE
        await AuditService.createLog({
          action: "UPDATE_ROLE",
          entity: "Role",
          entityId: id,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          oldValues: oldValues,
          newValues: updateData,
          changedFields: changedFields,
          description: `Updated role: ${existingRole.name} to ${name || existingRole.name}`,
          status: "SUCCESS",
        });
      }
      // CREATE SCENARIO - No ID provided
      else {
        if (!name) {
          throw ApiError.badRequest("Role name is required for creation");
        }

        const highestRole = await models.Role.findOne({
          order: [["hierarchyLevel", "DESC"]],
          attributes: ["hierarchyLevel"],
          transaction,
        });

        const nextHierarchyLevel = highestRole
          ? highestRole.hierarchyLevel + 1
          : 1;

        // Check if user can create roles with the next hierarchy level
        if (nextHierarchyLevel <= userRole.hierarchyLevel) {
          throw ApiError.forbidden(
            "Cannot create role with equal or higher hierarchy level than your own"
          );
        }

        role = await models.Role.create(
          {
            name: name?.toUpperCase(),
            description: description,
            hierarchyLevel: nextHierarchyLevel,
            createdByType: currentUser.role,
            createdById: currentUser.id,
          },
          { transaction }
        );

        actionType = "CREATE_ROLE";

        // ✅ AUDIT LOG FOR CREATE
        await AuditService.createLog({
          action: "CREATE_ROLE",
          entity: "Role",
          entityId: role.id,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          newValues: {
            name: name,
            description: description,
            hierarchyLevel: nextHierarchyLevel,
          },
          description: `Created new role: ${name}`,
          status: "SUCCESS",
        });
      }

      await transaction.commit();

      return {
        action: actionType === "CREATE_ROLE" ? "created" : "updated",
        role: role,
      };
    } catch (error) {
      await transaction.rollback();

      // ✅ AUDIT LOG FOR FAILED UPSERT
      await AuditService.createLog({
        action: id ? "UPDATE_ROLE" : "CREATE_ROLE",
        entity: "Role",
        entityId: id || "new",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Failed to ${id ? "update" : "create"} role: ${payload.name || ""}`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error.name === "SequelizeUniqueConstraintError") {
        if (error.fields && error.fields.name) {
          throw ApiError.conflict("Role name already exists");
        }
        if (error.fields && error.fields.hierarchy_level) {
          throw ApiError.conflict("Hierarchy level already exists");
        }
      }

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to upsert role: ${error.message}`);
    }
  }

  static async deleteRole(roleId, currentUser) {
    const transaction = await models.sequelize.transaction();

    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      // Check if root user exists
      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      const userRole = await models.Role.findOne({
        where: { name: currentUser.role },
        attributes: ["hierarchyLevel"],
      });

      if (!userRole)
        throw ApiError.notFound(`Your ${currentUser.role} not found`);

      const role = await models.Role.findByPk(roleId, {
        include: [
          {
            association: "users",
            attributes: ["id"],
          },
        ],
        transaction,
      });

      if (!role) {
        throw ApiError.notFound("Role not found");
      }

      if (role.hierarchyLevel <= userRole.hierarchyLevel) {
        throw ApiError.forbidden(
          "Cannot delete role with equal or higher hierarchy level than your own"
        );
      }

      if (role.users && role.users.length > 0) {
        throw ApiError.conflict("Cannot delete role that has users assigned");
      }

      // ✅ Store role details for audit log before deletion
      const roleDetails = {
        id: role.id,
        name: role.name,
        hierarchyLevel: role.hierarchyLevel,
        description: role.description,
      };

      await models.Role.destroy({
        where: { id: roleId },
        transaction,
      });

      // ✅ AUDIT LOG FOR SUCCESSFUL DELETE
      await AuditService.createLog({
        action: "DELETE_ROLE",
        entity: "Role",
        entityId: roleId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        oldValues: roleDetails,
        description: `Deleted role: ${role.name}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return { success: true };
    } catch (error) {
      await transaction.rollback();

      // ✅ AUDIT LOG FOR FAILED DELETE
      await AuditService.createLog({
        action: "DELETE_ROLE",
        entity: "Role",
        entityId: roleId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Failed to delete role`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;

      if (error.name === "SequelizeForeignKeyConstraintError") {
        throw ApiError.conflict(
          "Cannot delete role due to existing references"
        );
      }

      throw ApiError.internal(`Failed to delete role: ${error.message}`);
    }
  }
}

export default RootRoleService;
