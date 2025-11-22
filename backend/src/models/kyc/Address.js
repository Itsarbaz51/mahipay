export default (sequelize, DataTypes) => {
  const Address = sequelize.define(
    "Address",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      pinCode: {
        type: DataTypes.STRING,
        field: "pin_code",
        allowNull: false,
      },
      stateId: {
        type: DataTypes.UUID,
        field: "state_id",
        allowNull: false,
      },
      cityId: {
        type: DataTypes.UUID,
        field: "city_id",
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
      tableName: "addresses",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["city_id"],
        },
        {
          fields: ["state_id"],
        },
      ],
    }
  );

  Address.associate = function (models) {
    Address.belongsTo(models.City, { foreignKey: "city_id", as: "city" });
    Address.belongsTo(models.State, { foreignKey: "state_id", as: "state" });
    Address.hasMany(models.UserKyc, {
      foreignKey: "address_id",
      as: "UserKyc",
    });
    Address.hasMany(models.BusinessKyc, {
      foreignKey: "address_id",
      as: "businessKycs",
    });
  };

  return Address;
};
