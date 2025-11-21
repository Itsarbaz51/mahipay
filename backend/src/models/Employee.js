import { DataTypes } from "sequelize";

export default (sequelize) => {
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
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      profile_image: {
        type: DataTypes.TEXT,
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
      phone_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"),
        defaultValue: "ACTIVE",
      },
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      password_reset_token: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password_reset_expires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deactivation_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by_type: {
        type: DataTypes.ENUM("ROOT", "ADMIN"),
        allowNull: false,
      },
      created_by_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      root_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: "employees",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["department_id"] },
        { fields: ["created_by_id", "created_by_type"] },
      ],
    }
  );

  Employee.associate = (models) => {
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
      constraints: false,
    });
  };

  return Employee;
};
