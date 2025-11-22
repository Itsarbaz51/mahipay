export default (sequelize, DataTypes) => {
  const RootCommissionEarning = sequelize.define(
    "RootCommissionEarning",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userTransactionId: {
        type: DataTypes.UUID,
        field: "user_transaction_id",
        allowNull: false,
      },
      rootId: {
        type: DataTypes.UUID,
        field: "root_id",
        allowNull: false,
      },
      walletId: {
        type: DataTypes.UUID,
        field: "wallet_id",
        allowNull: false,
      },
      fromUserId: {
        type: DataTypes.UUID,
        field: "from_user_id",
        allowNull: false,
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      commissionAmount: {
        type: DataTypes.BIGINT,
        field: "commission_amount",
        allowNull: false,
      },
      commissionType: {
        type: DataTypes.ENUM("FLAT", "PERCENTAGE"),
        field: "commission_type",
        allowNull: false,
      },
      tdsAmount: {
        type: DataTypes.BIGINT,
        field: "tds_amount",
        allowNull: true,
      },
      gstAmount: {
        type: DataTypes.BIGINT,
        field: "gst_amount",
        allowNull: true,
      },
      netAmount: {
        type: DataTypes.BIGINT,
        field: "net_amount",
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
      tableName: "root_commission_earnings",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ["user_transaction_id"],
        },
        {
          fields: ["from_user_id", "created_at"],
        },
        {
          fields: ["root_id", "created_at"],
        },
      ],
    }
  );

  RootCommissionEarning.associate = function (models) {
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
