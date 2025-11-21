import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Address = sequelize.define('Address', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    pin_code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    city_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'addresses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['city_id'] },
      { fields: ['state_id'] }
    ]
  });

  Address.associate = (models) => {
    Address.belongsTo(models.City, { foreignKey: 'city_id', as: 'city' });
    Address.belongsTo(models.State, { foreignKey: 'state_id', as: 'state' });
    Address.hasMany(models.UserKyc, { foreignKey: 'address_id', as: 'UserKyc' });
    Address.hasMany(models.BusinessKyc, { foreignKey: 'address_id', as: 'businessKycs' });
  };

  return Address;
};