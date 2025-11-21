import { DataTypes } from "sequelize";

export default (sequelize) => {
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
      },
      description: {
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
    },
    {
      tableName: "departments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ fields: ["created_by_id", "created_by_type"] }],
    }
  );

  Department.associate = (models) => {
    Department.hasMany(models.Employee, {
      foreignKey: "department_id",
      as: "employees",
    });
    Department.hasMany(models.DepartmentPermission, {
      foreignKey: "department_id",
      as: "departmentPermissions",
    });
    Department.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      as: "createdByRoot",
      constraints: false,
    });
    Department.belongsTo(models.User, {
      foreignKey: "created_by_id",
      as: "createdByUser",
      constraints: false,
    });
  };

  return Department;
};
