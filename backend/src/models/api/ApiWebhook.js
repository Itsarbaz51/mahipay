export default (sequelize, DataTypes) => {
  const ApiWebhook = sequelize.define(
    "ApiWebhook",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      transactionId: {
        type: DataTypes.UUID,
        field: "transaction_id",
        allowNull: true,
      },
      apiEntityId: {
        type: DataTypes.UUID,
        field: "api_entity_id",
        allowNull: true,
      },
      provider: {
        type: DataTypes.ENUM(
          "BULKPE",
          "PAYTM",
          "RAZORPAY",
          "CCAVENUE",
          "BILLDESK",
          "AIRTEL",
          "JIO",
          "OTHER"
        ),
        allowNull: false,
      },
      eventType: {
        type: DataTypes.STRING,
        field: "event_type",
        allowNull: false,
      },
      payload: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      signature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      headers: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "PENDING",
      },
      attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastAttemptAt: {
        type: DataTypes.DATE,
        field: "last_attempt_at",
        allowNull: true,
      },
      response: {
        type: DataTypes.JSON,
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
    },
    {
      tableName: "api_webhooks",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["transaction_id"],
        },
        {
          fields: ["api_entity_id"],
        },
        {
          fields: ["provider", "event_type"],
        },
      ],
    }
  );

  ApiWebhook.associate = function (models) {
    ApiWebhook.belongsTo(models.ApiEntity, {
      foreignKey: "api_entity_id",
      as: "apiEntity",
    });
    ApiWebhook.belongsTo(models.Transaction, {
      foreignKey: "transaction_id",
      as: "transaction",
    });
  };

  return ApiWebhook;
};
