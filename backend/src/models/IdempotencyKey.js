import { DataTypes } from "sequelize";

export default (sequelize) => {
  const IdempotencyKey = sequelize.define('IdempotencyKey', {
    key: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'idempotency_keys',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return IdempotencyKey;
};