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

    const serviceProvider = await Prisma.serviceProvider.create({
      data: {
        type: data.type,
        code: data.code,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
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
      orderBy: { createdAt: "desc" },
    });
    return serviceProviders;
  }

  static async getById(id: string) {
    const serviceProvider = await Prisma.serviceProvider.findUnique({
      where: { id },
    });

    if (!serviceProvider) throw ApiError.notFound("Service Provider not found");
    return serviceProvider;
  }

  static async toggleActiveStatus(id: string, isActive: boolean) {
    const existing = await Prisma.serviceProvider.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Service Provider not found");

    const updated = await Prisma.serviceProvider.update({
      where: { id },
      data: {
        isActive: isActive,
      },
    });

    logger.info("Service Provider status updated", {
      id,
      isActive: isActive,
    });
    return updated;
  }

  static async delete(id: string) {
    const existing = await Prisma.serviceProvider.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Service Provider not found");

    // Check if provider has related records
    const [
      hasTransactions,
      hasCommissionSettings,
      hasCommissionEarnings,
      hasUserPermissions,
      hasRolePermissions,
    ] = await Promise.all([
      Prisma.transaction.count({ where: { serviceId: id } }),
      Prisma.commissionSetting.count({ where: { serviceId: id } }),
      Prisma.commissionEarning.count({ where: { serviceId: id } }),
      Prisma.userPermission.count({ where: { serviceId: id } }),
      Prisma.rolePermission.count({ where: { serviceId: id } }),
    ]);

    if (
      hasTransactions > 0 ||
      hasCommissionSettings > 0 ||
      hasCommissionEarnings > 0 ||
      hasUserPermissions > 0 ||
      hasRolePermissions > 0
    ) {
      throw ApiError.badRequest(
        "Cannot delete Service Provider with existing related records"
      );
    }

    await Prisma.serviceProvider.delete({ where: { id } });
    logger.info("Service Provider deleted", { id });
    return { message: "Service Provider deleted successfully" };
  }
}
