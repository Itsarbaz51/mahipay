export default (sequelize, DataTypes) => {
  const Department = sequelize.define(
    "Department",
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
      tableName: "departments",
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
      ],
    }
  );

  Department.associate = function (models) {
    Department.hasMany(models.Employee, {
      foreignKey: "department_id",
      as: "employees",
      onDelete: "RESTRICT", // Prevent Department deletion if users exist
      onUpdate: "CASCADE",
    });
    Department.hasMany(models.DepartmentPermission, {
      foreignKey: "department_id",
      as: "departmentPermissions",
      onDelete: "CASCADE", // Delete permissions when Department is deleted
      onUpdate: "CASCADE",
    });
    Department.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      as: "createdByRoot",
      constraints: false,
      scope: {
        created_by_type: "ROOT",
      },
    });
    Department.belongsTo(models.User, {
      foreignKey: "created_by_id",
      as: "createdByUser",
      constraints: false,
      scope: {
        created_by_type: "ADMIN",
      },
    });
  };

  // Instance methods
  Department.prototype.getCreator = function () {
    return this[
      `createdBy${this.createdByType.charAt(0) + this.createdByType.slice(1).toLowerCase()}`
    ];
  };

  Department.findByName = function (name) {
    return this.findOne({ where: { name } });
  };

  return Department;
};
