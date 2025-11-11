import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export class RolePermissionService {
  static async createOrUpdateRolePermission(data) {
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

    return results;
  }

  static async getRolePermissions(roleId) {
    if (!roleId) throw ApiError.badRequest("Role ID is required");

    const permissions = await Prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        service: {
          select: {
            id: true,
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
    return permissions;
  }

  static async deleteRolePermission(roleId, serviceId) {
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
    return deleted;
  }
}

export class UserPermissionService {
  static async createOrUpdateUserPermission(data) {
    const { userId, serviceIds, ...permissions } = data;

    const user = await Prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    // Agar serviceIds empty hai to user ke saare existing permissions delete karo
    if (!serviceIds || serviceIds.length === 0) {
      await Prisma.userPermission.deleteMany({
        where: { userId },
      });
      return [];
    }

    // Process each service individually
    const results = [];

    // Pehle existing permissions mein se jo services nahi hain serviceIds mein, unko delete karo
    const existingPermissions = await Prisma.userPermission.findMany({
      where: { userId },
    });

    const existingServiceIds = existingPermissions.map(
      (perm) => perm.serviceId
    );
    const servicesToRemove = existingServiceIds.filter(
      (serviceId) => !serviceIds.includes(serviceId)
    );

    // Remove permissions for services that are not in the new serviceIds
    if (servicesToRemove.length > 0) {
      await Prisma.userPermission.deleteMany({
        where: {
          userId,
          serviceId: { in: servicesToRemove },
        },
      });
    }

    // Ab create/update karo remaining services ke liye
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

    return results;
  }

  static async getUserPermissions(userId) {
    if (!userId) {
      throw ApiError.badRequest("User ID is required");
    }

    const permissions = await Prisma.userPermission.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        canView: true,
        service: {
          select: {
            id: true,
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
      return;
    }

    return permissions;
  }

  static async deleteUserPermission(userId, serviceId) {
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

    return deleted;
  }
}
