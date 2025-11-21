import { DataTypes } from "sequelize";

export default (sequelize) => {
  const RootWallet = sequelize.define(
    "RootWallet",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      root_id: {
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
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
    },
    {
      tableName: "root_wallets",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["root_id", "wallet_type"],
        },
      ],
    }
  );

  RootWallet.associate = (models) => {
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
