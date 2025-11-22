export default (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
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
        unique: true,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdByType: {
        type: DataTypes.ENUM("ROOT", "ADMIN"),
        field: "created_by_type",
        allowNull: false,
      },
      createdById: {
        type: DataTypes.UUID,
        field: "created_by_id",
        allowNull: false,
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
      tableName: "roles",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["created_by_id", "created_by_type"],
        },
      ],
    }
  );

  Role.associate = function (models) {
    Role.hasMany(models.User, { foreignKey: "role_id", as: "users" });
    Role.hasMany(models.RolePermission, {
      foreignKey: "role_id",
      as: "rolePermissions",
    });
    Role.hasMany(models.CommissionSetting, {
      foreignKey: "role_id",
      as: "commissionSettings",
    });
    Role.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      as: "createdByRoot",
      constraints: false,
    });
    Role.belongsTo(models.User, {
      foreignKey: "created_by_id",
      as: "createdByUser",
      constraints: false,
    });
  };

  return Role;
};
