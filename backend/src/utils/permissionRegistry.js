import models from "../models/index.js";

class PermissionRegistry {
  // Permission definitions
  static PERMISSIONS = {
    USER_MANAGEMENT: [
      "user:create",
      "user:view",
      "user:update",
      "user:delete",
      "user:manage",
      "user:update:credentials",
      "user:update:profile:image",
    ],
    EMPLOYEE_MANAGEMENT: [
      "employee:create",
      "employee:view",
      "employee:update",
      "employee:delete",
      "employee:manage",
      "employee:update:credentials",
    ],
    WALLET_MANAGEMENT: [
      "wallet:view",
      "wallet:manage",
      "wallet:transfer",
      "wallet:balance:view",
    ],
    TRANSACTION_MANAGEMENT: [
      "transaction:create",
      "transaction:view",
      "transaction:update",
      "transaction:process",
    ],
    KYC_MANAGEMENT: ["kyc:view", "kyc:manage", "kyc:verify", "kyc:reject"],
    DEPARTMENT_MANAGEMENT: [
      "department:create",
      "department:view",
      "department:update",
      "department:delete",
      "department:manage",
    ],
    ROLE_MANAGEMENT: [
      "role:create",
      "role:view",
      "role:update",
      "role:delete",
      "role:manage",
    ],
    SERVICE_MANAGEMENT: [
      "service:create",
      "service:view",
      "service:update",
      "service:delete",
      "service:manage",
    ],
    COMMISSION_MANAGEMENT: [
      "commission:view",
      "commission:manage",
      "commission:setting:update",
    ],
    SYSTEM_MANAGEMENT: [
      "system:settings:view",
      "system:settings:manage",
      "audit:view",
    ],
  };

  // Get all permissions as flat array
  static getAllPermissions() {
    return Object.values(this.PERMISSIONS).flat();
  }

  // Validate permission format
  static isValid(permission) {
    return this.getAllPermissions().includes(permission);
  }

  // Get effective permissions for BUSINESS USER (RolePermissions + UserPermissions)
  static async getUserEffectivePermissions(userId, models) {
    try {
      const [userPermissions, userWithRole] = await Promise.all([
        models.UserPermission.findAll({
          where: {
            user_id: userId,
            is_active: true,
            revoked_at: null,
          },
          attributes: ["permission", "service_id"],
          raw: true,
        }),
        models.User.findByPk(userId, {
          include: [
            {
              association: "role",
              include: [
                {
                  association: "rolePermissions",
                  where: { is_active: true, revoked_at: null },
                  required: false,
                  attributes: ["permission", "service_id"],
                },
              ],
            },
          ],
        }),
      ]);

      const rolePermissions = userWithRole?.role?.rolePermissions || [];
      return this.mergePermissions(
        rolePermissions,
        userPermissions,
        "role",
        "user"
      );
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      return [];
    }
  }

  // Get effective permissions for EMPLOYEE (DepartmentPermissions + EmployeePermissions)
  static async getEmployeeEffectivePermissions(employeeId, models) {
    try {
      const [employeePermissions, employeeWithDept] = await Promise.all([
        models.EmployeePermission.findAll({
          where: {
            employee_id: employeeId,
            is_active: true,
            revoked_at: null,
          },
          attributes: ["permission"],
          raw: true,
        }),
        models.Employee.findByPk(employeeId, {
          include: [
            {
              association: "department",
              include: [
                {
                  association: "departmentPermissions",
                  where: { is_active: true, revoked_at: null },
                  required: false,
                  attributes: ["permission"],
                },
              ],
            },
          ],
        }),
      ]);

      const deptPermissions =
        employeeWithDept?.department?.departmentPermissions || [];
      return this.mergePermissions(
        deptPermissions,
        employeePermissions,
        "department",
        "employee"
      );
    } catch (error) {
      console.error("Error fetching employee permissions:", error);
      return [];
    }
  }

  // Merge base permissions with override permissions
  static mergePermissions(
    basePermissions,
    overridePermissions,
    baseSource,
    overrideSource
  ) {
    const permissionMap = new Map();

    // Add base permissions first
    basePermissions.forEach((perm) => {
      const key = `${perm.permission}-${perm.service_id || "global"}`;
      permissionMap.set(key, {
        permission: perm.permission,
        serviceId: perm.service_id,
        source: baseSource,
      });
    });

    // Override with specific permissions
    overridePermissions.forEach((perm) => {
      const key = `${perm.permission}-${perm.service_id || "global"}`;
      permissionMap.set(key, {
        permission: perm.permission,
        serviceId: perm.service_id,
        source: overrideSource,
      });
    });

    return Array.from(permissionMap.values());
  }

  // Check if user has specific permission
  static async hasPermission(user, permission, serviceId = null) {
    if (!user || !permission) return false;

    // ROOT has all permissions
    if (user.userType === "ROOT") return true;

    if (!this.isValid(permission)) return false;

    let effectivePerms = [];
    try {
      if (user.userType === "BUSINESS") {
        effectivePerms = await this.getUserEffectivePermissions(
          user.id,
          models
        );
      } else if (user.userType === "EMPLOYEE") {
        effectivePerms = await this.getEmployeeEffectivePermissions(
          user.id,
          models
        );
      } else {
        return false;
      }

      return effectivePerms.some(
        (perm) =>
          perm.permission === permission &&
          (serviceId === null ||
            perm.serviceId === null ||
            perm.serviceId === serviceId)
      );
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  // Check if user has all of the given permissions
  static async hasAllPermissions(user, permissions, serviceId = null) {
    if (user.userType === "ROOT") return true;

    for (const permission of permissions) {
      if (!(await this.hasPermission(user, permission, serviceId))) {
        return false;
      }
    }
    return true;
  }
}

export default PermissionRegistry;
