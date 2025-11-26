export default (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    "Employee",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 50],
        },
      },
      firstName: {
        type: DataTypes.STRING,
        field: "first_name",
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },
      lastName: {
        type: DataTypes.STRING,
        field: "last_name",
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },
      profileImage: {
        type: DataTypes.TEXT,
        field: "profile_image",
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      phoneNumber: {
        type: DataTypes.STRING,
        unique: true,
        field: "phone_number",
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [6, 255],
        },
      },
      departmentId: {
        type: DataTypes.UUID,
        field: "department_id",
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"),
        defaultValue: "ACTIVE",
        validate: {
          isIn: [["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"]],
        },
      },
      refreshToken: {
        type: DataTypes.TEXT,
        field: "refresh_token",
        allowNull: true,
      },
      passwordResetToken: {
        type: DataTypes.STRING,
        field: "password_reset_token",
        allowNull: true,
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        field: "password_reset_expires",
        allowNull: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        field: "last_login_at",
        allowNull: true,
      },
      hierarchyLevel: {
        type: DataTypes.INTEGER,
        field: "hierarchy_level",
        allowNull: false, // Removed unique constraint
        validate: {
          min: 0,
        },
      },
      hierarchyPath: {
        type: DataTypes.TEXT, // Changed to TEXT
        field: "hierarchy_path",
        allowNull: false,
        validate: {
          notEmpty: true,
        },
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
      deactivationReason: {
        type: DataTypes.TEXT,
        field: "deactivation_reason",
        allowNull: true,
      },
      createdByType: {
        type: DataTypes.ENUM("ROOT", "ADMIN"),
        field: "created_by_type",
        allowNull: false,
        validate: {
          isIn: [["ROOT", "ADMIN"]],
        },
      },
      createdById: {
        type: DataTypes.UUID,
        field: "created_by_id",
        allowNull: false,
      },
      rootId: {
        type: DataTypes.UUID,
        field: "root_id",
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
        allowNull: true,
      },
    },
    {
      tableName: "employees",
      timestamps: true,
      underscored: true,
      paranoid: true, // Added soft delete support
      indexes: [
        {
          fields: ["department_id"],
        },
        {
          fields: ["created_by_id", "created_by_type"],
        },
        {
          unique: true,
          fields: ["username"],
        },
        {
          unique: true,
          fields: ["email"],
        },
        {
          unique: true,
          fields: ["phone_number"],
        },
        {
          fields: ["status"],
        },
      ],
    }
  );

  Employee.associate = function (models) {
    Employee.belongsTo(models.Department, {
      foreignKey: "department_id",
      as: "department",
      onDelete: "RESTRICT",
    });
    Employee.hasMany(models.EmployeePermission, {
      foreignKey: "employee_id",
      as: "employeePermissions",
      onDelete: "CASCADE",
    });
    Employee.belongsTo(models.Root, {
      foreignKey: "root_id",
      as: "root",
      onDelete: "CASCADE",
    });
    Employee.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });
    // Polymorphic association for creator
    Employee.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      as: "createdByRoot",
      constraints: false,
    });
    Employee.belongsTo(models.User, {
      foreignKey: "created_by_id",
      as: "createdByUser",
      constraints: false,
    });
  };

  // Instance methods
  Employee.prototype.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
  };

  Employee.prototype.isActive = function () {
    return this.status === "ACTIVE";
  };

  // Class methods
  Employee.findByEmail = function (email) {
    return this.findOne({ where: { email } });
  };

  return Employee;
};
