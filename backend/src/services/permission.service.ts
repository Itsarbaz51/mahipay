import Prisma from "../db/db.js";
import type {
  CheckRolePermissionPayload,
  CheckUserPermissionPayload,
} from "../types/permission.types.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/WinstonLogger.js";

export class RolePermissionService {
  static async createOrUpdateRolePermission(data: CheckRolePermissionPayload) {
    const { roleId, serviceIds, ...permissions } = data;

    if (!roleId) throw ApiError.badRequest("Role ID is required");

    const role = await Prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw ApiError.notFound("Role not found");

    const services = await Prisma.serviceProvider.findMany({
      where: { id: { in: serviceIds } },
    });

    if (services.length !== serviceIds.length) {
      const foundIds = services.map((s) => s.id);
      const missingIds = serviceIds.filter((id) => !foundIds.includes(id));
      throw ApiError.notFound(`Services not found: ${missingIds.join(", ")}`);
    }

    const existing = await Prisma.rolePermission.findFirst({
      where: { roleId },
    });

    const serviceIdsString = serviceIds.join(",");

    let result;

    if (existing) {
      result = await Prisma.rolePermission.update({
        where: { id: existing.id },
        data: {
          serviceIds: serviceIdsString,
          ...permissions,
        },
      });
    } else {
      result = await Prisma.rolePermission.create({
        data: {
          roleId,
          serviceIds: serviceIdsString,
          ...permissions,
        },
      });
    }

    return result;
  }

  static async getRolePermissions(roleId: string) {
    if (!roleId) ApiError.notFound("Role ID is required");

    const permissions = await Prisma.rolePermission.findFirst({
      where: { roleId },
    });

    if (!permissions) {
      throw ApiError.notFound("No permissions found for this role");
    }

    const serviceIds = permissions.serviceIds.split(",");

    const services = await Prisma.serviceProvider.findMany({
      where: { id: { in: serviceIds } },
    });

    return {
      ...permissions,
      serviceIds,
      services,
    };
  }

  // static async deleteRolePermission(roleId: string, serviceId: string) {
  //   if (!roleId) ApiError.notFound("Role ID is required");
  //   if (!serviceId) ApiError.notFound("Service ID is required");

  //   const existing = await Prisma.rolePermission.findUnique({
  //     where: { roleId_serviceId: { roleId, serviceId } },
  //   });

  //   if (!existing) {
  //     throw ApiError.notFound("RolePermission not found");
  //   }

  //   return Prisma.rolePermission.delete({
  //     where: { roleId_serviceId: { roleId, serviceId } },
  //   });
  // }
}

export class UserPermissionService {
  static async createOrUpdateUserPermission(data: CheckUserPermissionPayload) {
    const { userId, serviceIds, ...permissions } = data;

    const user = await Prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    const services = await Prisma.serviceProvider.findMany({
      where: { id: { in: serviceIds } },
    });

    if (services.length !== serviceIds.length) {
      const foundIds = services.map((s) => s.id);
      const missingIds = serviceIds.filter((id) => !foundIds.includes(id));
      throw ApiError.notFound(`Services not found: ${missingIds.join(", ")}`);
    }

    const existing = await Prisma.userPermission.findFirst({
      where: { userId },
    });

    const serviceIdsString = serviceIds.join(",");

    let result;

    if (existing) {
      result = await Prisma.userPermission.update({
        where: { id: existing.id },
        data: {
          serviceIds: serviceIdsString,
          ...permissions,
        },
      });
    } else {
      result = await Prisma.userPermission.create({
        data: {
          userId,
          serviceIds: serviceIdsString,
          ...permissions,
        },
      });
    }

    return result;
  }

  static async getUserPermissions(userId: string) {
    if (!userId) {
      throw ApiError.badRequest("User ID is required");
    }

    const permission = await Prisma.userPermission.findUnique({
      where: { userId },
    });

    if (!permission) {
      throw ApiError.notFound("No permissions found for this user");
    }

    const serviceIds = permission.serviceIds.split(",");

    const services = await Prisma.serviceProvider.findMany({
      where: { id: { in: serviceIds } },
    });

    return {
      ...permission,
      serviceIds,
      services,
    };
  }

  // static async deleteUserPermission(userId: string, serviceId: string) {
  //   if (!userId) ApiError.notFound("Role ID is required");
  //   if (!serviceId) ApiError.notFound("Service ID is required");

  //   const existing = await Prisma.userPermission.findUnique({
  //     where: { userId_serviceId: { userId, serviceId } },
  //   });

  //   if (!existing) {
  //     throw ApiError.notFound("UserPermission not found");
  //   }

  //   return Prisma.userPermission.delete({
  //     where: { userId_serviceId: { userId, serviceId } },
  //   });
  // }
}
