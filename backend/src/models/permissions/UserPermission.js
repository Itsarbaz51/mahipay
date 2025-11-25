export default (sequelize, DataTypes) => {
  const UserPermission = sequelize.define(
    "UserPermission",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      serviceId: {
        type: DataTypes.UUID,
        field: "service_id",
        allowNull: true, // global permissions ke liye
      },
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
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
      tableName: "user_permissions",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "permission", "service_id"],
          where: {
            is_active: true,
            revoked_at: null,
          },
        },
        {
          fields: ["created_by_id", "created_by_type"],
        },
        {
          fields: ["user_id"],
        },
        {
          fields: ["is_active"],
        },
      ],
    }
  );

  UserPermission.associate = function (models) {
    UserPermission.belongsTo(models.ServiceProvider, {
      foreignKey: "service_id",
      as: "service",
    });
    UserPermission.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    // Polymorphic associations for createdBy
    UserPermission.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      as: "createdByRoot",
      constraints: false,
      scope: {
        created_by_type: "ROOT",
      },
    });
    UserPermission.belongsTo(models.User, {
      foreignKey: "created_by_id",
      as: "createdByAdmin",
      constraints: false,
      scope: {
        created_by_type: "ADMIN",
      },
    });
  };

  return UserPermission;
};