import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export class ServiceProviderService {
  static async create(data) {
    const existingCode = await Prisma.serviceProvider.findUnique({
      where: { code: data.code },
    });

    if (existingCode) {
      throw ApiError.badRequest("Service Provider code already exists");
    }

    const createData = {
      type: data.type,
      code: data.code,
      isActive: data.isActive ?? true,
      createdBy: data.createdBy,
    };

    if (data.name !== undefined) {
      createData.name = data.name || null;
    }

    if (data.config !== undefined) {
      createData.config = data.config;
    }

    const serviceProvider = await Prisma.serviceProvider.create({
      data: createData,
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

    return serviceProvider;
  }

  static async getAllByCreatedUser(userId) {
    const serviceProviders = await Prisma.serviceProvider.findMany({
      where: {
        createdBy: userId,
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
      orderBy: { createdAt: "desc" },
    });
    return serviceProviders;
  }

  static async getAllByCreatedUserAndStatus(userId) {
    const serviceProviders = await Prisma.serviceProvider.findMany({
      where: {
        createdBy: userId,
        isActive: true,
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
      orderBy: { createdAt: "desc" },
    });
    return serviceProviders;
  }

  static async getById(id) {
    const serviceProvider = await Prisma.serviceProvider.findUnique({
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
        Transaction: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
        CommissionSetting: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            commissionType: true,
            commissionValue: true,
          },
        },
      },
    });

    if (!serviceProvider) throw ApiError.notFound("Service Provider not found");
    return serviceProvider;
  }

  static async toggleActiveStatus(id, isActive) {
    const existing = await Prisma.serviceProvider.findUnique({
      where: { id },
    });
    if (!existing) throw ApiError.notFound("Service Provider not found");

    const updated = await Prisma.serviceProvider.update({
      where: { id },
      data: {
        isActive: isActive,
        updatedAt: new Date(),
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

    
    return updated;
  }

  static async delete(id) {
    const existing = await Prisma.serviceProvider.findUnique({
      where: { id },
    });
    if (!existing) throw ApiError.notFound("Service Provider not found");

    const relatedRecords = await Prisma.$transaction([
      Prisma.transaction.count({ where: { serviceId: id } }),
      Prisma.commissionSetting.count({ where: { serviceId: id } }),
      Prisma.commissionEarning.count({ where: { serviceId: id } }),
      Prisma.userPermission.count({ where: { serviceId: id } }),
      Prisma.rolePermission.count({ where: { serviceId: id } }),
    ]);

    const [
      transactionCount,
      commissionSettingCount,
      commissionEarningCount,
      userPermissionCount,
      rolePermissionCount,
    ] = relatedRecords;

    if (
      transactionCount > 0 ||
      commissionSettingCount > 0 ||
      commissionEarningCount > 0 ||
      userPermissionCount > 0 ||
      rolePermissionCount > 0
    ) {
      throw ApiError.badRequest(
        `Cannot delete Service Provider with existing related records: 
        ${transactionCount} transactions, 
        ${commissionSettingCount} commission settings, 
        ${commissionEarningCount} commission earnings,
        ${userPermissionCount} user permissions,
        ${rolePermissionCount} role permissions`
      );
    }

    await Prisma.serviceProvider.delete({ where: { id } });
    return { message: "Service Provider deleted successfully" };
  }

  static async update(id, data) {
    const existing = await Prisma.serviceProvider.findUnique({
      where: { id },
    });
    if (!existing) throw ApiError.notFound("Service Provider not found");

    if (data.code && data.code !== existing.code) {
      const existingCode = await Prisma.serviceProvider.findUnique({
        where: { code: data.code },
      });
      if (existingCode) {
        throw ApiError.badRequest("Service Provider code already exists");
      }
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.code !== undefined) {
      updateData.code = data.code;
    }

    if (data.name !== undefined) {
      updateData.name = data.name || null;
    }

    if (data.config !== undefined) {
      updateData.config = data.config;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const updated = await Prisma.serviceProvider.update({
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

    return updated;
  }
}