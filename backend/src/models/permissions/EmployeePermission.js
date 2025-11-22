export default  (sequelize, DataTypes) => {
  const EmployeePermission = sequelize.define('EmployeePermission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employeeId: {
      type: DataTypes.UUID,
      field: 'employee_id',
      allowNull: false
    },
    permission: {
      type: DataTypes.STRING,
      allowNull: false
    },
    assignedAt: {
      type: DataTypes.DATE,
      field: 'assigned_at',
      defaultValue: DataTypes.NOW
    },
    revokedAt: {
      type: DataTypes.DATE,
      field: 'revoked_at',
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: 'is_active',
      defaultValue: true
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
    tableName: 'employee_permissions',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['employee_id', 'permission']
      },
      {
        fields: ['created_by_id', 'created_by_type']
      }
    ]
  });

  EmployeePermission.associate = function(models) {
    EmployeePermission.belongsTo(models.Employee, { foreignKey: 'employee_id', as: 'employee' });
    EmployeePermission.belongsTo(models.Root, { 
      foreignKey: 'created_by_id', 
      as: 'createdByRoot',
      constraints: false 
    });
    EmployeePermission.belongsTo(models.User, { 
      foreignKey: 'created_by_id', 
      as: 'createdByUser',
      constraints: false 
    });
  };

  return EmployeePermission;
};