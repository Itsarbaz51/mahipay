import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

class RoleServices {
  static async getAllRolesByType(options) {
    const { currentUserRoleLevel, type } = options;

    // Validate input parameters
    if (!type) {
      throw new Error("Type parameter is required");
    }

    if (!["employe", "role"].includes(type)) {
      throw new Error("Invalid type parameter. Must be 'employe' or 'role'");
    }

    const where = {
      type: type,
    };

    // Add role level filter if currentUserRoleLevel is provided
    if (typeof currentUserRoleLevel === "number") {
      where.level = { gt: currentUserRoleLevel };
    }

    try {
      const roles = await Prisma.role.findMany({
        where,
        orderBy: { level: "asc" },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              users: true,
              rolePermissions: true,
            },
          },
        },
      });

      // Transform roles to DTO
      const roleDTOs = roles.map((role) => ({
        id: role.id,
        name: role.name,
        type: role.type,
        level: role.level,
        description: role.description,
        createdBy: role.createdByUser
          ? `${role.createdByUser.firstName} ${role.createdByUser.lastName}`
          : "System",
        createdByUser: role.createdByUser
          ? {
              id: role.createdByUser.id,
              firstName: role.createdByUser.firstName,
              lastName: role.createdByUser.lastName,
              email: role.createdByUser.email,
            }
          : null,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        userCount: role._count.users,
        permissionCount: role._count.rolePermissions,
        isActive: role.isActive !== undefined ? role.isActive : true,
      }));

      return {
        roles: roleDTOs,
        meta: {
          total: roleDTOs.length,
          type: type,
          filteredByLevel: typeof currentUserRoleLevel === "number",
        },
      };
    } catch (error) {
      console.error("Error in getAllRolesByType:", error);
      throw new Error(`Failed to fetch ${type} roles: ${error.message}`);
    }
  }

  static async getRolebyId(id) {
    const role = await Prisma.role.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        rolePermissions: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                code: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) return null;

    return {
      id: role.id,
      name: role.name,
      type: role.type,
      level: role.level,
      description: role.description,
      createdBy: role.createdBy || "",
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.users,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.id,
        service: rp.service,
        canView: rp.canView,
        canEdit: rp.canEdit,
        canSetCommission: rp.canSetCommission,
        canProcess: rp.canProcess,
      })),
    };
  }

  static async createRole(payload) {
    let { name, description, level, type = "employe", createdBy } = payload;

    // TYPE VALIDATION: Only allow creating 'employe' type roles
    if (type !== "employe") {
      throw ApiError.badRequest("Only 'employe' type roles can be created");
    }

    // Check if role with same name exists
    const existingByName = await Prisma.role.findUnique({
      where: { name },
    });
    if (existingByName) {
      throw ApiError.conflict("Role with this name already exists");
    }

    // Check if level is provided and unique
    if (level !== undefined) {
      const existingByLevel = await Prisma.role.findUnique({
        where: { level },
      });
      if (existingByLevel) {
        throw ApiError.conflict("Role with this level already exists");
      }
    } else {
      // Auto-determine level if not provided
      const maxLevelRole = await Prisma.role.findFirst({
        orderBy: { level: "desc" },
      });
      level = maxLevelRole ? maxLevelRole.level + 1 : 1;
    }

    const role = await Prisma.role.create({
      data: {
        name,
        type: "employe", // Force type to be 'employe'
        level,
        description: description ?? null,
        createdBy,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Assign default permissions to all active services
    const services = await Prisma.serviceProvider.findMany({
      where: { isActive: true },
    });

    if (services.length > 0) {
      const rolePermissionData = services.map((service) => ({
        roleId: role.id,
        serviceId: service.id,
        canView: true,
        canEdit: false,
        canSetCommission: false,
        canProcess: false,
      }));

      await Prisma.rolePermission.createMany({
        data: rolePermissionData,
        skipDuplicates: true,
      });
    }

    // Return DTO
    const dto = {
      id: role.id,
      name: role.name,
      type: role.type,
      level: role.level,
      description: role.description,
      createdBy,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    return dto;
  }

  static async updateRole(id, payload) {
    const { name, description, level, type } = payload;

    // Check if role exists
    const existingRole = await Prisma.role.findUnique({
      where: { id },
    });
    if (!existingRole) return null;

    // TYPE CHECK: Only allow updating 'employe' type roles
    if (existingRole.type !== "employe") {
      throw ApiError.forbidden("Cannot update non-employe type roles");
    }

    // Check for name conflict with other roles
    if (name && name !== existingRole.name) {
      const existingByName = await Prisma.role.findUnique({
        where: { name },
      });
      if (existingByName && existingByName.id !== id) {
        throw ApiError.conflict("Role with this name already exists");
      }
    }

    // Check for level conflict with other roles
    if (level !== undefined && level !== existingRole.level) {
      const existingByLevel = await Prisma.role.findUnique({
        where: { level },
      });
      if (existingByLevel && existingByLevel.id !== id) {
        throw ApiError.conflict("Role with this level already exists");
      }
    }

    // Prevent changing type to 'role'
    if (type && type !== "employe") {
      throw ApiError.badRequest("Cannot change role type to non-employe");
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (level !== undefined) updateData.level = level;
    updateData.type = "employe"; // Force type to remain 'employe'

    const role = await Prisma.role.update({
      where: { id },
      data: updateData,
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const dto = {
      id: role.id,
      name: role.name,
      type: role.type,
      level: role.level,
      description: role.description,
      createdBy: role.createdBy || "",
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    return dto;
  }

  static async deleteRole(id) {
    // Check if role exists
    const existingRole = await Prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          take: 1,
        },
      },
    });

    if (!existingRole) return false;

    // TYPE CHECK: Only allow deleting 'employe' type roles
    if (existingRole.type !== "employe") {
      throw ApiError.forbidden("Cannot delete non-employe type roles");
    }

    // Check if role is assigned to any users
    if (existingRole.users.length > 0) {
      throw ApiError.conflict("Cannot delete role assigned to users");
    }

    // Use transaction to delete role and its related data
    await Prisma.$transaction(async (tx) => {
      // Delete role permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Delete commission settings
      await tx.commissionSetting.deleteMany({
        where: { roleId: id },
      });

      // Delete the role
      await tx.role.delete({
        where: { id },
      });
    });

    return true;
  }

  // Additional method to check if user can manage this role
  static async canUserManageRole(userRoleLevel, targetRoleLevel) {
    return userRoleLevel < targetRoleLevel;
  }
}

export default RoleServices;
