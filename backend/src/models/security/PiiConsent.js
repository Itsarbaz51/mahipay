export default (sequelize, DataTypes) => {
  const PiiConsent = sequelize.define(
    "PiiConsent",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
        allowNull: false,
      },
      userKycId: {
        type: DataTypes.UUID,
        field: "user_kyc_id",
        allowNull: true,
      },
      businessKycId: {
        type: DataTypes.UUID,
        field: "business_kyc_id",
        allowNull: true,
      },
      piiType: {
        type: DataTypes.STRING,
        field: "pii_type",
        allowNull: false,
      },
      piiHash: {
        type: DataTypes.STRING,
        field: "pii_hash",
        allowNull: false,
      },
      providedAt: {
        type: DataTypes.DATE,
        field: "provided_at",
        defaultValue: DataTypes.NOW,
      },
      expiresAt: {
        type: DataTypes.DATE,
        field: "expires_at",
        allowNull: false,
      },
      scope: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "pii_consents",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "pii_type", "scope"],
        },
        {
          fields: ["user_kyc_id"],
        },
      ],
    }
  );

  PiiConsent.associate = function (models) {
    PiiConsent.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    PiiConsent.belongsTo(models.UserKyc, {
      foreignKey: "user_kyc_id",
      as: "userKyc",
    });
    PiiConsent.belongsTo(models.BusinessKyc, {
      foreignKey: "business_kyc_id",
      as: "businessKyc",
    });
  };

  return PiiConsent;
};
