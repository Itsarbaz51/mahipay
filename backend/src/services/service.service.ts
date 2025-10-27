import Prisma from "../db/db.js";
import type {
  CreateServiceProviderInput,
  UpdateServiceProviderInput,
} from "../types/serivce.type.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/WinstonLogger.js";

export class ServiceProviderService {
  static async create(
    data: CreateServiceProviderInput & { createdBy: string }
  ) {
    const existingCode = await Prisma.serviceProvider.findUnique({
      where: { code: data.code },
    });

    if (existingCode) {
      throw ApiError.badRequest("Service Provider code already exists");
    }

    // Create proper data object with explicit null handling
    const createData: any = {
      type: data.type,
      code: data.code,
      isActive: data.isActive ?? true,
      createdBy: data.createdBy,
    };

    // Handle optional fields explicitly
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

    logger.info("Service Provider created", { id: serviceProvider.id });
    return serviceProvider;
  }

  static async getAllByCreatedUser(userId: string) {
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

  static async getAllByCreatedUserAndStatus(userId: string) {
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

  static async getById(id: string) {
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
            moduleType: true,
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
            moduleType: true,
          },
        },
      },
    });

    if (!serviceProvider) throw ApiError.notFound("Service Provider not found");
    return serviceProvider;
  }

  static async toggleActiveStatus(id: string, isActive: boolean) {
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

    logger.info("Service Provider status updated", {
      id,
      isActive: isActive,
    });
    return updated;
  }

  static async delete(id: string) {
    const existing = await Prisma.serviceProvider.findUnique({
      where: { id },
    });
    if (!existing) throw ApiError.notFound("Service Provider not found");

    // Check if provider has related records using transaction for consistency
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
    logger.info("Service Provider deleted", { id });
    return { message: "Service Provider deleted successfully" };
  }

  static async update(id: string, data: UpdateServiceProviderInput) {
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

    // Create proper update data object
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Handle each field explicitly
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

    logger.info("Service Provider updated", { id });
    return updated;
  }
}
