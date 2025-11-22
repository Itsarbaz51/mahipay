export default (sequelize, DataTypes) => {
  const RootLedgerEntry = sequelize.define(
    "RootLedgerEntry",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      commissionEarningId: {
        type: DataTypes.UUID,
        field: "commission_earning_id",
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
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "root_ledger_entries",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ["wallet_id", "created_at"],
        },
      ],
    }
  );

  RootLedgerEntry.associate = function (models) {
    RootLedgerEntry.belongsTo(models.RootWallet, {
      foreignKey: "wallet_id",
      as: "wallet",
    });
    RootLedgerEntry.belongsTo(models.RootCommissionEarning, {
      foreignKey: "commission_earning_id",
      as: "commissionEarning",
    });
  };

  return RootLedgerEntry;
};
