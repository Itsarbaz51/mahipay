export default (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 50], // Added validation for name length
        },
      },
      hierarchyLevel: {
        type: DataTypes.INTEGER,
        field: "hierarchy_level",
        unique: true,
        allowNull: false,
        validate: {
          min: 1, // Ensure positive hierarchy level
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 1000], // Optional: limit description length
        },
      },
      createdByType: {
        type: DataTypes.ENUM("ROOT", "ADMIN"),
        field: "created_by_type",
        allowNull: false,
        validate: {
          isIn: [["ROOT", "ADMIN"]], // Validation for enum values
        },
      },
      createdById: {
        type: DataTypes.UUID,
        field: "created_by_id",
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
      tableName: "roles",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["created_by_id", "created_by_type"],
        },
        {
          unique: true,
          fields: ["name"], // Explicit unique index for name
        },
        {
          unique: true,
          fields: ["hierarchy_level"], // Explicit unique index for hierarchy_level
        },
      ],
    }
  );

  Role.associate = function (models) {
    Role.hasMany(models.User, {
      foreignKey: "role_id",
      as: "users",
      onDelete: "RESTRICT", // Prevent role deletion if users exist
      onUpdate: "CASCADE",
    });

    Role.hasMany(models.RolePermission, {
      foreignKey: "role_id",
      as: "rolePermissions",
      onDelete: "CASCADE", // Delete permissions when role is deleted
      onUpdate: "CASCADE",
    });

    Role.hasMany(models.CommissionSetting, {
      foreignKey: "role_id",
      as: "commissionSettings",
      onDelete: "CASCADE", // Delete commission settings when role is deleted
      onUpdate: "CASCADE",
    });

    // Polymorphic association for creator
    Role.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      constraints: false,
      as: "createdByRoot",
      scope: {
        created_by_type: "ROOT",
      },
    });

    Role.belongsTo(models.User, {
      foreignKey: "created_by_id",
      constraints: false,
      as: "createdByUser",
      scope: {
        created_by_type: "ADMIN",
      },
    });
  };

  // Instance methods
  Role.prototype.getCreator = function () {
    return this[
      `createdBy${this.createdByType.charAt(0) + this.createdByType.slice(1).toLowerCase()}`
    ];
  };

  // Class methods
  Role.findByHierarchyLevel = function (level) {
    return this.findOne({ where: { hierarchyLevel: level } });
  };

  Role.findByName = function (name) {
    return this.findOne({ where: { name } });
  };

  return Role;
};
