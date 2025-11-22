export default (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    "AuditLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      // Action metadata
      action: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      entity: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      entityId: {
        type: DataTypes.STRING,
        field: "entity_id",
        allowNull: false,
      },

      // User who performed the action
      performedByType: {
        type: DataTypes.ENUM("ROOT", "ADMIN", "EMPLOYEE", "SYSTEM"),
        field: "performed_by_type",
        allowNull: false,
      },
      performedById: {
        type: DataTypes.UUID,
        field: "performed_by_id",
        allowNull: false,
      },

      // Target user (if applicable)
      targetUserType: {
        type: DataTypes.ENUM("ROOT", "ADMIN", "EMPLOYEE"),
        field: "target_user_type",
        allowNull: true,
      },
      targetUserId: {
        type: DataTypes.UUID,
        field: "target_user_id",
        allowNull: true,
      },

      // Changes tracking
      oldValues: {
        type: DataTypes.JSON,
        field: "old_values",
        allowNull: true,
      },
      newValues: {
        type: DataTypes.JSON,
        field: "new_values",
        allowNull: true,
      },
      changedFields: {
        type: DataTypes.JSON,
        field: "changed_fields",
        allowNull: true,
      },

      // Request context
      ipAddress: {
        type: DataTypes.STRING(45), // IPv6 support
        field: "ip_address",
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        field: "user_agent",
        allowNull: true,
      },
      requestId: {
        type: DataTypes.STRING,
        field: "request_id",
        allowNull: true,
      },

      // Additional context
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("SUCCESS", "FAILED", "PENDING"),
        defaultValue: "SUCCESS",
      },
      errorMessage: {
        type: DataTypes.TEXT,
        field: "error_message",
        allowNull: true,
      },

      // Timestamps
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
      tableName: "audit_logs",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["entity", "entity_id"],
        },
        {
          fields: ["performed_by_type", "performed_by_id"],
        },
        {
          fields: ["action", "created_at"],
        },
        {
          fields: ["target_user_type", "target_user_id"],
        },
        {
          fields: ["created_at"],
        },
        {
          fields: ["request_id"],
        },
      ],
    }
  );

  AuditLog.associate = function (models) {
    // Polymorphic associations for performer
    AuditLog.belongsTo(models.Root, {
      foreignKey: "performed_by_id",
      as: "performedByRoot",
      constraints: false,
    });
    AuditLog.belongsTo(models.User, {
      foreignKey: "performed_by_id",
      as: "performedByUser",
      constraints: false,
    });
    AuditLog.belongsTo(models.Employee, {
      foreignKey: "performed_by_id",
      as: "performedByEmployee",
      constraints: false,
    });

    // Polymorphic associations for target user
    AuditLog.belongsTo(models.Root, {
      foreignKey: "target_user_id",
      as: "targetRoot",
      constraints: false,
    });
    AuditLog.belongsTo(models.User, {
      foreignKey: "target_user_id",
      as: "targetUser",
      constraints: false,
    });
    AuditLog.belongsTo(models.Employee, {
      foreignKey: "target_user_id",
      as: "targetEmployee",
      constraints: false,
    });
  };

  return AuditLog;
};
