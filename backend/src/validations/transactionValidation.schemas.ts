import { z } from "zod";

export class TransactionValidationSchemas {
  static get createTransactionSchema() {
    return z.object({
      userId: z.string().uuid({ message: "Valid user ID is required" }),
      walletId: z.string().uuid({ message: "Valid wallet ID is required" }),
      serviceId: z.string().uuid({ message: "Valid service ID is required" }),
      providerId: z
        .string()
        .uuid({ message: "Valid provider ID is required" })
        .optional(),
      amount: z.number().positive({ message: "Amount must be positive" }),
      commissionAmount: z
        .number()
        .nonnegative({ message: "Commission amount must be non-negative" })
        .default(0),
      idempotencyKey: z
        .string()
        .min(1, { message: "Idempotency key must not be empty" })
        .optional(),
      referenceId: z.string().optional(),
      requestPayload: z.record(z.string(), z.any()).optional(),
    });
  }

  static get refundTransactionSchema() {
    return z.object({
      transactionId: z
        .string()
        .uuid({ message: "Valid transaction ID is required" }),
      initiatedBy: z.string().uuid({ message: "Valid user ID is required" }),
      amount: z.number().positive({ message: "Amount must be positive" }),
      reason: z.string().min(1, { message: "Reason is required" }).optional(),
    });
  }

  static get getTransactionsSchema() {
    return z.object({
      userId: z.string().uuid().optional(),
      status: z.string().optional(),
      serviceId: z.string().uuid().optional(),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
    });
  }

  static get updateTransactionStatusSchema() {
    return z.object({
      transactionId: z
        .string()
        .uuid({ message: "Valid transaction ID is required" }),
      status: z.enum(["SUCCESS", "FAILED"], {
        message: "Status must be either SUCCESS or FAILED",
      }),
      responsePayload: z.record(z.string(), z.any()).optional(),
    });
  }
}
