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
    console.log("🚨 DEBUG START");
    console.log("📥 Input data:", JSON.stringify(data, null, 2));

    const { userId, serviceId, ...permissions } = data;

    // 1. Validate user
    const user = await Prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    // 2. Validate services
    const services = await Prisma.service.findMany({
      where: { id: { in: serviceId } },
    });

    if (services.length !== serviceId.length) {
      const foundIds = services.map((s) => s.id);
      const missingIds = serviceId.filter((id) => !foundIds.includes(id));
      throw ApiError.notFound(`Services not found: ${missingIds.join(", ")}`);
    }

    // 3. Convert to comma-separated string
    const serviceIdsCSV = serviceId.join(",");

    // 4. Check if permission already exists
    const existing = await Prisma.userPermission.findUnique({
      where: { userId },
    });

    let result;

    if (existing) {
      // 5. Update
      result = await Prisma.userPermission.update({
        where: { userId },
        data: {
          serviceIds: serviceIdsCSV,
          ...permissions,
        },
      });
    } else {
      // 6. Create
      result = await Prisma.userPermission.create({
        data: {
          userId,
          serviceIds: serviceIdsCSV,
          ...permissions,
        },
      });
    }

    // 7. Convert back to array for response
    const serviceIdArray = result.serviceIds.split(",");

    return {
      success: true,
      message: `Permissions ${existing ? "updated" : "created"} successfully.`,
      data: {
        ...result,
        serviceId: serviceIdArray,
      },
    };
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
