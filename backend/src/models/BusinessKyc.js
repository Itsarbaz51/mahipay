import { DataTypes } from "sequelize";

export default (sequelize) => {
  const BusinessKyc = sequelize.define('BusinessKyc', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    business_name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    business_type: {
      type: DataTypes.ENUM('PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
      defaultValue: 'PENDING'
    },
    rejection_reason: {
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
    gst_file: {
      type: DataTypes.STRING,
      allowNull: false
    },
    udhyam_aadhar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    br_doc: {
      type: DataTypes.STRING,
      allowNull: true
    },
    partnership_deed: {
      type: DataTypes.STRING,
      allowNull: true
    },
    partner_kyc_numbers: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cin: {
      type: DataTypes.STRING,
      allowNull: true
    },
    moa_file: {
      type: DataTypes.STRING,
      allowNull: true
    },
    aoa_file: {
      type: DataTypes.STRING,
      allowNull: true
    },
    director_kyc_numbers: {
      type: DataTypes.INTEGER,
      defaultValue: 2
    },
    director_shareholding_file: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verified_by_root_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    root_id: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'business_kycs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { 
        unique: true,
        fields: ['user_id']
      },
      { fields: ['user_id', 'status'] },
      { fields: ['verified_by_root_id'] },
      { fields: ['root_id'] }
    ]
  });

  BusinessKyc.associate = (models) => {
    BusinessKyc.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    BusinessKyc.belongsTo(models.Address, { foreignKey: 'address_id', as: 'address' });
    BusinessKyc.hasMany(models.PiiConsent, { foreignKey: 'business_kyc_id', as: 'piiConsents' });
    BusinessKyc.belongsTo(models.Root, { foreignKey: 'verified_by_root_id', as: 'verifiedByRoot' });
    BusinessKyc.belongsTo(models.Root, { foreignKey: 'root_id', as: 'root' });
  };

  return BusinessKyc;
};