export default (sequelize, DataTypes) => {
  const ServiceProvider = sequelize.define(
    "ServiceProvider",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: "is_active",
        defaultValue: false,
      },
      iconUrl: {
        type: DataTypes.STRING,
        field: "icon_url",
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      envConfig: {
        type: DataTypes.JSON,
        field: "env_config",
        allowNull: true,
      },
      apiIntegrationStatus: {
        type: DataTypes.BOOLEAN,
        field: "api_integration_status",
        defaultValue: false,
        allowNull: true,
      },
      parentId: {
        type: DataTypes.UUID,
        field: "parent_id",
        allowNull: true,
      },
      hierarchyLevel: {
        type: DataTypes.STRING,
        field: "hierarchy_level",
        allowNull: false,
      },
      hierarchyPath: {
        type: DataTypes.TEXT,
        field: "hierarchy_path",
        allowNull: false,
      },
      createdByRootId: {
        type: DataTypes.UUID,
        field: "created_by_root_id",
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
      tableName: "service_providers",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["parent_id"],
        },
        {
          fields: ["created_by_root_id"],
        },
      ],
    }
  );

  ServiceProvider.associate = function (models) {
    ServiceProvider.belongsTo(ServiceProvider, {
      foreignKey: "parent_id",
      as: "parent",
    });
    ServiceProvider.hasMany(ServiceProvider, {
      foreignKey: "parent_id",
      as: "subServices",
    });
    ServiceProvider.hasMany(models.ApiEntity, {
      foreignKey: "service_id",
      as: "apiEntities",
    });
    ServiceProvider.hasMany(models.Transaction, {
      foreignKey: "service_id",
      as: "transactions",
    });
    ServiceProvider.hasMany(models.RolePermission, {
      foreignKey: "service_id",
      as: "rolePermissions",
    });
    ServiceProvider.hasMany(models.UserPermission, {
      foreignKey: "service_id",
      as: "userPermissions",
    });
    ServiceProvider.hasMany(models.CommissionSetting, {
      foreignKey: "service_id",
      as: "commissionSettings",
    });
    ServiceProvider.hasMany(models.LedgerEntry, {
      foreignKey: "service_id",
      as: "ledgerEntries",
    });
    ServiceProvider.belongsTo(models.Root, {
      foreignKey: "created_by_root_id",
      as: "createdByRoot",
    });
  };

  return ServiceProvider;
};
