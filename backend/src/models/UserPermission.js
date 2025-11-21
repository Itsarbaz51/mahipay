import { DataTypes } from "sequelize";

export default (sequelize) => {
  const UserPermission = sequelize.define(
    "UserPermission",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      service_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
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
      tableName: "user_permissions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["user_id", "service_id"],
        },
        { fields: ["created_by_id", "created_by_type"] },
      ],
    }
  );

  UserPermission.associate = (models) => {
    UserPermission.belongsTo(models.ServiceProvider, {
      foreignKey: "service_id",
      as: "service",
    });
    UserPermission.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    UserPermission.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      as: "createdByRoot",
      constraints: false,
    });
    UserPermission.belongsTo(models.User, {
      foreignKey: "created_by_id",
      as: "createdByUser",
      constraints: false,
    });
  };

  return UserPermission;
};
