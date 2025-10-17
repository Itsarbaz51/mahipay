import { z } from "zod";

class RoleValidationSchemas {
  static get store() {
    return z.object({
      name: z
        .string()
        .trim()
        .min(1, "Role name is required")
        .max(50, "Role name is too long")
        .regex(/^[A-Z]+(?: [A-Z]+)*$/, {
          message:
            'Role name must be uppercase letters with single spaces (e.g. "ADMIN", "SUPER ADMIN")',
        }),
      description: z.string().trim().max(2000).nullable().optional(),
    });
  }

  static get update() {
    return this.store; // Same validation as store for update
  }
}

export default RoleValidationSchemas;