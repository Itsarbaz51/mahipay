export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customerId: {
        type: DataTypes.STRING(8),
        field: "customer_id",
        allowNull: false,
        unique: true,
        defaultValue: function () {
          return String(Math.floor(10000000 + Math.random() * 90000000));
        },
        validate: {
          len: [8, 8], // Ensure exactly 8 characters
        },
      },
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 50],
        },
      },
      firstName: {
        type: DataTypes.STRING,
        field: "first_name",
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },
      lastName: {
        type: DataTypes.STRING,
        field: "last_name",
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },
      profileImage: {
        type: DataTypes.TEXT,
        field: "profile_image",
        allowNull: true,
        validate: {
          isUrl: true, // Optional: validate URL format
        },
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      phoneNumber: {
        type: DataTypes.STRING,
        unique: true,
        field: "phone_number",
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [6, 255], // Minimum password length
        },
      },
      transactionPin: {
        type: DataTypes.STRING, // Changed from TEXT to STRING for pins
        field: "transaction_pin",
        allowNull: true,
        validate: {
          len: [4, 6], // Typical pin lengths
        },
      },
      parentId: {
        type: DataTypes.UUID,
        field: "parent_id",
        allowNull: true,
      },
      hierarchyLevel: {
        type: DataTypes.INTEGER,
        field: "hierarchy_level",
        allowNull: false, // Removed unique constraint - multiple users can have same level
        validate: {
          min: 0,
        },
      },
      hierarchyPath: {
        type: DataTypes.TEXT, // Changed to TEXT for potentially long paths
        field: "hierarchy_path",
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"),
        defaultValue: "ACTIVE",
        validate: {
          isIn: [["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"]],
        },
      },
      isKycVerified: {
        type: DataTypes.BOOLEAN,
        field: "is_kyc_verified",
        defaultValue: false,
      },
      roleId: {
        type: DataTypes.UUID,
        field: "role_id",
        allowNull: false,
      },
      refreshToken: {
        type: DataTypes.TEXT,
        field: "refresh_token",
        allowNull: true,
      },
      passwordResetToken: {
        type: DataTypes.STRING,
        field: "password_reset_token",
        allowNull: true,
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        field: "password_reset_expires",
        allowNull: true,
      },
      emailVerificationToken: {
        type: DataTypes.STRING,
        field: "email_verification_token",
        allowNull: true,
      },
      emailVerifiedAt: {
        type: DataTypes.DATE,
        field: "email_verified_at",
        allowNull: true,
      },
      emailVerificationTokenExpires: {
        type: DataTypes.DATE,
        field: "email_verification_token_expires",
        allowNull: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        field: "last_login_at",
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at",
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        field: "deleted_at",
        allowNull: true,
      },
      deactivationReason: {
        type: DataTypes.TEXT,
        field: "deactivation_reason",
        allowNull: true,
      },
      createdById: {
        type: DataTypes.UUID,
        field: "created_by_id",
        allowNull: true,
      },
      createdByType: {
        type: DataTypes.ENUM("USER", "ROOT"),
        field: "created_by_type",
        defaultValue: "USER",
        allowNull: false,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [
        {
          fields: ["parent_id"],
        },
        {
          unique: true,
          fields: ["customer_id"],
        },
        {
          fields: ["hierarchy_level"],
        },
        {
          fields: ["hierarchy_path"],
        },
        {
          unique: true,
          fields: ["phone_number"],
        },
        {
          fields: ["role_id"],
        },
        {
          unique: true,
          fields: ["username"],
        },
        {
          unique: true,
          fields: ["email"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["created_at"],
        },
        {
          fields: ["created_by_id"],
        },
        {
          fields: ["created_by_type"],
        },
      ],
    }
  );

  User.associate = function (models) {
    User.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      as: "creatorRoot",
      constraints: false,
      scope: { created_by_type: "ROOT" },
    });

    User.belongsTo(User, {
      foreignKey: "created_by_id",
      as: "creatorUser",
      constraints: false,
      scope: { created_by_type: "USER" },
    });

    // Hierarchical self-reference
    User.belongsTo(User, {
      foreignKey: "parent_id",
      as: "parent",
      onDelete: "RESTRICT",
    });
    User.hasMany(User, {
      foreignKey: "parent_id",
      as: "children",
      onDelete: "CASCADE",
    });

    // Business relations
    User.belongsTo(models.Role, {
      foreignKey: "role_id",
      as: "role",
      onDelete: "RESTRICT",
    });
    User.hasMany(models.Wallet, {
      foreignKey: "user_id",
      as: "wallets",
      onDelete: "CASCADE",
    });
    User.hasMany(models.BankDetail, {
      foreignKey: "user_id",
      as: "bankAccounts",
      onDelete: "CASCADE",
    });

    // KYC Relations
    User.hasOne(models.UserKyc, {
      foreignKey: "user_id",
      as: "userKyc",
      onDelete: "CASCADE",
    });
    User.hasOne(models.BusinessKyc, {
      foreignKey: "user_id",
      as: "businessKyc",
      onDelete: "CASCADE",
    });

    // KYC Verification Relations
    User.hasMany(models.UserKyc, {
      foreignKey: "verified_by_id",
      as: "verifiedUserKycs",
      constraints: false,
      scope: {
        verified_by_type: "USER",
      },
    });

    // Transaction relations
    User.hasMany(models.Transaction, {
      foreignKey: "user_id",
      as: "transactions",
      onDelete: "RESTRICT",
    });
    User.hasMany(models.CommissionEarning, {
      foreignKey: "user_id",
      as: "commissionEarnings",
      onDelete: "RESTRICT",
    });
    User.hasMany(models.CommissionEarning, {
      foreignKey: "from_user_id",
      as: "commissionsGiven",
      onDelete: "RESTRICT",
    });
    User.hasMany(models.RootCommissionEarning, {
      foreignKey: "from_user_id",
      as: "rootCommissionsGiven",
      onDelete: "RESTRICT",
    });

    // Permission relations
    User.hasMany(models.UserPermission, {
      foreignKey: "user_id",
      as: "userPermissions",
      onDelete: "CASCADE",
    });
    User.hasMany(models.PiiConsent, {
      foreignKey: "user_id",
      as: "piiConsents",
      onDelete: "CASCADE",
    });
    User.hasMany(models.ApiEntity, {
      foreignKey: "user_id",
      as: "apiEntities",
      onDelete: "CASCADE",
    });
    User.hasMany(models.IpWhitelist, {
      foreignKey: "user_id",
      as: "ipWhitelists",
      onDelete: "CASCADE",
    });

    // FIXED: Service Provider relations
    User.hasMany(models.ServiceProvider, {
      foreignKey: "user_id",
      as: "serviceProviders",
      onDelete: "CASCADE",
    });

    // Management relations
    User.hasMany(models.Employee, {
      foreignKey: "created_by_id",
      as: "employeesCreated",
      constraints: false,
      scope: {
        created_by_type: "USER",
      },
    });
    User.hasMany(models.CommissionSetting, {
      foreignKey: "created_by_id",
      as: "commissionSettingsCreated",
      constraints: false,
      scope: {
        created_by_type: "USER",
      },
    });
    User.hasMany(models.Role, {
      foreignKey: "created_by_id",
      as: "rolesCreated",
      constraints: false,
      scope: {
        created_by_type: "USER",
      },
    });
    User.hasMany(models.CommissionSetting, {
      foreignKey: "target_user_id",
      as: "commissionSettings",
      onDelete: "CASCADE",
    });
    User.hasMany(models.Department, {
      foreignKey: "created_by_id",
      as: "departments",
      constraints: false,
      scope: {
        created_by_type: "USER",
      },
    });
    User.hasMany(models.Employee, {
      foreignKey: "user_id",
      as: "employees",
      onDelete: "SET NULL",
    });

    // Permissions created by Admin User
    User.hasMany(models.RolePermission, {
      foreignKey: "created_by_id",
      as: "createdRolePermissions",
      constraints: false,
      scope: {
        created_by_type: "USER",
      },
    });
    User.hasMany(models.UserPermission, {
      foreignKey: "created_by_id",
      as: "createdUserPermissions",
      constraints: false,
      scope: {
        created_by_type: "USER",
      },
    });
    User.hasMany(models.DepartmentPermission, {
      foreignKey: "created_by_id",
      as: "createdDepartmentPermissions",
      constraints: false,
      scope: {
        created_by_type: "USER",
      },
    });
    User.hasMany(models.EmployeePermission, {
      foreignKey: "created_by_id",
      as: "createdEmployeePermissions",
      constraints: false,
      scope: {
        created_by_type: "USER",
      },
    });
  };

  // Instance methods
  User.prototype.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
  };

  User.prototype.isActive = function () {
    return this.status === "ACTIVE";
  };

  // Class methods
  User.findByEmail = function (email) {
    return this.findOne({ where: { email } });
  };

  User.findByCustomerId = function (customerId) {
    return this.findOne({ where: { customerId } });
  };

  User.findByPhone = function (phoneNumber) {
    return this.findOne({ where: { phoneNumber } });
  };

  return User;
};
