export default (sequelize, DataTypes) => {
  const ApiIntegration = sequelize.define(
    "ApiIntegration",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      platformName: {
        type: DataTypes.STRING,
        field: "platform_name",
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      serviceName: {
        type: DataTypes.STRING,
        field: "service_name",
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      apiBaseUrl: {
        type: DataTypes.TEXT,
        field: "api_base_url",
        allowNull: false,
        validate: {
          notEmpty: true,
          isUrl: true,
        },
      },
      credentials: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: "is_active",
        defaultValue: true,
      },
      // Only ROOT can create API integrations
      createdByRootId: {
        type: DataTypes.UUID,
        field: "created_by_root_id",
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
      tableName: "api_integrations",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["platform_name", "service_name", "created_by_root_id"],
        },
      ],
    }
  );

  ApiIntegration.associate = function (models) {
    // Root who created this integration
    ApiIntegration.belongsTo(models.Root, {
      foreignKey: "created_by_root_id",
      as: "createdByRoot",
      onDelete: "CASCADE",
    });

    // Service providers associated with this integration
    ApiIntegration.hasMany(models.ServiceProvider, {
      foreignKey: "integration_id",
      as: "serviceProviders",
      onDelete: "CASCADE",
    });
  };

  // Instance methods
  ApiIntegration.prototype.isOperational = function () {
    return this.isActive;
  };

  // Class methods
  ApiIntegration.findByPlatformAndService = function (
    platformName,
    serviceName,
    rootId
  ) {
    return this.findOne({
      where: {
        platformName,
        serviceName,
        rootId,
      },
    });
  };

  ApiIntegration.findActiveByRoot = function (rootId) {
    return this.findAll({
      where: {
        rootId,
        isActive: true,
      },
    });
  };

  return ApiIntegration;
};
