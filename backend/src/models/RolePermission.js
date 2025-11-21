import { DataTypes } from "sequelize";

export default (sequelize) => {
  const RolePermission = sequelize.define(
    "RolePermission",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      service_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      can_view: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      can_edit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      can_set_commission: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      can_process: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      limits: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      created_by_type: {
        type: DataTypes.ENUM("ROOT", "ADMIN"),
        allowNull: false,
      },
      created_by_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: "role_permissions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["role_id", "service_id"],
        },
        { fields: ["created_by_id", "created_by_type"] },
      ],
    }
  );

  RolePermission.associate = (models) => {
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
