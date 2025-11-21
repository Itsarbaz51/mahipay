import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Transaction = sequelize.define(
    "Transaction",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      reference_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      external_ref_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      idempotency_key: {
        type: DataTypes.STRING,
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
      net_amount: {
        type: DataTypes.BIGINT,
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
      service_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      payment_type: {
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
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      wallet_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      api_entity_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      total_commission: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      root_commission: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      provider_charge: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      tax_amount: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      fee_amount: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      cashback_amount: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      provider_reference: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      provider_response: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      request_payload: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      response_payload: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      initiated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      processed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "transactions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["user_id", "status"] },
        { fields: ["idempotency_key"] },
        { fields: ["service_id", "initiated_at"] },
        { fields: ["external_ref_id"] },
        { fields: ["provider_reference"] },
        { fields: ["status", "initiated_at"] },
        { fields: ["wallet_id"] },
      ],
    }
  );

  Transaction.associate = (models) => {
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
