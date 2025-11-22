export default (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    "Transaction",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      referenceId: {
        type: DataTypes.STRING,
        field: "reference_id",
        allowNull: true,
      },
      externalRefId: {
        type: DataTypes.STRING,
        field: "external_ref_id",
        allowNull: true,
      },
      idempotencyKey: {
        type: DataTypes.STRING,
        field: "idempotency_key",
        allowNull: true,
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      currency: {
        type: DataTypes.ENUM("INR"),
        defaultValue: "INR",
      },
      netAmount: {
        type: DataTypes.BIGINT,
        field: "net_amount",
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "PENDING",
          "SUCCESS",
          "FAILED",
          "REVERSED",
          "REFUNDED",
          "CANCELLED"
        ),
        defaultValue: "PENDING",
      },
      serviceId: {
        type: DataTypes.UUID,
        field: "service_id",
        allowNull: true,
      },
      paymentType: {
        type: DataTypes.ENUM(
          "COLLECTION",
          "PAYOUT",
          "REFUND",
          "REVERSAL",
          "COMMISSION",
          "FEE",
          "TAX",
          "ADJUSTMENT",
          "CHARGE",
          "FUND_REQ_BANK",
          "FUND_REQ_RAZORPAY"
        ),
        field: "payment_type",
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
        allowNull: false,
      },
      walletId: {
        type: DataTypes.UUID,
        field: "wallet_id",
        allowNull: false,
      },
      apiEntityId: {
        type: DataTypes.UUID,
        field: "api_entity_id",
        allowNull: true,
      },
      totalCommission: {
        type: DataTypes.BIGINT,
        field: "total_commission",
        defaultValue: 0,
        allowNull: true,
      },
      rootCommission: {
        type: DataTypes.BIGINT,
        field: "root_commission",
        defaultValue: 0,
        allowNull: true,
      },
      providerCharge: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      taxAmount: {
        type: DataTypes.BIGINT,
        field: "tax_amount",
        allowNull: true,
      },
      feeAmount: {
        type: DataTypes.BIGINT,
        field: "fee_amount",
        allowNull: true,
      },
      cashbackAmount: {
        type: DataTypes.BIGINT,
        field: "cashback_amount",
        allowNull: true,
      },
      providerReference: {
        type: DataTypes.STRING,
        field: "provider_reference",
        allowNull: true,
      },
      providerResponse: {
        type: DataTypes.JSON,
        field: "provider_response",
        allowNull: true,
      },
      requestPayload: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      responsePayload: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      initiatedAt: {
        type: DataTypes.DATE,
        field: "initiated_at",
        defaultValue: DataTypes.NOW,
      },
      processedAt: {
        type: DataTypes.DATE,
        field: "processed_at",
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE,
        field: "completed_at",
        allowNull: true,
      },
    },
    {
      tableName: "transactions",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ["user_id", "status"],
        },
        {
          fields: ["idempotency_key"],
        },
        {
          fields: ["service_id", "initiated_at"],
        },
        {
          fields: ["external_ref_id"],
        },
        {
          fields: ["provider_reference"],
        },
        {
          fields: ["status", "initiated_at"],
        },
        {
          fields: ["wallet_id"],
        },
      ],
    }
  );

  Transaction.associate = function (models) {
    Transaction.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    Transaction.belongsTo(models.Wallet, {
      foreignKey: "wallet_id",
      as: "wallet",
    });
    Transaction.belongsTo(models.ApiEntity, {
      foreignKey: "api_entity_id",
      as: "apiEntity",
    });
    Transaction.belongsTo(models.ServiceProvider, {
      foreignKey: "service_id",
      as: "service",
    });
    Transaction.hasMany(models.ApiWebhook, {
      foreignKey: "transaction_id",
      as: "apiWebhooks",
    });
    Transaction.hasMany(models.CommissionEarning, {
      foreignKey: "transaction_id",
      as: "commissionEarnings",
    });
    Transaction.hasMany(models.RootCommissionEarning, {
      foreignKey: "user_transaction_id",
      as: "rootCommissionEarnings",
    });
    Transaction.hasMany(models.LedgerEntry, {
      foreignKey: "transaction_id",
      as: "ledgerEntries",
    });
    Transaction.hasMany(models.Refund, {
      foreignKey: "transaction_id",
      as: "refunds",
    });
  };

  return Transaction;
};
