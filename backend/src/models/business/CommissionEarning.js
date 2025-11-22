export default (sequelize, DataTypes) => {
  const CommissionEarning = sequelize.define(
    "CommissionEarning",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      transactionId: {
        type: DataTypes.UUID,
        field: "transaction_id",
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
        allowNull: false,
      },
      fromUserId: {
        type: DataTypes.UUID,
        field: "from_user_id",
        allowNull: true,
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
      rootCommissionAmount: {
        type: DataTypes.BIGINT,
        field: "root_commission_amount",
        defaultValue: 0,
        allowNull: true,
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
      tableName: "commission_earnings",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ["transaction_id", "user_id"],
        },
        {
          fields: ["user_id", "created_at"],
        },
      ],
    }
  );

  CommissionEarning.associate = function (models) {
    CommissionEarning.belongsTo(models.Transaction, {
      foreignKey: "transaction_id",
      as: "transaction",
    });
    CommissionEarning.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    CommissionEarning.belongsTo(models.User, {
      foreignKey: "from_user_id",
      as: "fromUser",
    });
  };

  return CommissionEarning;
};
