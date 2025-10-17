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
              },
            },
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
    };
  }

  static async store(
    payload: RoleCreatePayload & { createdBy: string }
  ): Promise<RoleDTO> {
    const { name, description, createdBy } = payload;

    const existingByName = await Prisma.role.findUnique({ where: { name } });
    if (existingByName)
      throw ApiError.conflict("Role with this name already exists");

    // Auto-determine level
    const maxLevelRole = await Prisma.role.findFirst({
      orderBy: { level: "desc" },
    });
    const level = maxLevelRole ? maxLevelRole.level + 1 : 0;

    const role = await Prisma.role.create({
      data: {
        name,
        level,
        description: description ?? null,
        createdByUser: { connect: { id: createdBy } },
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

    // Assign default permissions
    const services = await Prisma.service.findMany();
    if (services.length > 0) {
      await Prisma.rolePermission.createMany({
        data: services.map((service) => ({
          roleId: role.id,
          serviceId: service.id,
          canView: true,
          canEdit: false,
          canSetCommission: false,
        })),
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
    const { name, description } = payload;

    // Check if role exists
    const existingRole = await Prisma.role.findUnique({ where: { id } });
    if (!existingRole) return null;

    // Check for name conflict with other roles
    if (name !== existingRole.name) {
      const existingByName = await Prisma.role.findUnique({ where: { name } });
      if (existingByName && existingByName.id !== id) {
        throw ApiError.conflict("Role with this name already exists");
      }
    }

    const role = await Prisma.role.update({
      where: { id },
      data: {
        name,
        description: description ?? null,
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

    // Use transaction to delete role and its permissions
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
}

export default RoleServices;
