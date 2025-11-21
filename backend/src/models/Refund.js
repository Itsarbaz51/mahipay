import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Refund = sequelize.define('Refund', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transaction_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    initiated_by: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED', 'REVERSED', 'REFUNDED', 'CANCELLED'),
      defaultValue: 'PENDING'
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'refunds',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['transaction_id'] }
    ]
  });

  Refund.associate = (models) => {
    Refund.belongsTo(models.Transaction, { foreignKey: 'transaction_id', as: 'transaction' });
  };

  return Refund;
};