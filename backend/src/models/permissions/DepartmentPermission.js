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
      assignedAt: {
        type: DataTypes.DATE,
        field: "assigned_at",
        defaultValue: DataTypes.NOW,
      },
      revokedAt: {
        type: DataTypes.DATE,
        field: "revoked_at",
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: "is_active",
        defaultValue: true,
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
          where: {
            is_active: true,
            revoked_at: null,
          },
        },
        {
          fields: ["created_by_id", "created_by_type"],
        },
        {
          fields: ["department_id"],
        },
        {
          fields: ["is_active"],
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
      scope: {
        created_by_type: "ROOT",
      },
    });
    DepartmentPermission.belongsTo(models.User, {
      foreignKey: "created_by_id",
      as: "createdByUser",
      constraints: false,
      scope: {
        created_by_type: "ADMIN",
      },
    });
  };

  return DepartmentPermission;
};
