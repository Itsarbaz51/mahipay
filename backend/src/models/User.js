import { DataTypes } from "sequelize";

export default (sequelize) => {
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
      transaction_pin: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      hierarchy_level: {
        type: DataTypes.ENUM(
          "ADMIN",
          "STATE",
          "HEAD",
          "MASTER_DISTRIBUTOR",
          "DISTRIBUTOR",
          "RETAILER"
        ),
        allowNull: false,
      },
      hierarchy_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"),
        defaultValue: "ACTIVE",
      },
      is_kyc_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
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
      email_verification_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      email_verification_token_expires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deactivation_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
      indexes: [
        { fields: ["parent_id"] },
        { fields: ["hierarchy_level"] },
        { fields: ["hierarchy_path"] },
        { fields: ["phone_number"] },
        { fields: ["role_id"] },
      ],
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.User, { as: "parent", foreignKey: "parent_id" });
    User.hasMany(models.User, { as: "children", foreignKey: "parent_id" });
    User.belongsTo(models.Role, { foreignKey: "role_id", as: "role" });
    User.hasMany(models.Wallet, { foreignKey: "user_id", as: "wallets" });
    User.hasMany(models.BankDetail, {
      foreignKey: "user_id",
      as: "bankAccounts",
    });
    User.hasOne(models.UserKyc, { foreignKey: "user_id", as: "userKyc" });
    User.hasOne(models.BusinessKyc, {
      foreignKey: "user_id",
      as: "businessKyc",
    });
    User.hasMany(models.UserKyc, {
      foreignKey: "verified_by_id",
      as: "verifiedUserKycs",
      constraints: false,
      scope: {
        verified_by_type: "ADMIN",
      },
    });
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
    User.hasMany(models.Employee, {
      foreignKey: "created_by_id",
      as: "employeesCreated",
      constraints: false,
      scope: {
        created_by_type: "ADMIN",
      },
    });
    User.hasMany(models.CommissionSetting, {
      foreignKey: "created_by_id",
      as: "commissionSettingsCreated",
      constraints: false,
      scope: {
        created_by_type: "ADMIN",
      },
    });
    User.hasMany(models.Role, {
      foreignKey: "created_by_id",
      as: "rolesCreated",
      constraints: false,
      scope: {
        created_by_type: "ADMIN",
      },
    });
    User.hasMany(models.CommissionSetting, {
      foreignKey: "target_user_id",
      as: "commissionSettings",
    });
    User.hasMany(models.Department, {
      foreignKey: "created_by_id",
      as: "departments",
      constraints: false,
      scope: {
        created_by_type: "ADMIN",
      },
    });
    User.hasMany(models.Employee, { foreignKey: "user_id", as: "employees" });
    User.hasMany(models.RolePermission, {
      foreignKey: "created_by_id",
      as: "createdRolePermissions",
      constraints: false,
      scope: {
        created_by_type: "ADMIN",
      },
    });
    User.hasMany(models.UserPermission, {
      foreignKey: "created_by_id",
      as: "createdUserPermissions",
      constraints: false,
      scope: {
        created_by_type: "ADMIN",
      },
    });
    User.hasMany(models.DepartmentPermission, {
      foreignKey: "created_by_id",
      as: "createdDepartmentPermissions",
      constraints: false,
      scope: {
        created_by_type: "ADMIN",
      },
    });
    User.hasMany(models.EmployeePermission, {
      foreignKey: "created_by_id",
      as: "createdEmployeePermissions",
      constraints: false,
      scope: {
        created_by_type: "ADMIN",
      },
    });
  };

  return User;
};
