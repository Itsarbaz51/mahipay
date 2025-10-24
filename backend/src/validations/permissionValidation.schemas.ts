import { z } from "zod";

class PermissionValidationSchemas {
  static get createOrUpdateRolePermission() {
    return z.object({
      roleId: z.string().uuid("Invalid user ID"),
      serviceIds: z
        .array(z.string().uuid("Invalid service ID"))
        .min(1, "At least one service is required"),
      canView: z.boolean().default(false),
      canEdit: z.boolean().default(false),
      canSetCommission: z.boolean().default(false),
    });
  }
  static get createOrUpdateUserPermission() {
    return z.object({
      userId: z.string().uuid("Invalid user ID"),
      serviceIds: z
        .array(z.string().uuid("Invalid service ID"))
        .min(1, "At least one service is required"),
      canView: z.boolean().default(false),
      canEdit: z.boolean().default(false),
      canSetCommission: z.boolean().default(false),
    });
  }
}

export default PermissionValidationSchemas;
