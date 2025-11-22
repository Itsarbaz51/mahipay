export default  (sequelize, DataTypes) => {
  const City = sequelize.define(
    "City",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      cityName: {
        type: DataTypes.STRING,
        field: "city_name",
        allowNull: false,
      },
      cityCode: {
        type: DataTypes.STRING,
        field: "city_code",
        unique: true,
        allowNull: false,
      },
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
      tableName: "cities",
      timestamps: true,
      underscored: true,
    }
  );

  City.associate = function (models) {
    City.hasMany(models.Address, { foreignKey: "city_id", as: "Address" });
  };

  return City;
};
