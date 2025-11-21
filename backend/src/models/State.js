import { DataTypes } from "sequelize";

export default (sequelize) => {
  const State = sequelize.define('State', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    state_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state_code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    }
  }, {
    tableName: 'states',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  State.associate = (models) => {
    State.hasMany(models.Address, { foreignKey: 'state_id', as: 'Address' });
  };

  return State;
};