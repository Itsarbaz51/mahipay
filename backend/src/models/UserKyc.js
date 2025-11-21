import { DataTypes } from "sequelize";

export default (sequelize) => {
  const UserKyc = sequelize.define('UserKyc', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    father_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
      defaultValue: 'PENDING'
    },
    type: {
      type: DataTypes.ENUM('AEPS', 'USER_KYC'),
      defaultValue: 'USER_KYC'
    },
    kyc_rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    pan_file: {
      type: DataTypes.STRING,
      allowNull: false
    },
    aadhaar_file: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address_proof_file: {
      type: DataTypes.STRING,
      allowNull: false
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verified_by_type: {
      type: DataTypes.ENUM('ROOT', 'ADMIN'),
      allowNull: true
    },
    verified_by_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_kyc',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['verified_by_id', 'verified_by_type'] }
    ]
  });

  UserKyc.associate = (models) => {
    UserKyc.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    UserKyc.belongsTo(models.Address, { foreignKey: 'address_id', as: 'address' });
    UserKyc.hasMany(models.PiiConsent, { foreignKey: 'user_kyc_id', as: 'piiConsents' });
    UserKyc.belongsTo(models.Root, { 
      foreignKey: 'verified_by_id', 
      as: 'verifiedByRoot',
      constraints: false
    });
    UserKyc.belongsTo(models.User, { 
      foreignKey: 'verified_by_id', 
      as: 'verifiedByUser',
      constraints: false
    });
  };

  return UserKyc;
};