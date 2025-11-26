// services/root/rootDepartment.service.js
import { Op } from "sequelize";
import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";

export class RootDepartmentService {
  static async getAllDepartments(currentUser, options = {}) {
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
            { name: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } },
          ],
        };
      }

      const { count, rows: departments } =
        await models.Department.findAndCountAll({
          where: whereCondition,
          order: [["hierarchyLevel", "ASC"]],
          attributes: { exclude: ["createdByType", "createdById"] },
          limit,
          offset,
          distinct: true,
        });

      return {
        departments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      throw ApiError.internal(`Failed to get departments: ${error.message}`);
    }
  }

  static async getDepartmentById(departmentId, currentUser) {
    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      const department = await models.Department.findByPk(departmentId, {
        attributes: { exclude: ["createdByType", "createdById"] },
        include: [
          {
            association: "employees",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
      });

      if (!department) {
        throw ApiError.notFound("Department not found");
      }

      return department;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to get department: ${error.message}`);
    }
  }

  static async upsertDepartment(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { id, name, description = null, hierarchyLevel } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      let actionType = "";
      let department;

      // UPDATE SCENARIO - Department ID provided
      if (id) {
        const existingDepartment = await models.Department.findByPk(id, {
          transaction,
        });

        if (!existingDepartment) {
          throw ApiError.notFound("Department not found");
        }

        const updateData = {};
        const oldValues = {};
        const changedFields = [];

        if (name !== undefined && name !== existingDepartment.name) {
          updateData.name = name;
          oldValues.name = existingDepartment.name;
          changedFields.push("name");
        }
        if (
          description !== undefined &&
          description !== existingDepartment.description
        ) {
          updateData.description = description;
          oldValues.description = existingDepartment.description;
          changedFields.push("description");
        }
        if (
          hierarchyLevel !== undefined &&
          hierarchyLevel !== existingDepartment.hierarchyLevel
        ) {
          // Check if hierarchy level is already taken
          const existingHierarchy = await models.Department.findOne({
            where: { hierarchyLevel, id: { [Op.ne]: id } },
            transaction,
          });

          if (existingHierarchy) {
            throw ApiError.conflict("Hierarchy level already exists");
          }

          updateData.hierarchyLevel = hierarchyLevel;
          oldValues.hierarchyLevel = existingDepartment.hierarchyLevel;
          changedFields.push("hierarchyLevel");
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
          throw ApiError.badRequest("No valid fields to update");
        }

        await existingDepartment.update(updateData, { transaction });
        department = await models.Department.findByPk(id, { transaction });
        actionType = "UPDATE_DEPARTMENT";

        // ✅ AUDIT LOG FOR UPDATE
        await AuditService.createLog({
          action: "UPDATE_DEPARTMENT",
          entity: "Department",
          entityId: id,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          oldValues: oldValues,
          newValues: updateData,
          changedFields: changedFields,
          description: `Updated department: ${existingDepartment.name} to ${name || existingDepartment.name}`,
          status: "SUCCESS",
        });
      }
      // CREATE SCENARIO - No ID provided
      else {
        if (!name) {
          throw ApiError.badRequest("Department name is required for creation");
        }

        let finalHierarchyLevel = hierarchyLevel;

        // If hierarchy level not provided, auto-assign the next level
        if (!finalHierarchyLevel) {
          const highestDepartment = await models.Department.findOne({
            order: [["hierarchyLevel", "DESC"]],
            attributes: ["hierarchyLevel"],
            transaction,
          });

          finalHierarchyLevel = highestDepartment
            ? highestDepartment.hierarchyLevel + 1
            : 1;
        } else {
          // Check if provided hierarchy level already exists
          const existingHierarchy = await models.Department.findOne({
            where: { hierarchyLevel: finalHierarchyLevel },
            transaction,
          });

          if (existingHierarchy) {
            throw ApiError.conflict("Hierarchy level already exists");
          }
        }

        department = await models.Department.create(
          {
            name: name,
            description: description,
            hierarchyLevel: finalHierarchyLevel,
            createdByType: currentUser.role,
            createdById: currentUser.id,
          },
          { transaction }
        );

        actionType = "CREATE_DEPARTMENT";

        // ✅ AUDIT LOG FOR CREATE
        await AuditService.createLog({
          action: "CREATE_DEPARTMENT",
          entity: "Department",
          entityId: department.id,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          newValues: {
            name: name,
            description: description,
            hierarchyLevel: finalHierarchyLevel,
          },
          description: `Created new department: ${name}`,
          status: "SUCCESS",
        });
      }

      await transaction.commit();

      return {
        action: actionType === "CREATE_DEPARTMENT" ? "created" : "updated",
        department: department,
      };
    } catch (error) {
      await transaction.rollback();

      // ✅ AUDIT LOG FOR FAILED UPSERT
      await AuditService.createLog({
        action: id ? "UPDATE_DEPARTMENT" : "CREATE_DEPARTMENT",
        entity: "Department",
        entityId: id || "new",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Failed to ${id ? "update" : "create"} department: ${payload.name || ""}`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error.name === "SequelizeUniqueConstraintError") {
        if (error.fields && error.fields.name) {
          throw ApiError.conflict("Department name already exists");
        }
        if (error.fields && error.fields.hierarchy_level) {
          throw ApiError.conflict("Hierarchy level already exists");
        }
      }

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to upsert department: ${error.message}`);
    }
  }

  static async deleteDepartment(departmentId, currentUser) {
    const transaction = await models.sequelize.transaction();

    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootExists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootExists) throw ApiError.notFound("Root user not found");

      const department = await models.Department.findByPk(departmentId, {
        include: [
          {
            association: "employees",
            attributes: ["id"],
          },
        ],
        transaction,
      });

      if (!department) {
        throw ApiError.notFound("Department not found");
      }

      if (department.employees && department.employees.length > 0) {
        throw ApiError.conflict(
          "Cannot delete department that has employees assigned"
        );
      }

      const departmentDetails = {
        id: department.id,
        name: department.name,
        hierarchyLevel: department.hierarchyLevel,
        description: department.description,
      };

      await models.Department.destroy({
        where: { id: departmentId },
        transaction,
      });

      // ✅ AUDIT LOG FOR SUCCESSFUL DELETE
      await AuditService.createLog({
        action: "DELETE_DEPARTMENT",
        entity: "Department",
        entityId: departmentId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        oldValues: departmentDetails,
        description: `Deleted department: ${department.name}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return { success: true };
    } catch (error) {
      await transaction.rollback();

      // ✅ AUDIT LOG FOR FAILED DELETE
      await AuditService.createLog({
        action: "DELETE_DEPARTMENT",
        entity: "Department",
        entityId: departmentId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Failed to delete department`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;

      if (error.name === "SequelizeForeignKeyConstraintError") {
        throw ApiError.conflict(
          "Cannot delete department due to existing references"
        );
      }

      throw ApiError.internal(`Failed to delete department: ${error.message}`);
    }
  }
}

export default RootDepartmentService;
