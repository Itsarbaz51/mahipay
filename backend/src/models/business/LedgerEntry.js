export default (sequelize, DataTypes) => {
  const LedgerEntry = sequelize.define(
    "LedgerEntry",
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
      walletId: {
        type: DataTypes.UUID,
        field: "wallet_id",
        allowNull: false,
      },
      entryType: {
        type: DataTypes.ENUM("DEBIT", "CREDIT"),
        field: "entry_type",
        allowNull: false,
      },
      referenceType: {
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
        field: "reference_type",
        allowNull: false,
      },
      serviceId: {
        type: DataTypes.UUID,
        field: "service_id",
        allowNull: true,
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      runningBalance: {
        type: DataTypes.BIGINT,
        field: "running_balance",
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
      idempotencyKey: {
        type: DataTypes.STRING,
        field: "idempotency_key",
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "ledger_entries",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ["transaction_id"],
        },
        {
          fields: ["wallet_id", "created_at"],
        },
        {
          fields: ["service_id", "reference_type"],
        },
        {
          fields: ["idempotency_key"],
        },
      ],
    }
  );

  LedgerEntry.associate = function (models) {
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
