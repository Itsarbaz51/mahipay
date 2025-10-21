import { z } from "zod";

export class ServiceValidationSchemas {
  static get createServiceProvider() {
    return z.object({
      type: z.string().min(2, {
        message: "Provider type is required (e.g., AEPS, BBPS, DMT)",
      }),
      code: z
        .string()
        .min(2, {
          message: "Service Provider code must be at least 2 characters",
        })
        .max(50, {
          message: "Service Provider code must not exceed 50 characters",
        })
        .regex(/^[A-Z0-9_]+$/, {
          message:
            "Code can only contain uppercase letters, numbers and underscores",
        }),
      isActive: z.boolean().optional().default(true),
    });
  }
}
