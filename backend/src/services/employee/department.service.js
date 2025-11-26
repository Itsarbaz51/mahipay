import { Op } from "sequelize";
import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";

export class EmployeeDepartmentService {
  static async getAllDepartments(currentUser) {
    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const employeeExists = await models.Employee.findOne({
        where: { id: currentUser.id },
      });

      if (!employeeExists) throw ApiError.notFound("Employee not found");

      const departments = await models.Department.findAll({
        order: [["hierarchyLevel", "ASC"]],
        attributes: { exclude: ["createdByType", "createdById"] },
      });

      return {
        departments,
        count: departments.length,
      };
    } catch (error) {
      throw ApiError.internal(`Failed to get departments: ${error.message}`);
    }
  }

  static async upsertDepartment(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { id, name, description = null } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const employeeExists = await models.Employee.findOne({
        where: { id: currentUser.id },
      });

      if (!employeeExists) throw ApiError.notFound("Employee not found");

      // Check if employee has permission to manage departments
      const hasPermission = await this.checkDepartmentPermission(currentUser);
      if (!hasPermission) {
        throw ApiError.forbidden(
          "You don't have permission to manage departments"
        );
      }

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

        // Only allow updating name and description for employee
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

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
          throw ApiError.badRequest("No valid fields to update");
        }

        await existingDepartment.update(updateData, { transaction });

        // Return updated department
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

        const highestDepartment = await models.Department.findOne({
          order: [["hierarchyLevel", "DESC"]],
          attributes: ["hierarchyLevel"],
          transaction,
        });

        const nextHierarchyLevel = highestDepartment
          ? highestDepartment.hierarchyLevel + 1
          : 1;

        department = await models.Department.create(
          {
            name: name,
            description: description,
            hierarchyLevel: nextHierarchyLevel,
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
            hierarchyLevel: nextHierarchyLevel,
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

      // Check if employee exists
      const employeeExists = await models.Employee.findOne({
        where: { id: currentUser.id },
      });

      if (!employeeExists) throw ApiError.notFound("Employee not found");

      // Check if employee has permission to manage departments
      const hasPermission = await this.checkDepartmentPermission(currentUser);
      if (!hasPermission) {
        throw ApiError.forbidden(
          "You don't have permission to delete departments"
        );
      }

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

      // ✅ Store department details for audit log before deletion
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

  static async checkDepartmentPermission(currentUser) {
    // Implement permission check logic for employees
    // This could check department_permissions table or other authorization logic
    const permission = await models.DepartmentPermission.findOne({
      where: {
        employee_id: currentUser.id,
        can_manage_departments: true,
      },
    });

    return !!permission;
  }
}

export default EmployeeDepartmentService;
