import { DataTypes } from "sequelize";

export default (sequelize) => {
  const EmployeePermission = sequelize.define('EmployeePermission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    permission: {
      type: DataTypes.STRING,
      allowNull: false
    },
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_by_type: {
      type: DataTypes.ENUM('ROOT', 'ADMIN'),
      allowNull: false
    },
    created_by_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'employee_permissions',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['employee_id', 'permission']
      },
      { fields: ['created_by_id', 'created_by_type'] }
    ]
  });

  EmployeePermission.associate = (models) => {
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