import { DataTypes } from "sequelize";

export default (sequelize) => {
  const CommissionSetting = sequelize.define(
    "CommissionSetting",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      scope: {
        type: DataTypes.ENUM("ROLE", "USER"),
        defaultValue: "ROLE",
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      target_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      service_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      commission_type: {
        type: DataTypes.ENUM("FLAT", "PERCENTAGE"),
        allowNull: false,
      },
      commission_value: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
      },
      min_amount: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      max_amount: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      root_commission_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      apply_tds: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      tds_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      apply_gst: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      gst_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      effective_from: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      effective_to: {
        type: DataTypes.DATE,
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
      tableName: "commission_settings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["scope", "role_id", "target_user_id"] },
        { fields: ["is_active", "effective_from", "effective_to"] },
        { fields: ["created_by_id", "created_by_type"] },
      ],
    }
  );

  CommissionSetting.associate = (models) => {
    CommissionSetting.belongsTo(models.Role, {
      foreignKey: "role_id",
      as: "role",
    });
    CommissionSetting.belongsTo(models.User, {
      foreignKey: "target_user_id",
      as: "targetUser",
    });
    CommissionSetting.belongsTo(models.ServiceProvider, {
      foreignKey: "service_id",
      as: "service",
    });
    CommissionSetting.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      as: "createdByRoot",
      constraints: false,
    });
    CommissionSetting.belongsTo(models.User, {
      foreignKey: "created_by_id",
      as: "createdByUser",
      constraints: false,
    });
  };

  return CommissionSetting;
};
