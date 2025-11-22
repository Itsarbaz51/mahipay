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
        allowNull: false,
      },
      canView: {
        type: DataTypes.BOOLEAN,
        field: "can_view",
        defaultValue: false,
      },
      canEdit: {
        type: DataTypes.BOOLEAN,
        field: "can_edit",
        defaultValue: false,
      },
      canSetCommission: {
        type: DataTypes.BOOLEAN,
        field: "can_set_commission",
        defaultValue: false,
      },
      canProcess: {
        type: DataTypes.BOOLEAN,
        field: "can_process",
        defaultValue: false,
      },
      limits: {
        type: DataTypes.JSON,
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
          fields: ["role_id", "service_id"],
        },
        {
          fields: ["created_by_id", "created_by_type"],
        },
      ],
    }
  );

  RolePermission.associate = function (models) {
    RolePermission.belongsTo(models.Role, {
      foreignKey: "role_id",
      as: "role",
    });
    RolePermission.belongsTo(models.ServiceProvider, {
      foreignKey: "service_id",
      as: "service",
    });
    RolePermission.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      as: "createdByRoot",
      constraints: false,
    });
    RolePermission.belongsTo(models.User, {
      foreignKey: "created_by_id",
      as: "createdByUser",
      constraints: false,
    });
  };

  return RolePermission;
};
