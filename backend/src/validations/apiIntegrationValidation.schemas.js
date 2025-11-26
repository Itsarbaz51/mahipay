import { z } from "zod";

export const getAllApiIntegrationsSchema = z.object({
  query: z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "ALL"]).optional().default("ALL"),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1))
      .refine((val) => val > 0, "Page must be greater than 0"),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10))
      .refine(
        (val) => val > 0 && val <= 100,
        "Limit must be between 1 and 100"
      ),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    search: z.string().max(100, "Search query too long").optional(),
  }),
});

export const getApiIntegrationByIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, "Integration ID is required")
      .regex(/^\d+$/, "Integration ID must be a number"),
  }),
});

export const createApiIntegrationSchema = z.object({
  body: z.object({
    platformName: z
      .string()
      .min(1, "Platform name is required")
      .max(100, "Platform name too long")
      .regex(
        /^[a-zA-Z0-9\s\-_]+$/,
        "Platform name contains invalid characters"
      ),
    serviceName: z
      .string()
      .min(1, "Service name is required")
      .max(100, "Service name too long")
      .regex(/^[a-zA-Z0-9\s\-_]+$/, "Service name contains invalid characters"),
    apiBaseUrl: z
      .string()
      .url("Invalid API base URL format")
      .max(500, "API base URL too long"),
    credentials: z
      .record(z.any())
      .refine((obj) => Object.keys(obj).length > 0, "Credentials are required")
      .refine((obj) => {
        const requiredKeys = ["apiKey", "secretKey", "merchantId"];
        return requiredKeys.some((key) => key in obj);
      }, "At least one credential key (apiKey, secretKey, or merchantId) is required"),
  }),
});

export const updateApiIntegrationSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, "Integration ID is required")
      .regex(/^\d+$/, "Integration ID must be a number"),
  }),
  body: z.object({
    platformName: z
      .string()
      .min(1, "Platform name is required")
      .max(100, "Platform name too long")
      .regex(/^[a-zA-Z0-9\s\-_]+$/, "Platform name contains invalid characters")
      .optional(),
    serviceName: z
      .string()
      .min(1, "Service name is required")
      .max(100, "Service name too long")
      .regex(/^[a-zA-Z0-9\s\-_]+$/, "Service name contains invalid characters")
      .optional(),
    apiBaseUrl: z
      .string()
      .url("Invalid API base URL format")
      .max(500, "API base URL too long")
      .optional(),
    credentials: z
      .record(z.any())
      .refine(
        (obj) => Object.keys(obj).length === 0 || Object.keys(obj).length > 0,
        "Credentials object cannot be empty if provided"
      )
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

export const toggleApiIntegrationStatusSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, "Integration ID is required")
      .regex(/^\d+$/, "Integration ID must be a number"),
  }),
});

export const apiIntegrationCredentialsSchema = z
  .object({
    apiKey: z
      .string()
      .min(10, "API key must be at least 10 characters")
      .max(500, "API key too long")
      .optional(),
    secretKey: z
      .string()
      .min(10, "Secret key must be at least 10 characters")
      .max(500, "Secret key too long")
      .optional(),
    merchantId: z
      .string()
      .min(5, "Merchant ID must be at least 5 characters")
      .max(100, "Merchant ID too long")
      .optional(),
    username: z.string().max(100, "Username too long").optional(),
    password: z.string().max(500, "Password too long").optional(),
    accessToken: z.string().max(1000, "Access token too long").optional(),
    refreshToken: z.string().max(1000, "Refresh token too long").optional(),
  })
  .refine(
    (data) => {
      const hasRequiredFields =
        data.apiKey || data.secretKey || data.merchantId || data.accessToken;
      return hasRequiredFields;
    },
    {
      message:
        "At least one credential field (apiKey, secretKey, merchantId, or accessToken) is required",
    }
  );
