export default  (sequelize, DataTypes) => {
  const BusinessKyc = sequelize.define('BusinessKyc', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      allowNull: false
    },
    businessName: {
      type: DataTypes.TEXT,
      field: 'business_name',
      allowNull: false
    },
    businessType: {
      type: DataTypes.ENUM('PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED'),
      field: 'business_type',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
      defaultValue: 'PENDING'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      field: 'rejection_reason',
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
    gstFile: {
      type: DataTypes.STRING,
      field: 'gst_file',
      allowNull: false
    },
    udhyamAadhar: {
      type: DataTypes.STRING,
      field: 'udhyam_aadhar',
      allowNull: true
    },
    brDoc: {
      type: DataTypes.STRING,
      field: 'br_doc',
      allowNull: true
    },
    partnershipDeed: {
      type: DataTypes.STRING,
      field: 'partnership_deed',
      allowNull: true
    },
    partnerKycNumbers: {
      type: DataTypes.INTEGER,
      field: 'partner_kyc_numbers',
      allowNull: true
    },
    cin: {
      type: DataTypes.STRING,
      field: 'cin',
      allowNull: true
    },
    moaFile: {
      type: DataTypes.STRING,
      field: 'moa_file',
      allowNull: true
    },
    aoaFile: {
      type: DataTypes.STRING,
      field: 'aoa_file',
      allowNull: true
    },
    directorKycNumbers: {
      type: DataTypes.INTEGER,
      field: 'director_kyc_numbers',
      defaultValue: 2,
      allowNull: true
    },
    directorShareholding: {
      type: DataTypes.STRING,
      field: 'director_shareholding_file',
      allowNull: true
    },
    verifiedByRootId: {
      type: DataTypes.UUID,
      field: 'verified_by_root_id',
      allowNull: true
    },
    verifiedAt: {
      type: DataTypes.DATE,
      field: 'verified_at',
      allowNull: true
    },
    rootId: {
      type: DataTypes.UUID,
      field: 'root_id',
      allowNull: true
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
    }
  }, {
    tableName: 'business_kycs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id']
      },
      {
        fields: ['user_id', 'status']
      },
      {
        fields: ['verified_by_root_id']
      },
      {
        fields: ['root_id']
      }
    ]
  });

  BusinessKyc.associate = function(models) {
    BusinessKyc.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    BusinessKyc.belongsTo(models.Address, { foreignKey: 'address_id', as: 'address' });
    BusinessKyc.hasMany(models.PiiConsent, { foreignKey: 'business_kyc_id', as: 'piiConsents' });
    BusinessKyc.belongsTo(models.Root, { foreignKey: 'verified_by_root_id', as: 'verifiedByRoot' });
    BusinessKyc.belongsTo(models.Root, { foreignKey: 'root_id', as: 'root' });
  };

  return BusinessKyc;
};