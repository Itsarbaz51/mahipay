import { CommissionType } from "@prisma/client";
import { z } from "zod";

class CommissionValidationSchemas {
  static get createOrUpdateCommissionSettingSchema() {
    return z.object({
      scope: z.enum(["ROLE", "USER"]),
      roleId: z.string().uuid().optional(),
      targetUserId: z.string().uuid().optional(),
      serviceId: z.string().uuid(),
      commissionType: z.enum(["FLAT", "PERCENT"]),
      commissionValue: z.number().positive(),
      minAmount: z.number().optional(),
      maxAmount: z.number().optional(),
      applyTDS: z.boolean().optional(),
      tdsPercent: z.number().optional(),
      applyGST: z.boolean().optional(),
      gstPercent: z.number().optional(),
      effectiveFrom: z.string().datetime().optional(),
      effectiveTo: z.string().datetime().nullable().optional(),
    });
  }

  static get createCommissionEarningSchema() {
    return z.object({
      userId: z.string().uuid({ message: "userId must be a valid UUID" }),
      fromUserId: z
        .string()
        .uuid({ message: "fromUserId must be a valid UUID" }),
      serviceId: z.string().uuid({ message: "serviceId must be a valid UUID" }),
      transactionId: z.string().min(1, "transactionId is required"),
      amount: z.number().positive("amount must be greater than 0"),
      commissionAmount: z.number().nonnegative("commissionAmount must be >= 0"),
      commissionType: z.nativeEnum(CommissionType), // ✅ native enum validation
      level: z.number().int().min(1, "level must be at least 1"),
    });
  }
}

export default CommissionValidationSchemas;
