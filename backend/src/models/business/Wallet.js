export default (sequelize, DataTypes) => {
  const Wallet = sequelize.define(
    "Wallet",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
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
      walletType: {
        type: DataTypes.ENUM(
          "PRIMARY",
          "COMMISSION",
          "ESCROW",
          "TAX",
          "BONUS",
          "HOLDING"
        ),
        field: "wallet_type",
        defaultValue: "PRIMARY",
      },
      holdBalance: {
        type: DataTypes.BIGINT,
        field: "hold_balance",
        defaultValue: 0,
      },
      availableBalance: {
        type: DataTypes.BIGINT,
        field: "available_balance",
        defaultValue: 0,
      },
      dailyLimit: {
        type: DataTypes.BIGINT,
        field: "daily_limit",
        allowNull: true,
      },
      monthlyLimit: {
        type: DataTypes.BIGINT,
        field: "monthly_limit",
        allowNull: true,
      },
      perTransactionLimit: {
        type: DataTypes.BIGINT,
        field: "per_transaction_limit",
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: "is_active",
        defaultValue: true,
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
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
      deletedAt: {
        type: DataTypes.DATE,
        field: "deleted_at",
        allowNull: true,
      },
    },
    {
      tableName: "wallets",
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "wallet_type"],
        },
        {
          fields: ["user_id", "is_active"],
        },
      ],
    }
  );

  Wallet.associate = function (models) {
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
