export default (sequelize, DataTypes) => {
  const ServiceProvider = sequelize.define(
    "ServiceProvider",
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
      integrationId: {
        type: DataTypes.UUID,
        field: "integration_id",
        allowNull: false,
      },
      serviceName: {
        type: DataTypes.STRING,
        field: "service_name",
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
        defaultValue: "ACTIVE",
        validate: {
          isIn: [["ACTIVE", "INACTIVE"]],
        },
      },
      // Who assigned this service (ROOT or ADMIN)
      assignedByType: {
        type: DataTypes.ENUM("ROOT", "ADMIN"),
        field: "assigned_by_type",
        allowNull: false,
        validate: {
          isIn: [["ROOT", "ADMIN"]],
        },
      },
      assignedById: {
        type: DataTypes.UUID,
        field: "assigned_by_id",
        allowNull: false,
      },
      rootId: {
        type: DataTypes.UUID,
        field: "root_id",
        allowNull: false,
      },
      // Hierarchy fields
      hierarchyLevel: {
        type: DataTypes.INTEGER,
        field: "hierarchy_level",
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      hierarchyPath: {
        type: DataTypes.TEXT,
        field: "hierarchy_path",
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      canReassign: {
        type: DataTypes.BOOLEAN,
        field: "can_reassign",
        defaultValue: true,
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
      tableName: "service_providers",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["user_id"],
        },
        {
          fields: ["integration_id"],
        },
        {
          fields: ["root_id"],
        },
        {
          fields: ["assigned_by_id", "assigned_by_type"],
        },
        {
          fields: ["hierarchy_path"],
        },
        {
          fields: ["status"],
        },
      ],
    }
  );

  ServiceProvider.associate = function (models) {
    // User who owns this service provider
    ServiceProvider.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });

    // API Integration
    ServiceProvider.belongsTo(models.ApiIntegration, {
      foreignKey: "integration_id",
      as: "integration",
      onDelete: "CASCADE",
    });

    // Root association
    ServiceProvider.belongsTo(models.Root, {
      foreignKey: "root_id",
      as: "root",
      onDelete: "CASCADE",
    });

    // Transaction relations
    ServiceProvider.hasMany(models.Transaction, {
      foreignKey: "service_id",
      as: "transactions",
      onDelete: "RESTRICT",
    });

    // Commission relations
    ServiceProvider.hasMany(models.CommissionSetting, {
      foreignKey: "service_id",
      as: "commissionSettings",
      onDelete: "CASCADE",
    });

    // Ledger entries
    ServiceProvider.hasMany(models.LedgerEntry, {
      foreignKey: "service_id",
      as: "ledgerEntries",
      onDelete: "RESTRICT",
    });

    // Role permissions for this service
    ServiceProvider.hasMany(models.RolePermission, {
      foreignKey: "service_id",
      as: "rolePermissions",
      onDelete: "CASCADE",
    });

    // User permissions for this service
    ServiceProvider.hasMany(models.UserPermission, {
      foreignKey: "service_id",
      as: "userPermissions",
      onDelete: "CASCADE",
    });

    // FIXED: Polymorphic assigner association - use string references
    ServiceProvider.belongsTo(models.Root, {
      foreignKey: "assigned_by_id",
      as: "assignedByRoot",
      constraints: false,
      scope: {
        assigned_by_type: "ROOT",
      },
    });

    ServiceProvider.belongsTo(models.User, {
      foreignKey: "assigned_by_id",
      as: "assignedByAdmin",
      constraints: false,
      scope: {
        assigned_by_type: "ADMIN",
      },
    });
  };

  // Instance methods
  ServiceProvider.prototype.isActive = function () {
    return this.status === "ACTIVE";
  };

  ServiceProvider.prototype.canBeReassigned = function () {
    return this.canReassign && this.isActive();
  };

  // Class methods
  ServiceProvider.findByUserAndIntegration = function (userId, integrationId) {
    return this.findOne({
      where: {
        userId,
        integrationId,
      },
    });
  };

  ServiceProvider.findActiveByUser = function (userId) {
    return this.findAll({
      where: {
        userId,
        status: "ACTIVE",
      },
    });
  };

  ServiceProvider.findByRoot = function (rootId) {
    return this.findAll({
      where: {
        rootId,
      },
      include: [
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          association: "integration",
          attributes: ["id", "platformName", "serviceName"],
        },
      ],
    });
  };

  return ServiceProvider;
};
