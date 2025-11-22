export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        field: "first_name",
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        field: "last_name",
        allowNull: false,
      },
      profileImage: {
        type: DataTypes.TEXT,
        field: "profile_image",
        allowNull: true,
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
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      transactionPin: {
        type: DataTypes.TEXT,
        field: "transaction_pin",
        allowNull: true,
      },
      parentId: {
        type: DataTypes.UUID,
        field: "parent_id",
        allowNull: true,
      },
      hierarchyLevel: {
        type: DataTypes.ENUM(
          "ADMIN",
          "STATE",
          "HEAD",
          "MASTER_DISTRIBUTOR",
          "DISTRIBUTOR",
          "RETAILER"
        ),
        field: "hierarchy_level",
        allowNull: false,
      },
      hierarchyPath: {
        type: DataTypes.STRING,
        field: "hierarchy_path",
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"),
        defaultValue: "ACTIVE",
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
    },
    {
      tableName: "users",
      timestamps: true,
      underscored: true,
      paranoid: true, // Enables soft deletes
      indexes: [
        {
          fields: ["parent_id"],
        },
        {
          fields: ["hierarchy_level"],
        },
        {
          fields: ["hierarchy_path"],
        },
        {
          fields: ["phone_number"],
        },
        {
          fields: ["role_id"],
        },
      ],
    }
  );

  User.associate = function (models) {
    // Hierarchical self-reference
    User.belongsTo(User, { foreignKey: "parent_id", as: "parent" });
    User.hasMany(User, { foreignKey: "parent_id", as: "children" });

    // Business relations
    User.belongsTo(models.Role, { foreignKey: "role_id", as: "role" });
    User.hasMany(models.Wallet, { foreignKey: "user_id", as: "wallets" });
    User.hasMany(models.BankDetail, {
      foreignKey: "user_id",
      as: "bankAccounts",
    });

    // KYC Relations
    User.hasOne(models.UserKyc, { foreignKey: "user_id", as: "userKyc" });
    User.hasOne(models.BusinessKyc, {
      foreignKey: "user_id",
      as: "businessKyc",
    });

    // KYC Verification Relations
    User.hasMany(models.UserKyc, {
      foreignKey: "verified_by_id",
      as: "verifiedUserKycs",
      constraints: false,
    });

    // Transaction relations
    User.hasMany(models.Transaction, {
      foreignKey: "user_id",
      as: "transactions",
    });
    User.hasMany(models.CommissionEarning, {
      foreignKey: "user_id",
      as: "commissionEarnings",
    });
    User.hasMany(models.CommissionEarning, {
      foreignKey: "from_user_id",
      as: "commissionsGiven",
    });
    User.hasMany(models.RootCommissionEarning, {
      foreignKey: "from_user_id",
      as: "rootCommissionsGiven",
    });

    // Permission relations
    User.hasMany(models.UserPermission, {
      foreignKey: "user_id",
      as: "userPermissions",
    });
    User.hasMany(models.PiiConsent, {
      foreignKey: "user_id",
      as: "piiConsents",
    });
    User.hasMany(models.ApiEntity, {
      foreignKey: "user_id",
      as: "apiEntities",
    });
    User.hasMany(models.IpWhitelist, {
      foreignKey: "user_id",
      as: "ipWhitelists",
    });

    // Management relations
    User.hasMany(models.Employee, {
      foreignKey: "created_by_id",
      as: "employeesCreated",
      constraints: false,
    });
    User.hasMany(models.CommissionSetting, {
      foreignKey: "created_by_id",
      as: "commissionSettingsCreated",
      constraints: false,
    });
    User.hasMany(models.Role, {
      foreignKey: "created_by_id",
      as: "rolesCreated",
      constraints: false,
    });
    User.hasMany(models.CommissionSetting, {
      foreignKey: "target_user_id",
      as: "commissionSettings",
    });
    User.hasMany(models.Department, {
      foreignKey: "created_by_id",
      as: "departments",
      constraints: false,
    });
    User.hasMany(models.Employee, { foreignKey: "user_id", as: "employees" });

    // Permissions created by Admin User
    User.hasMany(models.RolePermission, {
      foreignKey: "created_by_id",
      as: "createdRolePermissions",
      constraints: false,
    });
    User.hasMany(models.UserPermission, {
      foreignKey: "created_by_id",
      as: "createdUserPermissions",
      constraints: false,
    });
    User.hasMany(models.DepartmentPermission, {
      foreignKey: "created_by_id",
      as: "createdDepartmentPermissions",
      constraints: false,
    });
    User.hasMany(models.EmployeePermission, {
      foreignKey: "created_by_id",
      as: "createdEmployeePermissions",
      constraints: false,
    });
  };

  return User;
};
