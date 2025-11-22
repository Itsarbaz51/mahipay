export default (sequelize, DataTypes) => {
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
      roleId: {
        type: DataTypes.UUID,
        field: "role_id",
        allowNull: true,
      },
      targetUserId: {
        type: DataTypes.UUID,
        field: "target_user_id",
        allowNull: true,
      },
      serviceId: {
        type: DataTypes.UUID,
        field: "service_id",
        allowNull: true,
      },
      commissionType: {
        type: DataTypes.ENUM("FLAT", "PERCENTAGE"),
        field: "commission_type",
        allowNull: false,
      },
      commissionValue: {
        type: DataTypes.DECIMAL(12, 4),
        field: "commission_value",
        allowNull: false,
      },
      minAmount: {
        type: DataTypes.BIGINT,
        field: "min_amount",
        allowNull: true,
      },
      maxAmount: {
        type: DataTypes.BIGINT,
        field: "max_amount",
        allowNull: true,
      },
      rootCommissionPercent: {
        type: DataTypes.DECIMAL(5, 2),
        field: "root_commission_percent",
        allowNull: true,
      },
      applyTDS: {
        type: DataTypes.BOOLEAN,
        field: "apply_tds",
        defaultValue: false,
      },
      tdsPercent: {
        type: DataTypes.DECIMAL(5, 2),
        field: "tds_percent",
        allowNull: true,
      },
      applyGST: {
        type: DataTypes.BOOLEAN,
        field: "apply_gst",
        defaultValue: false,
      },
      gstPercent: {
        type: DataTypes.DECIMAL(5, 2),
        field: "gst_percent",
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: "is_active",
        defaultValue: true,
      },
      effectiveFrom: {
        type: DataTypes.DATE,
        field: "effective_from",
        defaultValue: DataTypes.NOW,
      },
      effectiveTo: {
        type: DataTypes.DATE,
        field: "effective_to",
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
      tableName: "commission_settings",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["scope", "role_id", "target_user_id"],
        },
        {
          fields: ["is_active", "effective_from", "effective_to"],
        },
        {
          fields: ["created_by_id", "created_by_type"],
        },
      ],
    }
  );

  CommissionSetting.associate = function (models) {
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
