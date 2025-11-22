export default (sequelize, DataTypes) => {
  const IdempotencyKey = sequelize.define(
    "IdempotencyKey",
    {
      key: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
      expiresAt: {
        type: DataTypes.DATE,
        field: "expired_at",
        allowNull: false,
      },
      used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      meta: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "idempotency_keys",
      timestamps: false,
      underscored: true,
    }
  );

  return IdempotencyKey;
};
