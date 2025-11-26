// validations/departmentValidation.schemas.js
import { z } from "zod";

export const getAllDepartmentsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10)),
    search: z.string().optional(),
  }),
});

export const upsertDepartmentSchema = z
  .object({
    body: z.object({
      id: z.string().uuid("Invalid department ID format").optional(),
      name: z
        .string()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name must not exceed 100 characters")
        .regex(
          /^[a-zA-Z0-9_ \-&]+$/,
          "Name can only contain letters, numbers, spaces, hyphens, ampersands and underscores"
        )
        .optional(),
      description: z
        .string()
        .max(2000, "Description must not exceed 2000 characters")
        .optional()
        .nullable(),
      hierarchyLevel: z
        .number()
        .int("Hierarchy level must be an integer")
        .min(1, "Hierarchy level must be at least 1")
        .optional(),
    }),
  })
  .refine(
    (data) => {
      // If no ID provided (create operation), name is required
      if (!data.body.id) {
        return data.body.name !== undefined;
      }
      return true;
    },
    {
      message: "Name is required when creating a new department",
      path: ["body", "name"],
    }
  )
  .refine(
    (data) => {
      // If hierarchy level is provided, it must be valid
      if (data.body.hierarchyLevel !== undefined) {
        return data.body.hierarchyLevel >= 1;
      }
      return true;
    },
    {
      message: "Hierarchy level must be at least 1",
      path: ["body", "hierarchyLevel"],
    }
  );

export const deleteDepartmentSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid department ID format"),
  }),
});
