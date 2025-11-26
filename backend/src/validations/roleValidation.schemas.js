import { z } from "zod";

export const getAllRolesByTypeSchema = z.object({
  params: z.object({
    type: z.enum(["employee", "business"], {
      errorMap: () => ({
        message: "Type must be either 'employee' or 'business'",
      }),
    }),
  }),
});

export const upsertRoleSchema = z
  .object({
    body: z.object({
      id: z.string().uuid("Invalid role ID format").optional(),
      name: z
        .string()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name must not exceed 50 characters")
        .regex(
          /^[a-zA-Z0-9_ ]+$/,
          "Name can only contain letters, numbers, spaces and underscores"
        )
        .optional(),
      description: z
        .string()
        .max(1000, "Description must not exceed 1000 characters")
        .optional()
        .nullable(),
      type: z.enum(["employee", "business"], {
        errorMap: () => ({
          message: "Type must be either 'employee' or 'business'",
        }),
      }),
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
      message: "Name is required when creating a new role",
      path: ["body", "name"],
    }
  );

export const deleteRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid role ID format"),
  }),
  body: z.object({
    type: z
      .enum(["employee", "business"], {
        errorMap: () => ({
          message: "Type must be either 'employee' or 'business'",
        }),
      })
      .optional(),
  }),
});
