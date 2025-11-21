import { DataTypes } from "sequelize";

export default (sequelize) => {
  const ApiWebhook = sequelize.define('ApiWebhook', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transaction_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    api_entity_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    provider: {
      type: DataTypes.ENUM('BULKPE', 'PAYTM', 'RAZORPAY', 'CCAVENUE', 'BILLDESK', 'AIRTEL', 'JIO', 'OTHER'),
      allowNull: false
    },
    event_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false
    },
    signature: {
      type: DataTypes.STRING,
      allowNull: true
    },
    headers: {
      type: DataTypes.JSON,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'PENDING'
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_attempt_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    response: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'api_webhooks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['transaction_id'] },
      { fields: ['api_entity_id'] },
      { fields: ['provider', 'event_type'] }
    ]
  });

  ApiWebhook.associate = (models) => {
    ApiWebhook.belongsTo(models.ApiEntity, { foreignKey: 'api_entity_id', as: 'apiEntity' });
    ApiWebhook.belongsTo(models.Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
  };

  return ApiWebhook;
};