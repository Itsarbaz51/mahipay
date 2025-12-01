export default (sequelize, DataTypes) => {
  const IpWhitelist = sequelize.define(
    "IpWhitelist",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      domainName: {
        type: DataTypes.STRING,
        field: "domain_name",
        unique: true,
        allowNull: false,
      },
      serverIp: {
        type: DataTypes.STRING,
        field: "server_ip",
        allowNull: false,
      },
      localIp: {
        type: DataTypes.STRING,
        field: "local_ip",
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
        allowNull: false,
      },
      userType: {
        type: DataTypes.ENUM("USER", "ROOT"),
        field: "user_type",
        allowNull: false,
      },
      createdById: {
        type: DataTypes.UUID,
        field: "created_by_id",
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
      tableName: "ip_whitelists",
      timestamps: true,
      underscored: true,
    }
  );

  IpWhitelist.associate = function (models) {
    // Polymorphic association for User (when userType = "USER")
    IpWhitelist.belongsTo(models.User, {
      foreignKey: "user_id",
      constraints: false,
      as: "user",
    });

    // Polymorphic association for Root (when userType = "ROOT")
    IpWhitelist.belongsTo(models.Root, {
      foreignKey: "user_id",
      constraints: false,
      as: "root",
    });

    // Creator association - always points to Root
    IpWhitelist.belongsTo(models.Root, {
      foreignKey: "created_by_id",
      as: "createdBy",
    });
  };

  return IpWhitelist;
};
