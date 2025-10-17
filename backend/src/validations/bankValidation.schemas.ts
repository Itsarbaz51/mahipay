import { z } from "zod";

class BankValidationSchemas {
  static get BankSchema() {
    return z.object({
      bankName: z.string().min(2, "Bank name is required"),
      ifscCode: z
        .string()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
      bankIcon: z.string().url("Bank icon must be a valid URL").optional(),
    });
  }

  static get BankUpdateSchema() {
    return this.BankSchema.partial();
  }

  static get BankDetailSchema() {
    return z.object({
      accountHolder: z.string().min(3, "Account holder name is required"),
      accountNumber: z
        .string()
        .min(9, "Account number must be at least 9 digits")
        .max(18, "Account number can't exceed 18 digits"),
      phoneNumber: z
        .string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number can't exceed 15 digits"),
      accountType: z.enum(["PERSONAL", "BUSINESS"]),
      bankId: z.string().uuid("Invalid bank ID"),
      isPrimary: z.coerce.boolean().optional(),
      bankProofFile: z.string().optional(),
    });
  }

  static get BankDetailUpdateSchema() {
    return this.BankDetailSchema.partial();
  }
}

export default BankValidationSchemas;
