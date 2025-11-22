export default (sequelize, DataTypes) => {
  const Refund = sequelize.define(
    "Refund",
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
      initiatedBy: {
        type: DataTypes.STRING,
        field: "initiated_by",
        allowNull: false,
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "PENDING",
          "SUCCESS",
          "FAILED",
          "REVERSED",
          "REFUNDED",
          "CANCELLED"
        ),
        defaultValue: "PENDING",
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true,
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
      updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "refunds",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["transaction_id"],
        },
      ],
    }
  );

  Refund.associate = function (models) {
    Refund.belongsTo(models.Transaction, {
      foreignKey: "transaction_id",
      as: "transaction",
    });
  };

  return Refund;
};
