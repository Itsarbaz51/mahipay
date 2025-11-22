export default  (sequelize, DataTypes) => {
  const ApiEntity = sequelize.define('ApiEntity', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entityType: {
      type: DataTypes.STRING,
      field: 'entity_type',
      allowNull: false
    },
    entityId: {
      type: DataTypes.STRING,
      field: 'entity_id',
      unique: true,
      allowNull: false
    },
    reference: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      allowNull: false
    },
    serviceId: {
      type: DataTypes.UUID,
      field: 'service_id',
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED'),
      defaultValue: 'PENDING'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active',
      defaultValue: true
    },
    provider: {
      type: DataTypes.ENUM('BULKPE', 'PAYTM', 'RAZORPAY', 'CCAVENUE', 'BILLDESK', 'AIRTEL', 'JIO', 'OTHER'),
      allowNull: false
    },
    providerData: {
      type: DataTypes.JSON,
      field: 'provider_data',
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    verificationData: {
      type: DataTypes.JSON,
      field: 'verification_data',
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    },
    verifiedAt: {
      type: DataTypes.DATE,
      field: 'verified_at',
      allowNull: true
    }
  }, {
    tableName: 'api_entities',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'service_id']
      },
      {
        fields: ['entity_type', 'entity_id']
      },
      {
        fields: ['status', 'created_at']
      }
    ]
  });

  ApiEntity.associate = function(models) {
    ApiEntity.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    ApiEntity.belongsTo(models.ServiceProvider, { foreignKey: 'service_id', as: 'service' });
    ApiEntity.hasMany(models.ApiWebhook, { foreignKey: 'api_entity_id', as: 'apiWebhooks' });
    ApiEntity.hasMany(models.Transaction, { foreignKey: 'api_entity_id', as: 'transactions' });
  };

  return ApiEntity;
};