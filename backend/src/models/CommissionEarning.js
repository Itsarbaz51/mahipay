import { DataTypes } from "sequelize";

export default (sequelize) => {
  const CommissionEarning = sequelize.define(
    "CommissionEarning",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      transaction_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      from_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      commission_amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      root_commission_amount: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
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
      tableName: "commission_earnings",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        { fields: ["transaction_id", "user_id"] },
        { fields: ["user_id", "created_at"] },
      ],
    }
  );

  CommissionEarning.associate = (models) => {
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
