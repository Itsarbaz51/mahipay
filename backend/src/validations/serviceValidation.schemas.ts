import { z } from "zod";
import { ServiceStatus } from "@prisma/client";

class ServiceValidationSchemas {
  static get create() {
    return z.object({
      name: z
        .string()
        .min(2, { message: "Service name must be at least 2 characters" }),
      code: z
        .string()
        .min(2, { message: "Service code must be at least 2 characters" })
        .max(10, { message: "Service code must not exceed 10 characters" }),
      description: z.string().optional(),
      status: z
        .nativeEnum(ServiceStatus)
        .optional()
        .default(ServiceStatus.ACTIVE),
    });
  }

  static get update() {
    return z.object({
      name: z
        .string()
        .min(2, { message: "Name must be at least 2 characters" })
        .optional(),
      code: z
        .string()
        .min(2, { message: "Code must be at least 2 characters" })
        .max(10, { message: "Code must not exceed 10 characters" })
        .optional(),
      description: z.string().optional(),
      status: z.nativeEnum(ServiceStatus).optional(),
    });
  }

  static get deactivate() {
    return z.object({
      status: z.nativeEnum(ServiceStatus).refine((val) => !!val, {
        message: "Status is required",
      }),
    });
  }

  static get serviceProviderSchema() {
    return z.object({
      name: z
        .string()
        .min(2, { message: "Name must be at least 2 characters long" }),
      code: z
        .string()
        .min(2, { message: "Code must be at least 2 characters" })
        .transform((val) => val.toUpperCase()),
      type: z.string().min(2, {
        message: "Provider type is required (e.g., AEPS, BBPS, DMT)",
      }),
      isActive: z.boolean().optional().default(true),
    });
  }

  static get serviceProviderUpdateSchema() {
    return z.object({
      name: z
        .string()
        .min(2, { message: "Name must be at least 2 characters" })
        .optional(),
      code: z
        .string()
        .min(2, { message: "Code must be at least 2 characters" })
        .transform((v) => v.toUpperCase())
        .optional(),
      type: z
        .string()
        .min(2, { message: "Type must be at least 2 characters" })
        .optional(),
      isActive: z.boolean().optional(),
    });
  }

  static get providerCredentialSchema() {
    return z.object({
      providerId: z.string().uuid({ message: "Invalid provider ID format" }),
      env: z.enum(["PROD", "STAGING"]),
      keyName: z.string().min(1, { message: "keyName is required" }),
      keyVaultRef: z.string().min(1, { message: "keyVaultRef is required" }),
      meta: z.record(z.string(), z.any()).optional(),
      isActive: z.boolean().optional().default(true),
    });
  }

  static get providerRateCardSchema() { 
    return z.object({
      providerId: z.string().uuid({ message: "Invalid provider ID" }),
      serviceId: z.string().uuid({ message: "Invalid service ID" }),
      rateType: z.enum(["FLAT", "PERCENTAGE"]),
      rateValue: z
        .number()
        .nonnegative({ message: "Rate value must be non-negative" }),
      minAmount: z
        .number()
        .nonnegative({ message: "Minimum amount must be non-negative" })
        .optional(),
      maxAmount: z
        .number()
        .nonnegative({ message: "Maximum amount must be non-negative" })
        .optional(),
      effectiveFrom: z
        .string()
        .datetime({ message: "Invalid datetime format" })
        .optional(),
      effectiveTo: z
        .string()
        .datetime({ message: "Invalid datetime format" })
        .optional(),
    });
  }
}

export default ServiceValidationSchemas;
