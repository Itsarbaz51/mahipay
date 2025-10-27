import { CommissionType, CommissionScope, ModuleType } from "@prisma/client";
import { z } from "zod";

class CommissionValidationSchemas {
  static get createOrUpdateCommissionSettingSchema() {
    return z.object({
      scope: z.nativeEnum(CommissionScope),
      roleId: z.string().uuid().optional(),
      targetUserId: z.string().uuid().optional(),
      serviceId: z.string().uuid().optional(),
      moduleType: z.nativeEnum(ModuleType),
      subModule: z.string().optional(),
      commissionType: z.nativeEnum(CommissionType),
      commissionValue: z.number().positive(),
      minAmount: z.number().optional(),
      maxAmount: z.number().optional(),
      minUserLevel: z.number().int().optional(),
      applyTDS: z.boolean().optional(),
      tdsPercent: z.number().min(0).max(100).optional(),
      applyGST: z.boolean().optional(),
      gstPercent: z.number().min(0).max(100).optional(),
      channel: z.string().optional(),
      userLevel: z.number().int().optional(),
      effectiveFrom: z.string().datetime().optional(),
      effectiveTo: z.string().datetime().nullable().optional(),
    });
  }

  static get createCommissionEarningSchema() {
    return z.object({
      userId: z.string().uuid({ message: "userId must be a valid UUID" }),
      fromUserId: z
        .string()
        .uuid({ message: "fromUserId must be a valid UUID" })
        .optional(),
      serviceId: z
        .string()
        .uuid({ message: "serviceId must be a valid UUID" })
        .optional(),
      transactionId: z
        .string()
        .uuid({ message: "transactionId must be a valid UUID" }),
      moduleType: z.nativeEnum(ModuleType),
      subModule: z.string().optional(),
      amount: z
        .union([z.number(), z.string()])
        .transform((val) => (typeof val === "string" ? parseInt(val) : val)),
      commissionAmount: z
        .union([z.number(), z.string()])
        .transform((val) => (typeof val === "string" ? parseInt(val) : val)),
      commissionType: z.nativeEnum(CommissionType),
      level: z.number().int().min(1, "level must be at least 1"),
      tdsAmount: z
        .union([z.number(), z.string()])
        .optional()
        .transform((val) =>
          val ? (typeof val === "string" ? parseInt(val) : val) : undefined
        ),
      gstAmount: z
        .union([z.number(), z.string()])
        .optional()
        .transform((val) =>
          val ? (typeof val === "string" ? parseInt(val) : val) : undefined
        ),
      netAmount: z
        .union([z.number(), z.string()])
        .transform((val) => (typeof val === "string" ? parseInt(val) : val)),
    });
  }
}

export default CommissionValidationSchemas;
