import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import type {
  RoleCreatePayload,
  RoleDTO,
  RoleUpdatePayload,
} from "../types/role.types.js";

class RoleServices {
  static async index(options: { currentUserRoleLevel?: number }): Promise<{
    roles: RoleDTO[];
  }> {
    const { currentUserRoleLevel } = options;

    const where: any = {};

    if (typeof currentUserRoleLevel === "number") {
      where.level = { gt: currentUserRoleLevel };
    }

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

    const roleDTOs: RoleDTO[] = roles.map((role) => ({
      id: role.id,
      name: role.name,
      level: role.level,
      description: role.description,
      createdBy: role.createdBy || "",
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.users,
      permissionCount: role._count.rolePermissions,
    }));

    return {
      roles: roleDTOs,
    };
  }

  static async show(id: string): Promise<RoleDTO | null> {
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
                type: true,
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

  static async store(
    payload: RoleCreatePayload & { createdBy: string }
  ): Promise<RoleDTO> {
    let { name, description, level, createdBy } = payload;

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
    const dto: RoleDTO = {
      id: role.id,
      name: role.name,
      level: role.level,
      description: role.description,
      createdBy,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    return dto;
  }

  static async update(
    id: string,
    payload: RoleUpdatePayload & { updatedBy: string }
  ): Promise<RoleDTO | null> {
    const { name, description, level } = payload;

    // Check if role exists
    const existingRole = await Prisma.role.findUnique({
      where: { id },
    });
    if (!existingRole) return null;

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

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (level !== undefined) updateData.level = level;

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

    const dto: RoleDTO = {
      id: role.id,
      name: role.name,
      level: role.level,
      description: role.description,
      createdBy: role.createdBy || "",
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    return dto;
  }

  static async destroy(id: string): Promise<boolean> {
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
  static async canUserManageRole(
    userRoleLevel: number,
    targetRoleLevel: number
  ): Promise<boolean> {
    return userRoleLevel < targetRoleLevel;
  }
}

export default RoleServices;