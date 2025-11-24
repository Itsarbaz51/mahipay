class PermissionRegistry {
  // Core Modules
  static USER_MANAGEMENT = [
    "user:create",
    "user:view",
    "user:update",
    "user:delete",
    "user:manage",
  ];
  static EMPLOYEE_MANAGEMENT = [
    "employee:create",
    "employee:view",
    "employee:update",
    "employee:delete",
    "employee:manage",
  ];
  static WALLET_MANAGEMENT = [
    "wallet:view",
    "wallet:manage",
    "wallet:transfer",
    "wallet:balance:view",
  ];
  static TRANSACTION_MANAGEMENT = [
    "transaction:create",
    "transaction:view",
    "transaction:update",
    "transaction:process",
  ];
  static KYC_MANAGEMENT = [
    "kyc:view",
    "kyc:manage",
    "kyc:verify",
    "kyc:reject",
  ];

  // Business Operations
  static BUSINESS_OPS = [
    "business:dashboard:view",
    "business:report:view",
    "business:analytics:view",
  ];

  // System Management
  static SYSTEM_MGMT = [
    "system:settings:view",
    "system:settings:manage",
    "role:manage",
    "department:manage",
  ];

  // Get all permissions as flat array
  static getAllPermissions() {
    return [
      ...this.USER_MANAGEMENT,
      ...this.EMPLOYEE_MANAGEMENT,
      ...this.WALLET_MANAGEMENT,
      ...this.TRANSACTION_MANAGEMENT,
      ...this.KYC_MANAGEMENT,
      ...this.BUSINESS_OPS,
      ...this.SYSTEM_MGMT,
    ];
  }

  // Permission groups for easy assignment
  static GROUPS = {
    ROOT_ADMIN: this.getAllPermissions(),
    BUSINESS_ADMIN: [
      ...this.USER_MANAGEMENT,
      ...this.WALLET_MANAGEMENT,
      ...this.TRANSACTION_MANAGEMENT,
      ...this.BUSINESS_OPS,
      ...this.KYC_MANAGEMENT,
    ],
    DEPARTMENT_MANAGER: [
      "user:view",
      "employee:view",
      "employee:manage",
      "transaction:view",
      "department:manage",
    ],
    EMPLOYEE_BASIC: [
      "user:view",
      "transaction:view",
      "wallet:view",
      "kyc:view",
    ],
  };

  static isValid(permission) {
    return this.getAllPermissions().includes(permission);
  }

  static getCategory(permission) {
    const categories = {
      USER_MANAGEMENT: this.USER_MANAGEMENT,
      EMPLOYEE_MANAGEMENT: this.EMPLOYEE_MANAGEMENT,
      WALLET_MANAGEMENT: this.WALLET_MANAGEMENT,
      TRANSACTION_MANAGEMENT: this.TRANSACTION_MANAGEMENT,
      KYC_MANAGEMENT: this.KYC_MANAGEMENT,
      BUSINESS_OPS: this.BUSINESS_OPS,
      SYSTEM_MGMT: this.SYSTEM_MGMT,
    };

    return (
      Object.keys(categories).find((cat) =>
        categories[cat].includes(permission)
      ) || "OTHER"
    );
  }
}

export default PermissionRegistry;
