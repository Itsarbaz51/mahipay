import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ServiceProvider = sequelize.define('ServiceProvider', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    icon_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    env_config: {
      type: DataTypes.JSON,
      allowNull: true
    },
    api_integration_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    hierarchy_level: {
      type: DataTypes.STRING,
      allowNull: false
    },
    hierarchy_path: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_by_root_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'service_providers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['parent_id'] },
      { fields: ['created_by_root_id'] }
    ]
  });

  ServiceProvider.associate = (models) => {
    ServiceProvider.belongsTo(models.ServiceProvider, { as: 'parent', foreignKey: 'parent_id' });
    ServiceProvider.hasMany(models.ServiceProvider, { as: 'subServices', foreignKey: 'parent_id' });
    ServiceProvider.hasMany(models.ApiEntity, { foreignKey: 'service_id', as: 'apiEntities' });
    ServiceProvider.hasMany(models.Transaction, { foreignKey: 'service_id', as: 'transactions' });
    ServiceProvider.hasMany(models.RolePermission, { foreignKey: 'service_id', as: 'rolePermissions' });
    ServiceProvider.hasMany(models.UserPermission, { foreignKey: 'service_id', as: 'userPermissions' });
    ServiceProvider.hasMany(models.CommissionSetting, { foreignKey: 'service_id', as: 'commissionSettings' });
    ServiceProvider.hasMany(models.LedgerEntry, { foreignKey: 'service_id', as: 'ledgerEntries' });
    ServiceProvider.belongsTo(models.Root, { foreignKey: 'created_by_root_id', as: 'createdByRoot' });
  };

  return ServiceProvider;
};