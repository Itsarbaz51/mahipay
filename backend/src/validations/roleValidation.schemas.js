import { z } from "zod";

class RoleValidationSchemas {
  static get store() {
    return z.object({
      name: z
        .string()
        .trim()
        .min(1, "Role name is required")
        .max(50, "Role name is too long")
        .regex(/^[A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)*$/, {
          message:
            'Role name must start with capital letters (e.g. "Admin", "Super Admin")',
        }),
      description: z.string().trim().max(2000).nullable().optional(),
      level: z.number().int().positive().optional(),
    });
  }

  static get update() {
    return z.object({
      name: z
        .string()
        .trim()
        .min(1, "Role name is required")
        .max(50, "Role name is too long")
        .regex(/^[A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)*$/, {
          message:
            'Role name must start with capital letters (e.g. "Admin", "Super Admin")',
        })
        .optional(),
      description: z.string().trim().max(2000).nullable().optional(),
      level: z.number().int().positive().optional(),
    });
  }
}

export default RoleValidationSchemas;