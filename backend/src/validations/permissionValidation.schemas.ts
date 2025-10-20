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
  static get createOrUpdateUserPermission() {
    return z.object({
      userId: z.string().uuid("Invalid user ID"),
      serviceId: z
        .array(z.string().uuid("Invalid service ID"))
        .min(1, "At least one service is required"),
      canView: z.boolean().default(false),
      canEdit: z.boolean().default(false),
      canSetCommission: z.boolean().default(false),
    });
  }
}

export default PermissionValidationSchemas;
