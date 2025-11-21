import { DataTypes } from "sequelize";

export default (sequelize) => {
  const RootLedgerEntry = sequelize.define(
    "RootLedgerEntry",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      commission_earning_id: {
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
    },
    {
      tableName: "root_ledger_entries",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [{ fields: ["wallet_id", "created_at"] }],
    }
  );

  RootLedgerEntry.associate = (models) => {
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
