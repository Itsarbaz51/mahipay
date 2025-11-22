export default (sequelize, DataTypes) => {
  const Root = sequelize.define(
    "Root",
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
      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"),
        defaultValue: "ACTIVE",
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
    },
    {
      tableName: "roots",
      timestamps: true,
      underscored: true,
    }
  );

  Root.associate = function (models) {
    // Root Business Capabilities
    Root.hasMany(models.RootWallet, { foreignKey: "root_id", as: "wallets" });
    Root.hasMany(models.RootBankDetail, {
      foreignKey: "root_id",
      as: "bankAccounts",
    });
    Root.hasMany(models.RootCommissionEarning, {
      foreignKey: "root_id",
      as: "commissionEarnings",
    });

    // Management Capabilities
    Root.hasMany(models.Employee, { foreignKey: "root_id", as: "employees" });
    Root.hasMany(models.Department, {
      foreignKey: "created_by_id",
      as: "departments",
      constraints: false,
    });
    Root.hasMany(models.SystemSetting, {
      foreignKey: "root_id",
      as: "systemSettings",
    });
    Root.hasMany(models.Role, {
      foreignKey: "created_by_id",
      as: "createdRoles",
      constraints: false,
    });
    Root.hasMany(models.CommissionSetting, {
      foreignKey: "created_by_id",
      as: "commissionSettingsCreated",
      constraints: false,
    });
    Root.hasMany(models.IpWhitelist, {
      foreignKey: "root_id",
      as: "ipWhitelists",
    });

    // KYC Verification Relations
    Root.hasMany(models.UserKyc, {
      foreignKey: "verified_by_id",
      as: "verifiedUserKycs",
      constraints: false,
    });
    Root.hasMany(models.BusinessKyc, {
      foreignKey: "verified_by_root_id",
      as: "verifiedBusinessKycs",
    });
    Root.hasMany(models.BusinessKyc, {
      foreignKey: "root_id",
      as: "ownedBusinessKycs",
    });

    // Service Management
    Root.hasMany(models.ServiceProvider, {
      foreignKey: "created_by_root_id",
      as: "serviceProviders",
    });

    // Permissions created by Root
    Root.hasMany(models.RolePermission, {
      foreignKey: "created_by_id",
      as: "createdRolePermissions",
      constraints: false,
    });
    Root.hasMany(models.UserPermission, {
      foreignKey: "created_by_id",
      as: "createdUserPermissions",
      constraints: false,
    });
    Root.hasMany(models.DepartmentPermission, {
      foreignKey: "created_by_id",
      as: "createdDepartmentPermissions",
      constraints: false,
    });
    Root.hasMany(models.EmployeePermission, {
      foreignKey: "created_by_id",
      as: "createdEmployeePermissions",
      constraints: false,
    });
  };

  return Root;
};
