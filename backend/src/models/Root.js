import { DataTypes } from "sequelize";

export default (sequelize) => {
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
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      profile_image: {
        type: DataTypes.TEXT,
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
      phone_number: {
        type: DataTypes.STRING,
        unique: true,
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
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      password_reset_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password_reset_expires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "roots",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Root.associate = (models) => {
    Root.hasMany(models.RootWallet, { foreignKey: "root_id", as: "wallets" });
    Root.hasMany(models.RootBankDetail, {
      foreignKey: "root_id",
      as: "bankAccounts",
    });
    Root.hasMany(models.RootCommissionEarning, {
      foreignKey: "root_id",
      as: "commissionEarnings",
    });
    Root.hasMany(models.Employee, { foreignKey: "root_id", as: "employees" });
    Root.hasMany(models.Department, {
      foreignKey: "created_by_id",
      as: "departments",
      constraints: false,
      scope: {
        created_by_type: "ROOT",
      },
    });
    Root.hasMany(models.SystemSetting, {
      foreignKey: "root_id",
      as: "systemSettings",
    });
    Root.hasMany(models.Role, {
      foreignKey: "created_by_id",
      as: "createdRoles",
      constraints: false,
      scope: {
        created_by_type: "ROOT",
      },
    });
    Root.hasMany(models.CommissionSetting, {
      foreignKey: "created_by_id",
      as: "commissionSettingsCreated",
      constraints: false,
      scope: {
        created_by_type: "ROOT",
      },
    });
    Root.hasMany(models.IpWhitelist, {
      foreignKey: "root_id",
      as: "ipWhitelists",
    });
    Root.hasMany(models.UserKyc, {
      foreignKey: "verified_by_id",
      as: "verifiedUserKycs",
      constraints: false,
      scope: {
        verified_by_type: "ROOT",
      },
    });
    Root.hasMany(models.BusinessKyc, {
      foreignKey: "verified_by_root_id",
      as: "verifiedBusinessKycs",
    });
    Root.hasMany(models.BusinessKyc, {
      foreignKey: "root_id",
      as: "ownedBusinessKycs",
    });
    Root.hasMany(models.ServiceProvider, {
      foreignKey: "created_by_root_id",
      as: "serviceProviders",
    });
    Root.hasMany(models.RolePermission, {
      foreignKey: "created_by_id",
      as: "createdRolePermissions",
      constraints: false,
      scope: {
        created_by_type: "ROOT",
      },
    });
    Root.hasMany(models.UserPermission, {
      foreignKey: "created_by_id",
      as: "createdUserPermissions",
      constraints: false,
      scope: {
        created_by_type: "ROOT",
      },
    });
    Root.hasMany(models.DepartmentPermission, {
      foreignKey: "created_by_id",
      as: "createdDepartmentPermissions",
      constraints: false,
      scope: {
        created_by_type: "ROOT",
      },
    });
    Root.hasMany(models.EmployeePermission, {
      foreignKey: "created_by_id",
      as: "createdEmployeePermissions",
      constraints: false,
      scope: {
        created_by_type: "ROOT",
      },
    });
  };

  return Root;
};
