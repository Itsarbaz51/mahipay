import { DataTypes } from "sequelize";

export default (sequelize) => {
  const RootCommissionEarning = sequelize.define(
    "RootCommissionEarning",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_transaction_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      root_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      wallet_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      from_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      commission_amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      commission_type: {
        type: DataTypes.ENUM("FLAT", "PERCENTAGE"),
        allowNull: false,
      },
      tds_amount: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      gst_amount: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      net_amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "root_commission_earnings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        { fields: ["user_transaction_id"] },
        { fields: ["from_user_id", "created_at"] },
        { fields: ["root_id", "created_at"] },
      ],
    }
  );

  RootCommissionEarning.associate = (models) => {
    RootCommissionEarning.belongsTo(models.Root, {
      foreignKey: "root_id",
      as: "root",
    });
    RootCommissionEarning.belongsTo(models.RootWallet, {
      foreignKey: "wallet_id",
      as: "wallet",
    });
    RootCommissionEarning.belongsTo(models.User, {
      foreignKey: "from_user_id",
      as: "fromUser",
    });
    RootCommissionEarning.belongsTo(models.Transaction, {
      foreignKey: "user_transaction_id",
      as: "userTransaction",
    });
    RootCommissionEarning.hasMany(models.RootLedgerEntry, {
      foreignKey: "commission_earning_id",
      as: "rootLedgerEntries",
    });
  };

  return RootCommissionEarning;
};
