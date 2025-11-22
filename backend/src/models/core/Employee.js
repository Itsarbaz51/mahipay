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
      },
      firstName: {
        type: DataTypes.STRING,
        field: "first_name",
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        field: "last_name",
        allowNull: false,
      },
      profileImage: {
        type: DataTypes.TEXT,
        field: "profile_image",
        allowNull: true,
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
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      departmentId: {
        type: DataTypes.UUID,
        field: "department_id",
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"),
        defaultValue: "ACTIVE",
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
      indexes: [
        {
          fields: ["department_id"],
        },
        {
          fields: ["created_by_id", "created_by_type"],
        },
      ],
    }
  );

  Employee.associate = function (models) {
    Employee.belongsTo(models.Department, {
      foreignKey: "department_id",
      as: "department",
    });
    Employee.hasMany(models.EmployeePermission, {
      foreignKey: "employee_id",
      as: "employeePermissions",
    });
    Employee.belongsTo(models.Root, { foreignKey: "root_id", as: "root" });
    Employee.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    Employee.belongsTo(models.User, {
      foreignKey: "created_by_id",
      as: "createdByUser",
    });
  };

  return Employee;
};
