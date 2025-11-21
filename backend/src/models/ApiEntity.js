import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ApiEntity = sequelize.define('ApiEntity', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entity_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entity_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    reference: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    service_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED'),
      defaultValue: 'PENDING'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    provider: {
      type: DataTypes.ENUM('BULKPE', 'PAYTM', 'RAZORPAY', 'CCAVENUE', 'BILLDESK', 'AIRTEL', 'JIO', 'OTHER'),
      allowNull: false
    },
    provider_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    verification_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'api_entities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id', 'service_id'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['status', 'created_at'] }
    ]
  });

  ApiEntity.associate = (models) => {
    ApiEntity.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    ApiEntity.belongsTo(models.ServiceProvider, { foreignKey: 'service_id', as: 'service' });
    ApiEntity.hasMany(models.ApiWebhook, { foreignKey: 'api_entity_id', as: 'apiWebhooks' });
    ApiEntity.hasMany(models.Transaction, { foreignKey: 'api_entity_id', as: 'transactions' });
  };

  return ApiEntity;
};