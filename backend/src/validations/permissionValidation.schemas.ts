import { z } from "zod";

class PermissionValidationSchemas {
  static get createRolePermission() {
    return z.object({
      roleId: z.string().uuid(),
      serviceId: z.string().uuid(),
      canView: z.boolean().default(false),
      canEdit: z.boolean().default(false),
      canSetCommission: z.boolean().default(false),
    });
  }

  static get updateRolePermission() {
    return z.object({
      canView: z.boolean().optional(),
      canEdit: z.boolean().optional(),
      canSetCommission: z.boolean().optional(),
    });
  }

  static get createUserPermission() {
    return z.object({
      userId: z.string().uuid(),
      serviceId: z.string().uuid(),
      canView: z.boolean().default(false),
      canEdit: z.boolean().default(false),
      canSetCommission: z.boolean().default(false),
    });
  }

  static get updateUserPermission() {
    return z.object({
      canView: z.boolean().optional(),
      canEdit: z.boolean().optional(),
      canSetCommission: z.boolean().optional(),
    });
  }
}

export default PermissionValidationSchemas;