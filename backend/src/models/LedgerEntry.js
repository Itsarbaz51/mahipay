import { DataTypes } from "sequelize";

export default (sequelize) => {
  const LedgerEntry = sequelize.define(
    "LedgerEntry",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      transaction_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      wallet_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      entry_type: {
        type: DataTypes.ENUM("DEBIT", "CREDIT"),
        allowNull: false,
      },
      reference_type: {
        type: DataTypes.ENUM(
          "TRANSACTION",
          "COMMISSION",
          "REFUND",
          "ADJUSTMENT",
          "BONUS",
          "CHARGE",
          "FEE",
          "TAX",
          "PAYOUT",
          "COLLECTION"
        ),
        allowNull: false,
      },
      service_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      running_balance: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      narration: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      idempotency_key: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "ledger_entries",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        { fields: ["transaction_id"] },
        { fields: ["wallet_id", "created_at"] },
        { fields: ["service_id", "reference_type"] },
        { fields: ["idempotency_key"] },
      ],
    }
  );

  LedgerEntry.associate = (models) => {
    LedgerEntry.belongsTo(models.ServiceProvider, {
      foreignKey: "service_id",
      as: "service",
    });
    LedgerEntry.belongsTo(models.Transaction, {
      foreignKey: "transaction_id",
      as: "transaction",
    });
    LedgerEntry.belongsTo(models.Wallet, {
      foreignKey: "wallet_id",
      as: "wallet",
    });
  };

  return LedgerEntry;
};
