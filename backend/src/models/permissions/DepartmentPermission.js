export default (sequelize, DataTypes) => {
  const DepartmentPermission = sequelize.define(
    "DepartmentPermission",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      departmentId: {
        type: DataTypes.UUID,
        field: "department_id",
        allowNull: false,
      },
      permission: {
        type: DataTypes.STRING,
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
    },
    {
      tableName: "department_permissions",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["department_id", "permission"],
        },
        {
          fields: ["created_by_id", "created_by_type"],
        },
      ],
    }
  );

  DepartmentPermission.associate = function (models) {
    DepartmentPermission.belongsTo(models.Department, {
      foreignKey: "department_id",
      as: "department",
    });
    DepartmentPermission.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      as: "createdByRoot",
      constraints: false,
    });
    DepartmentPermission.belongsTo(models.User, {
      foreignKey: "created_by_id",
      as: "createdByUser",
      constraints: false,
    });
  };

  return DepartmentPermission;
};
