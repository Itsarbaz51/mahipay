import { DataTypes } from "sequelize";

export default (sequelize) => {
  const SystemSetting = sequelize.define('SystemSetting', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    company_logo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fav_icon: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    whatsapp_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    company_email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    facebook_url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    instagram_url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    twitter_url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    linkedin_url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    website_url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true
    },
    root_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'system_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['root_id'] }
    ]
  });

  SystemSetting.associate = (models) => {
    SystemSetting.belongsTo(models.Root, { foreignKey: 'root_id', as: 'root' });
  };

  return SystemSetting;
};