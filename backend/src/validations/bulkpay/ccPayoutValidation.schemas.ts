import { z } from "zod";

class CCPayoutValidationSchemas {
  // Sender Validation
  static get CreateSender() {
    return z.object({
      referenceId: z.string().min(1, "Reference ID is required"),
      name: z.string().min(2, "Name must be at least 2 characters"),
      pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
      aadhar: z
        .string()
        .regex(/^\d{12}$/, "Invalid Aadhar format")
        .optional()
        .or(z.literal("")),
      phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
      cardNo: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
      cvv: z.string().regex(/^\d{3}$/, "CVV must be 3 digits"),
      expiry: z
        .string()
        .regex(/^(0[1-9]|1[0-2])\/\d{4}$/, "Expiry must be in MM/YYYY format"),
    });
  }

  static get UploadCardImage() {
    return z.object({
      senderId: z.string().uuid("Invalid sender ID"),
      cardImageType: z
        .enum(["front", "back"])
        .refine((val) => val === "front" || val === "back", {
          message: "Card image type must be 'front' or 'back'",
        }),
    });
  }

  static get ListSenders() {
    return z.object({
      page: z.number().int().positive().optional().default(1),
      limit: z.number().int().positive().max(100).optional().default(10),
      referenceId: z.string().optional(),
      senderId: z.string().optional(),
    });
  }

  // Beneficiary Validation
  static get CreateBeneficiary() {
    return z.object({
      reference: z.string().min(1, "Reference is required"),
      name: z.string().min(2, "Name must be at least 2 characters"),
      accountNumber: z
        .string()
        .min(9, "Account number must be at least 9 digits")
        .max(18, "Account number must be at most 18 digits"),
      ifsc: z
        .string()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
    });
  }

  static get ListBeneficiaries() {
    return z.object({
      page: z.number().int().positive().optional().default(1),
      limit: z.number().int().positive().max(100).optional().default(10),
      status: z.enum(["PENDING", "ACTIVE", "FAILED", "SUCCESS"]).optional(),
      reference: z.string().optional(),
      beneficiaryId: z.string().optional(),
    });
  }

  // Collection Validation
  static get CreateCollection() {
    return z.object({
      reference: z.string().min(1, "Reference is required"),
      beneficiaryId: z.string().uuid("Invalid beneficiary ID"),
      senderId: z.string().uuid("Invalid sender ID"),
      amount: z.number().positive("Amount must be positive"),
      type: z
        .number()
        .int()
        .min(1)
        .max(2, "Type must be 1 (instant) or 2 (T+1)"),
      redirectUrl: z.string().url("Invalid redirect URL"),
      cardType: z
        .enum(["visa", "rupay", "master"])
        .refine((val) => ["visa", "rupay", "master"].includes(val), {
          message: "Card type must be visa, rupay, or master",
        }),

      additionalCharge: z
        .number()
        .nonnegative("Additional charge must be non-negative")
        .optional(),
    });
  }

  static get ListCollections() {
    return z.object({
      page: z.number().int().positive().optional().default(1),
      limit: z.number().int().positive().max(100).optional().default(10),
      beneficiaryId: z.string().optional(),
      reference: z.string().optional(),
      collectionId: z.string().optional(),
    });
  }
}

export default CCPayoutValidationSchemas;
