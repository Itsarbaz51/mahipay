export default  (sequelize, DataTypes) => {
  const UserPermission = sequelize.define('UserPermission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serviceId: {
      type: DataTypes.UUID,
      field: 'service_id',
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      allowNull: false
    },
    canView: {
      type: DataTypes.BOOLEAN,
      field: 'can_view',
      defaultValue: false
    },
    canEdit: {
      type: DataTypes.BOOLEAN,
      field: 'can_edit',
      defaultValue: false
    },
    canSetCommission: {
      type: DataTypes.BOOLEAN,
      field: 'can_set_commission',
      defaultValue: false
    },
    canProcess: {
      type: DataTypes.BOOLEAN,
      field: 'can_process',
      defaultValue: false
    },
    limits: {
      type: DataTypes.JSON,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    },
    createdByType: {
      type: DataTypes.ENUM('ROOT', 'ADMIN'),
      field: 'created_by_type',
      allowNull: false
    },
    createdById: {
      type: DataTypes.UUID,
      field: 'created_by_id',
      allowNull: false
    }
  }, {
    tableName: 'user_permissions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'service_id']
      },
      {
        fields: ['created_by_id', 'created_by_type']
      }
    ]
  });

  UserPermission.associate = function(models) {
    UserPermission.belongsTo(models.ServiceProvider, { foreignKey: 'service_id', as: 'service' });
    UserPermission.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    UserPermission.belongsTo(models.Root, { 
      foreignKey: 'created_by_id', 
      as: 'createdByRoot',
      constraints: false 
    });
    UserPermission.belongsTo(models.User, { 
      foreignKey: 'created_by_id', 
      as: 'createdByUser',
      constraints: false 
    });
  };

  return UserPermission;
};