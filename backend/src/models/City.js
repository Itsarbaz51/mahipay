import { DataTypes } from "sequelize";

export default (sequelize) => {
  const City = sequelize.define('City', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    city_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city_code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    }
  }, {
    tableName: 'cities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  City.associate = (models) => {
    City.hasMany(models.Address, { foreignKey: 'city_id', as: 'Address' });
  };

  return City;
};