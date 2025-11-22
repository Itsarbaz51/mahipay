export default (sequelize, DataTypes) => {
  const RootWallet = sequelize.define(
    "RootWallet",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      rootId: {
        type: DataTypes.UUID,
        field: "root_id",
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
    },
    {
      tableName: "root_wallets",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["root_id", "wallet_type"],
        },
      ],
    }
  );

  RootWallet.associate = function (models) {
    RootWallet.belongsTo(models.Root, { foreignKey: "root_id", as: "root" });
    RootWallet.hasMany(models.RootCommissionEarning, {
      foreignKey: "wallet_id",
      as: "commissionEarnings",
    });
    RootWallet.hasMany(models.RootLedgerEntry, {
      foreignKey: "wallet_id",
      as: "ledgerEntries",
    });
  };

  return RootWallet;
};
