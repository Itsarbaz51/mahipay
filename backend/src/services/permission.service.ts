import Prisma from "../db/db.js";
import type {
  CheckRolePermissionPayload,
  CheckUserPermissionPayload,
} from "../types/permission.types.js";
import { ApiError } from "../utils/ApiError.js";
import { clearPattern, getCacheWithPrefix, setCacheWithPrefix } from "../utils/redisCasheHelper.js";

export class RolePermissionService {
  static async createOrUpdateRolePermission(data: CheckRolePermissionPayload) {
    const { roleId, serviceIds, ...permissions } = data;

    if (!roleId) throw ApiError.badRequest("Role ID is required");

    const role = await Prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw ApiError.notFound("Role not found");

    // Process each service individually
    const results = [];

    for (const serviceId of serviceIds) {
      const service = await Prisma.serviceProvider.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        throw ApiError.notFound(`Service not found: ${serviceId}`);
      }

      // Check if permission already exists
      const existing = await Prisma.rolePermission.findUnique({
        where: {
          roleId_serviceId: {
            roleId,
            serviceId,
          },
        },
      });

      let result;

      if (existing) {
        result = await Prisma.rolePermission.update({
          where: {
            roleId_serviceId: {
              roleId,
              serviceId,
            },
          },
          data: {
            ...permissions,
          },
        });
      } else {
        result = await Prisma.rolePermission.create({
          data: {
            roleId,
            serviceId,
            ...permissions,
          },
        });
      }

      results.push(result);
    }

    await clearPattern(`rolePermissions:get:${roleId}`);
    return results;
  }

  static async getRolePermissions(roleId: string) {
    if (!roleId) throw ApiError.badRequest("Role ID is required");

    const cacheKey = `rolePermissions:get:${roleId}`;
    const cached = await getCacheWithPrefix("rolePermissions", cacheKey);
    if (cached) return cached;


    const permissions = await Prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        service: {
          select: {
            id: true,
            type: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    if (!permissions.length) {
      throw ApiError.notFound("No permissions found for this role");
    }

    await setCacheWithPrefix("rolePermissions", cacheKey, permissions, 180);

    return permissions;
  }

  static async deleteRolePermission(roleId: string, serviceId: string) {
    if (!roleId) throw ApiError.badRequest("Role ID is required");
    if (!serviceId) throw ApiError.badRequest("Service ID is required");

    const existing = await Prisma.rolePermission.findUnique({
      where: { roleId_serviceId: { roleId, serviceId } },
    });

    if (!existing) {
      throw ApiError.notFound("RolePermission not found");
    }
    const deleted = await Prisma.rolePermission.delete({
      where: { roleId_serviceId: { roleId, serviceId } },
    });

    await clearPattern(`rolePermissions:get:${roleId}`);

    return deleted;

  }
}

export class UserPermissionService {
  static async createOrUpdateUserPermission(data: CheckUserPermissionPayload) {
    const { userId, serviceIds, ...permissions } = data;

    const user = await Prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    // Process each service individually
    const results = [];

    for (const serviceId of serviceIds) {
      const service = await Prisma.serviceProvider.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        throw ApiError.notFound(`Service not found: ${serviceId}`);
      }

      // Check if permission already exists
      const existing = await Prisma.userPermission.findUnique({
        where: {
          userId_serviceId: {
            userId,
            serviceId,
          },
        },
      });

      let result;

      if (existing) {
        result = await Prisma.userPermission.update({
          where: {
            userId_serviceId: {
              userId,
              serviceId,
            },
          },
          data: {
            ...permissions,
          },
        });
      } else {
        result = await Prisma.userPermission.create({
          data: {
            userId,
            serviceId,
            ...permissions,
          },
        });
      }

      results.push(result);
    }

    await clearPattern(`userPermissions:get:${userId}`);

    return results;
  }

  static async getUserPermissions(userId: string) {
    if (!userId) {
      throw ApiError.badRequest("User ID is required");
    }

    const cacheKey = `userPermissions:get:${userId}`;
    const cached = await getCacheWithPrefix("userPermissions", cacheKey);
    if (cached) return cached;

    const permissions = await Prisma.userPermission.findMany({
      where: { userId },
      include: {
        service: {
          select: {
            id: true,
            type: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!permissions.length) {
      throw ApiError.notFound("No permissions found for this user");
    }

    await setCacheWithPrefix("userPermissions", cacheKey, permissions, 180);

    return permissions;
  }

  static async deleteUserPermission(userId: string, serviceId: string) {
    if (!userId) throw ApiError.badRequest("User ID is required");
    if (!serviceId) throw ApiError.badRequest("Service ID is required");

    const existing = await Prisma.userPermission.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    });

    if (!existing) {
      throw ApiError.notFound("UserPermission not found");
    }
    const deleted = await Prisma.userPermission.delete({
      where: { userId_serviceId: { userId, serviceId } },
    });

    await clearPattern(`userPermissions:get:${userId}`);


    return deleted;

  }
}