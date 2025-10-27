// validations/commissionValidation.schemas.ts
import { CommissionType, CommissionScope } from "@prisma/client";
import { z } from "zod";

class CommissionValidationSchemas {
  static get createOrUpdateCommissionSettingSchema() {
    return z.object({
      scope: z.nativeEnum(CommissionScope),
      roleId: z.string().uuid().optional(),
      targetUserId: z.string().uuid().optional(),
      serviceId: z.string().uuid().optional(),
      commissionType: z.nativeEnum(CommissionType),
      commissionValue: z.number().positive(),
      minAmount: z.number().nonnegative().optional(),
      maxAmount: z.number().nonnegative().optional(),
      applyTDS: z.boolean().optional(),
      tdsPercent: z.number().min(0).max(100).optional(),
      applyGST: z.boolean().optional(),
      gstPercent: z.number().min(0).max(100).optional(),
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
      amount: z.number().positive(),
      commissionAmount: z.number().positive(),
      commissionType: z.nativeEnum(CommissionType),
      tdsAmount: z.number().nonnegative().optional().default(0),
      gstAmount: z.number().nonnegative().optional().default(0),
      netAmount: z.number().positive(),
      metadata: z.any().optional(),
    });
  }
}

export default CommissionValidationSchemas;