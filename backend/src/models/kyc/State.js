export default  (sequelize, DataTypes) => {
  const State = sequelize.define('State', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    stateName: {
      type: DataTypes.STRING,
      field: 'state_name',
      allowNull: false
    },
    stateCode: {
      type: DataTypes.STRING,
      field: 'state_code',
      unique: true,
      allowNull: false
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
    }
  }, {
    tableName: 'states',
    timestamps: true,
    underscored: true
  });

  State.associate = function(models) {
    State.hasMany(models.Address, { foreignKey: 'state_id', as: 'Address' });
  };

  return State;
};