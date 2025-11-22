export default  (sequelize, DataTypes) => {
  const UserKyc = sequelize.define('UserKyc', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      unique: true,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      field: 'first_name',
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      field: 'last_name',
      allowNull: false
    },
    fatherName: {
      type: DataTypes.STRING,
      field: 'father_name',
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
    kycRejectionReason: {
      type: DataTypes.TEXT,
      field: 'kyc_rejection_reason',
      allowNull: true
    },
    addressId: {
      type: DataTypes.UUID,
      field: 'address_id',
      allowNull: false
    },
    panFile: {
      type: DataTypes.STRING,
      field: 'pan_file',
      allowNull: false
    },
    aadhaarFile: {
      type: DataTypes.STRING,
      field: 'aadhaar_file',
      allowNull: false
    },
    addressProofFile: {
      type: DataTypes.STRING,
      field: 'address_proof_file',
      allowNull: false
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at',
      allowNull: true
    },
    verifiedByType: {
      type: DataTypes.ENUM('ROOT', 'ADMIN'),
      field: 'verified_by_type',
      allowNull: true
    },
    verifiedById: {
      type: DataTypes.UUID,
      field: 'verified_by_id',
      allowNull: true
    },
    verifiedAt: {
      type: DataTypes.DATE,
      field: 'verified_at',
      allowNull: true
    }
  }, {
    tableName: 'user_kyc',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['verified_by_id', 'verified_by_type']
      }
    ]
  });

  UserKyc.associate = function(models) {
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