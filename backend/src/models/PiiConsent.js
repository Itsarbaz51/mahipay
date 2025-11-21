import { DataTypes } from "sequelize";

export default (sequelize) => {
  const PiiConsent = sequelize.define('PiiConsent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    user_kyc_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    pii_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pii_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    provided_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    scope: {
      type: DataTypes.STRING,
      allowNull: false
    },
    business_kyc_id: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'pii_consents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'pii_type', 'scope']
      },
      { fields: ['user_kyc_id'] }
    ]
  });

  PiiConsent.associate = (models) => {
    PiiConsent.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    PiiConsent.belongsTo(models.UserKyc, { foreignKey: 'user_kyc_id', as: 'userKyc' });
    PiiConsent.belongsTo(models.BusinessKyc, { foreignKey: 'business_kyc_id', as: 'businessKyc' });
  };

  return PiiConsent;
};