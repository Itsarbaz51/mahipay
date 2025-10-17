import Prisma from "../db/db.js";
import type {
  CreateServiceInput,
  deactivateInput,
  ProviderCredentialInput,
  UpdateServiceInput,
} from "../types/serivce.type.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/WinstonLogger.js";
import type {
  ServiceProviderInput,
  ServiceProviderUpdateInput,
  ProviderRateCardInput,
} from "../types/serivce.type.js";

export class ServiceService {
  // ✅ Create a new service
  static async create(data: CreateServiceInput) {
    const [existingCode, existingName] = await Promise.all([
      Prisma.service.findUnique({ where: { code: data.code } }),
      Prisma.service.findUnique({ where: { name: data.name } }),
    ]);

    if (existingCode) throw ApiError.badRequest("Service code already exists");
    if (existingName) throw ApiError.badRequest("Service name already exists");

    const service = await Prisma.service.create({ data });

    logger.info("Service created", { id: service.id });

    return service;
  }

  // ✅ Get all services
  static async getAll() {
    const services = await Prisma.service.findMany({
      orderBy: { createdAt: "desc" },
    });
    return services;
  }

  // ✅ Get service by ID
  static async getById(id: string) {
    const service = await Prisma.service.findUnique({ where: { id } });
    if (!service) throw ApiError.notFound("Service not found");
    return service;
  }

  // ✅ Update service
  static async update(id: string, data: UpdateServiceInput) {
    const existing = await Prisma.service.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Service not found");

    const updated = await Prisma.service.update({
      where: { id },
      data,
    });

    logger.info("Service updated", { id });
    return updated;
  }

  // ✅ Soft delete or deactivate service
  static async deactivate(id: string, statusInput: deactivateInput) {
    const existing = await Prisma.service.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Service not found");

    if (!statusInput.status) {
      throw ApiError.badRequest("Status is required to deactivate service");
    }

    const updated = await Prisma.service.update({
      where: { id },
      data: { status: statusInput.status },
    });

    logger.info("Service deactivated", { id });
    return updated;
  }
}

export class ServiceProviderService {
  static async create(data: ServiceProviderInput) {
    const existing = await Prisma.serviceProvider.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }],
      },
    });

    if (existing) {
      throw ApiError.badRequest(
        `Service Provider with name/code already exists (${existing.name} - ${existing.code})`
      );
    }

    const provider = await Prisma.serviceProvider.create({
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        isActive: data.isActive ?? true,
      },
    });

    logger.info("Service Provider created", { id: provider.id });
    return provider;
  }

  static async list() {
    return Prisma.serviceProvider.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: string) {
    const provider = await Prisma.serviceProvider.findUnique({
      where: { id },
      include: {
        credentials: true,
        ratecards: true,
      },
    });

    if (!provider) throw ApiError.notFound("Service Provider not found");
    return provider;
  }

  static async update(id: string, data: ServiceProviderUpdateInput) {
    const existing = await Prisma.serviceProvider.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Service Provider not found");

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== null)
    );

    const updated = await Prisma.serviceProvider.update({
      where: { id },
      data: cleanData,
    });

    logger.info("Service Provider updated", { id });
    return updated;
  }

  static async delete(id: string) {
    const existing = await Prisma.serviceProvider.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Service Provider not found");

    const deleted = await Prisma.serviceProvider.delete({ where: { id } });
    logger.info("Service Provider deleted", { id });
    return deleted;
  }
}

export class ProviderRateCardService {
  static async createOrUpdate(data: ProviderRateCardInput) {
    // Validate provider and service exist
    const [provider, service] = await Promise.all([
      Prisma.serviceProvider.findUnique({ where: { id: data.providerId } }),
      Prisma.service.findUnique({ where: { id: data.serviceId } }),
    ]);

    if (!provider) throw ApiError.notFound("Service Provider not found");
    if (!service) throw ApiError.notFound("Service not found");

    const effectiveFromDate = data.effectiveFrom
      ? new Date(data.effectiveFrom)
      : new Date();
    const effectiveToDate = data.effectiveTo
      ? new Date(data.effectiveTo)
      : null;

    const prismaData = {
      providerId: data.providerId,
      serviceId: data.serviceId,
      fixedCharge:
        data.rateType === "FLAT" ? BigInt(data.rateValue * 100) : null,
      percentCharge: data.rateType === "PERCENTAGE" ? data.rateValue : null,
      minCharge: data.minAmount ? BigInt(data.minAmount * 100) : null,
      maxCharge: data.maxAmount ? BigInt(data.maxAmount * 100) : null,
      effectiveFrom: effectiveFromDate,
      effectiveTo: effectiveToDate,
      updatedAt: new Date(),
    };

    // Upsert by provider + service + effectiveFrom
    const rateCard = await Prisma.providerRateCard.upsert({
      where: {
        providerId_serviceId_effectiveFrom: {
          providerId: data.providerId,
          serviceId: data.serviceId,
          effectiveFrom: effectiveFromDate,
        },
      },
      update: prismaData,
      create: {
        ...prismaData,
        createdAt: new Date(),
      },
    });

    logger.info("Provider rate card upserted", { id: rateCard.id });
    return rateCard;
  }

  static async list() {
    return Prisma.providerRateCard.findMany({
      include: {
        provider: true,
        service: true,
      },
      orderBy: {
        effectiveFrom: "desc",
      },
    });
  }

  static async getByProvider(providerId: string) {
    const provider = await Prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });
    if (!provider) throw ApiError.notFound("Service Provider not found");

    return Prisma.providerRateCard.findMany({
      where: { providerId },
      include: {
        provider: true,
        service: true,
      },
      orderBy: {
        effectiveFrom: "desc",
      },
    });
  }

  static async getById(id: string) {
    const rateCard = await Prisma.providerRateCard.findUnique({
      where: { id },
      include: {
        provider: true,
        service: true,
      },
    });

    if (!rateCard) throw ApiError.notFound("Rate card not found");

    return rateCard;
  }
}

export class ProviderCredentialService {
  static async upsertCredential(data: ProviderCredentialInput) {
    const provider = await Prisma.serviceProvider.findUnique({
      where: { id: data.providerId },
    });
    if (!provider) throw ApiError.notFound("Service Provider not found");

    const credential = await Prisma.providerCredential.upsert({
      where: {
        providerId_env: {
          providerId: data.providerId,
          env: data.env,
        },
      },
      update: {
        keyName: data.keyName,
        keyVaultRef: data.keyVaultRef,
        meta: data.meta ? JSON.stringify(data.meta) : null,
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      },
      create: {
        providerId: data.providerId,
        env: data.env,
        keyName: data.keyName,
        keyVaultRef: data.keyVaultRef,
        meta: data.meta ? JSON.stringify(data.meta) : null,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    logger.info("Provider credential upserted", { id: credential.id });
    return credential;
  }

  static async list() {
    return Prisma.providerCredential.findMany({
      include: { provider: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getByProvider(providerId: string) {
    const provider = await Prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });
    if (!provider) throw ApiError.notFound("Service Provider not found");

    return Prisma.providerCredential.findMany({
      where: { providerId },
      include: { provider: true },
    });
  }

  static async getById(id: string) {
    const credential = await Prisma.providerCredential.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!credential) throw ApiError.notFound("Credential not found");
    return credential;
  }

  static async delete(id: string) {
    const existing = await Prisma.providerCredential.findUnique({
      where: { id },
    });
    if (!existing) throw ApiError.notFound("Credential not found");

    const deleted = await Prisma.providerCredential.delete({ where: { id } });
    logger.info("Provider credential deleted", { id });
    return deleted;
  }
}
