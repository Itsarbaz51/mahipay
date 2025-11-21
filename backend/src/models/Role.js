import { DataTypes } from "sequelize";

export default (sequelize) => {
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
      hierarchy_level: {
        type: DataTypes.ENUM(
          "ADMIN",
          "STATE",
          "HEAD",
          "MASTER_DISTRIBUTOR",
          "DISTRIBUTOR",
          "RETAILER"
        ),
        unique: true,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
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
      tableName: "roles",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ fields: ["created_by_id", "created_by_type"] }],
    }
  );

  Role.associate = (models) => {
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
