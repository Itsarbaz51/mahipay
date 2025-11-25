export default (sequelize, DataTypes) => {
  const RolePermission = sequelize.define(
    "RolePermission",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roleId: {
        type: DataTypes.UUID,
        field: "role_id",
        allowNull: false,
      },
      serviceId: {
        type: DataTypes.UUID,
        field: "service_id",
        allowNull: true, // global permissions ke liye
      },
      permission: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      assignedAt: {
        type: DataTypes.DATE,
        field: "assigned_at",
        defaultValue: DataTypes.NOW,
      },
      revokedAt: {
        type: DataTypes.DATE,
        field: "revoked_at",
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: "is_active",
        defaultValue: true,
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
    },
    {
      tableName: "role_permissions",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["role_id", "permission", "service_id"],
          where: {
            is_active: true,
            revoked_at: null,
          },
        },
        {
          fields: ["created_by_id", "created_by_type"],
        },
        {
          fields: ["role_id"],
        },
        {
          fields: ["is_active"],
        },
      ],
    }
  );

  RolePermission.associate = function (models) {
    RolePermission.belongsTo(models.ServiceProvider, {
      foreignKey: "service_id",
      as: "service",
    });
    RolePermission.belongsTo(models.Role, {
      foreignKey: "role_id",
      as: "role",
    });

    RolePermission.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      as: "createdByRoot",
      constraints: false,
      scope: {
        created_by_type: "ROOT",
      },
    });

    RolePermission.belongsTo(models.User, {
      foreignKey: "created_by_id",
      as: "createdByUser",
      constraints: false,
      scope: {
        created_by_type: "ADMIN",
      },
    });
  };

  return RolePermission;
};
