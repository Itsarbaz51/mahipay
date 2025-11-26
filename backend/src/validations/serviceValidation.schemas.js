import { z } from "zod";

// Base service assignment schema
const baseServiceAssignmentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  integrationId: z.string().min(1, "Integration ID is required"),
  serviceName: z
    .string()
    .min(1, "Service name is required")
    .max(255, "Service name too long"),
  hierarchyLevel: z.number().int().min(0).optional().default(0),
  hierarchyPath: z
    .string()
    .min(1, "Hierarchy path is required")
    .optional()
    .default("0"),
});

// Service Assignment - Handles both Single and Bulk
export const assignServicesSchema = z.object({
  body: z.union([
    // Single assignment
    baseServiceAssignmentSchema,
    // Bulk assignment
    z
      .array(baseServiceAssignmentSchema)
      .min(1, "At least one assignment required")
      .max(100, "Maximum 100 assignments allowed"),
  ]),
});

// Update Service Status - Handles both Single and Bulk
export const updateServiceStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Service ID is required").optional(),
  }),
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
    serviceIds: z.array(z.string().min(1)).optional(), // For bulk operations
  }),
});

// Delete Services - Handles both Single and Bulk
export const deleteServicesSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Service ID is required").optional(),
  }),
  body: z.object({
    serviceIds: z.array(z.string().min(1)).optional(), // For bulk operations
  }),
});

// Get services with filters
export const getServicesSchema = z.object({
  query: z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "ALL"]).optional().default("ALL"),
    userId: z.string().optional(),
    platformName: z.string().optional(),
    serviceName: z.string().optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10)),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});
