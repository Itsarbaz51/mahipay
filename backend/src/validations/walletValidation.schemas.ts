import { z } from "zod";

class WallletValidationSchemas {
  static get walletCreditSchema() {
    return z.object({
      userId: z.string().uuid({ message: "Valid user ID is required" }),
      amount: z.number().positive({ message: "Amount must be positive" }),
      narration: z
        .string()
        .min(1, { message: "Narration is required" })
        .optional(),
    });
  }

  static get walletDebitSchema() {
    return z.object({
      userId: z.string().uuid({ message: "Valid user ID is required" }),
      amount: z.number().positive({ message: "Amount must be positive" }),
      narration: z
        .string()
        .min(1, { message: "Narration is required" })
        .optional(),
    });
  }

  static get getWalletSchema() {
    return z.object({
      userId: z.string().uuid({ message: "Valid user ID is required" }),
    });
  }

  static get walletTransactionsSchema() {
    return z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
    });
  }
}

export default WallletValidationSchemas;
