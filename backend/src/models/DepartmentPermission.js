import { DataTypes } from "sequelize";

export default (sequelize) => {
  const DepartmentPermission = sequelize.define('DepartmentPermission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    department_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    permission: {
      type: DataTypes.STRING,
      allowNull: false
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
    tableName: 'department_permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['department_id', 'permission']
      },
      { fields: ['created_by_id', 'created_by_type'] }
    ]
  });

  DepartmentPermission.associate = (models) => {
    DepartmentPermission.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
    DepartmentPermission.belongsTo(models.Root, { 
      foreignKey: 'created_by_id', 
      as: 'createdByRoot',
      constraints: false
    });
    DepartmentPermission.belongsTo(models.User, { 
      foreignKey: 'created_by_id', 
      as: 'createdByUser',
      constraints: false
    });
  };

  return DepartmentPermission;
};