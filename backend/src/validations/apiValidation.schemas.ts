import { z } from "zod";

// Optional URL / string
export const optionalStringUrl = z
  .string()
  .url("Invalid URL format")
  .optional()
  .nullable();

class ApiKeyValidationSchemas {
  // Create API Key
  static get CreateApiKey() {
    return z.object({
      userId: z.string().uuid("Invalid userId"),
      label: z.string().optional(),
      expiresAt: z
        .string()
        .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date")
        .optional(),
    });
  }

  // Add Service to API Key
  static get AddService() {
    return z.object({
      apiKeyId: z.string().uuid("Invalid apiKeyId"),
      serviceId: z.string().uuid("Invalid serviceId"),
      rateLimit: z.number().int().positive().optional(),
      callbackUrl: optionalStringUrl,
    });
  }

  // Add IP Whitelist
  static get AddIpWhitelist() {
    return z.object({
      apiKeyId: z.string().uuid("Invalid apiKeyId"),
      ip: z
        .string()
        .regex(
          /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/,
          "Invalid IP or CIDR format"
        ),
      note: z.string().optional(),
    });
  }

  // API Key ID param validation
  static get ApiKeyIdParam() {
    return z.object({
      id: z.string().uuid("Invalid API key id"),
    });
  }

  // Filter / Pagination
  static get FilterParams() {
    return z.object({
      userId: z.string().uuid("Invalid userId"),
      isActive: z.boolean().optional(),
      page: z.number().int().optional().default(1),
      limit: z.number().int().optional().default(10),
      sort: z.enum(["asc", "desc"]).optional().default("desc"),
    });
  }
}

export default ApiKeyValidationSchemas;
