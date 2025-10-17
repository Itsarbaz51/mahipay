import Prisma from "../db/db.js";
import type {
  CheckRolePermissionPayload,
  CheckUserPermissionPayload,
} from "../types/permission.types.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/WinstonLogger.js";

export class RolePermissionService {
  static async createOrUpdateRolePermission(data: CheckRolePermissionPayload) {
    const { roleId, serviceId, ...permissions } = data;

    // Validate Role and Service existence
    const [role, service] = await Promise.all([
      Prisma.role.findUnique({ where: { id: roleId } }),
      Prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!role) throw ApiError.notFound("Role not found");
    if (!service) throw ApiError.notFound("Service not found");

    const existing = await Prisma.rolePermission.findUnique({
      where: { roleId_serviceId: { roleId, serviceId } },
    });

    if (existing) {
      const updated = await Prisma.rolePermission.update({
        where: { roleId_serviceId: { roleId, serviceId } },
        data: { ...permissions },
      });
      logger.info("RolePermission updated", { roleId, serviceId });
      return updated;
    }

    const created = await Prisma.rolePermission.create({
      data: { roleId, serviceId, ...permissions },
    });

    logger.info("RolePermission created", { roleId, serviceId });
    return created;
  }

  static async getRolePermissions(roleId: string) {
    if (!roleId) ApiError.notFound("Role ID is required");

    const permissions = await Prisma.rolePermission.findMany({
      where: { roleId },
      include: { service: true },
    });

    if (permissions.length === 0) {
      throw ApiError.notFound("No permissions found for this role");
    }

    return Prisma.rolePermission.findMany({
      where: { roleId },
      include: { service: true },
    });
  }

  static async deleteRolePermission(roleId: string, serviceId: string) {
    if (!roleId) ApiError.notFound("Role ID is required");
    if (!serviceId) ApiError.notFound("Service ID is required");

    const existing = await Prisma.rolePermission.findUnique({
      where: { roleId_serviceId: { roleId, serviceId } },
    });

    if (!existing) {
      throw ApiError.notFound("RolePermission not found");
    }

    return Prisma.rolePermission.delete({
      where: { roleId_serviceId: { roleId, serviceId } },
    });
  }
}

export class UserPermissionService {
  static async createOrUpdateUserPermission(data: CheckUserPermissionPayload) {
    const { userId, serviceId, ...permissions } = data;

    const [user, service] = await Promise.all([
      Prisma.user.findUnique({ where: { id: userId } }),
      Prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!user) throw ApiError.notFound("User not found");
    if (!service) throw ApiError.notFound("Service not found");

    // ✅ Check if permission already exists
    const existing = await Prisma.userPermission.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    });

    if (existing) {
      const updated = await Prisma.userPermission.update({
        where: { userId_serviceId: { userId, serviceId } },
        data: { ...permissions },
      });

      logger.info("UserPermission updated", { userId, serviceId });

      return updated;
    }

    const created = await Prisma.userPermission.create({
      data: { userId, serviceId, ...permissions },
    });

    logger.info("UserPermission created", { userId, serviceId });

    return created;
  }

  static async getUserPermissions(userId: string) {
    if (!userId) ApiError.notFound("User ID is required");

    const permissions = await Prisma.userPermission.findMany({
      where: { userId },
      include: { service: true },
    });

    if (permissions.length === 0) {
      throw ApiError.notFound("No permissions found for this user");
    }

    return Prisma.userPermission.findMany({
      where: { userId },
      include: { service: true },
    });
  }

  static async deleteUserPermission(userId: string, serviceId: string) {
    if (!userId) ApiError.notFound("Role ID is required");
    if (!serviceId) ApiError.notFound("Service ID is required");

    const existing = await Prisma.userPermission.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    });

    if (!existing) {
      throw ApiError.notFound("UserPermission not found");
    }

    return Prisma.userPermission.delete({
      where: { userId_serviceId: { userId, serviceId } },
    });
  }
}
