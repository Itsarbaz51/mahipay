import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Wallet = sequelize.define(
    "Wallet",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      balance: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      currency: {
        type: DataTypes.ENUM("INR"),
        defaultValue: "INR",
      },
      wallet_type: {
        type: DataTypes.ENUM(
          "PRIMARY",
          "COMMISSION",
          "ESCROW",
          "TAX",
          "BONUS",
          "HOLDING"
        ),
        defaultValue: "PRIMARY",
      },
      hold_balance: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      available_balance: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      daily_limit: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      monthly_limit: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      per_transaction_limit: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "wallets",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
      indexes: [
        { fields: ["user_id", "is_active"] },
        {
          unique: true,
          fields: ["user_id", "wallet_type"],
        },
      ],
    }
  );

  Wallet.associate = (models) => {
    Wallet.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    Wallet.hasMany(models.LedgerEntry, {
      foreignKey: "wallet_id",
      as: "ledgerEntries",
    });
    Wallet.hasMany(models.Transaction, {
      foreignKey: "wallet_id",
      as: "transactions",
    });
  };

  return Wallet;
};
