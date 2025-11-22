export default (sequelize, DataTypes) => {
  const SystemSetting = sequelize.define(
    "SystemSetting",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      companyName: {
        type: DataTypes.STRING,
        field: "company_name",
        allowNull: false,
      },
      companyLogo: {
        type: DataTypes.STRING,
        field: "company_logo",
        allowNull: false,
      },
      favIcon: {
        type: DataTypes.STRING,
        field: "fav_icon",
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        field: "phone_number",
        allowNull: false,
      },
      whatsappNumber: {
        type: DataTypes.STRING,
        field: "whatsapp_number",
        allowNull: false,
      },
      companyEmail: {
        type: DataTypes.STRING,
        field: "company_email",
        allowNull: false,
      },
      facebookUrl: {
        type: DataTypes.STRING,
        field: "facebook_url",
        allowNull: false,
      },
      instagramUrl: {
        type: DataTypes.STRING,
        field: "instagram_url",
        allowNull: false,
      },
      twitterUrl: {
        type: DataTypes.STRING,
        field: "twitter_url",
        allowNull: false,
      },
      linkedinUrl: {
        type: DataTypes.STRING,
        field: "linkedin_url",
        allowNull: false,
      },
      websiteUrl: {
        type: DataTypes.STRING,
        field: "website_url",
        allowNull: false,
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      rootId: {
        type: DataTypes.UUID,
        field: "root_id",
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "system_settings",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["root_id"],
        },
      ],
    }
  );

  SystemSetting.associate = function (models) {
    SystemSetting.belongsTo(models.Root, { foreignKey: "root_id", as: "root" });
  };

  return SystemSetting;
};
