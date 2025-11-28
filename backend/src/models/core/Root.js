export default (sequelize, DataTypes) => {
  const Root = sequelize.define(
    "Root",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roleId: {
        type: DataTypes.UUID,
        field: "role_id",
        allowNull: true,
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
          isUrl: true,
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
          len: [6, 255],
        },
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"),
        defaultValue: "ACTIVE",
        validate: {
          isIn: [["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"]],
        },
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
      hierarchyLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: "hierarchy_level",
        allowNull: false,
        unique: true,
        validate: {
          min: 0,
        },
      },
      hierarchyPath: {
        type: DataTypes.TEXT, // Changed to TEXT
        defaultValue: "0",
        field: "hierarchy_path",
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
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
      paranoid: true, // Added soft delete support
      indexes: [
        {
          unique: true,
          fields: ["username"],
        },
        {
          unique: true,
          fields: ["email"],
        },
        {
          unique: true,
          fields: ["phone_number"],
        },
        {
          unique: true,
          fields: ["hierarchy_level"],
        },
        {
          unique: true,
          fields: ["hierarchy_path"],
        },
        {
          fields: ["status"],
        },
      ],
    }
  );

  Root.associate = function (models) {
    // Root Business Capabilities
    Root.hasMany(models.RootWallet, {
      foreignKey: "root_id",
      as: "wallets",
      onDelete: "CASCADE",
    });
    Root.hasMany(models.RootBankDetail, {
      foreignKey: "root_id",
      as: "bankAccounts",
      onDelete: "CASCADE",
    });
    Root.hasMany(models.RootCommissionEarning, {
      foreignKey: "root_id",
      as: "commissionEarnings",
      onDelete: "RESTRICT",
    });

    // Management Capabilities
    Root.hasMany(models.Employee, {
      foreignKey: "root_id",
      as: "employees",
      onDelete: "CASCADE",
    });
    Root.hasMany(models.Department, {
      foreignKey: "created_by_id",
      as: "departments",
      constraints: false,
    });
    Root.hasMany(models.SystemSetting, {
      foreignKey: "root_id",
      as: "systemSettings",
      onDelete: "CASCADE",
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
      onDelete: "CASCADE",
    });

    // KYC Verification Relations
    Root.hasMany(models.UserKyc, {
      foreignKey: "verified_by_id",
      as: "verifiedUserKycs",
      constraints: false,
    });
    Root.hasMany(models.BusinessKyc, {
      foreignKey: "verified_by_id",
      as: "verifiedBusinessKycs",
      constraints: false,
    });

    // Service Management
    Root.hasMany(models.ServiceProvider, {
      foreignKey: "created_by_root_id",
      as: "serviceProviders",
      onDelete: "CASCADE",
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

    Root.belongsTo(models.Role, {
      foreignKey: "role_id",
      as: "role",
      onDelete: "RESTRICT",
    });
  };

  // Instance methods
  Root.prototype.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
  };

  Root.prototype.isActive = function () {
    return this.status === "ACTIVE";
  };

  // Class methods
  Root.findByEmail = function (email) {
    return this.findOne({ where: { email } });
  };

  return Root;
};
