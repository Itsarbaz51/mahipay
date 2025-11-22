export default  (sequelize, DataTypes) => {
  const IpWhitelist = sequelize.define('IpWhitelist', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    domainName: {
      type: DataTypes.STRING,
      field: 'domain_name',
      unique: true,
      allowNull: false
    },
    serverIp: {
      type: DataTypes.STRING,
      field: 'server_ip',
      allowNull: false
    },
    localIp: {
      type: DataTypes.STRING,
      field: 'local_ip',
      unique: true,
      allowNull: true
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
      allowNull: false
    },
    rootId: {
      type: DataTypes.UUID,
      field: 'root_id',
      allowNull: true
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
    tableName: 'ip_whitelists',
    timestamps: true,
    underscored: true
  });

  IpWhitelist.associate = function(models) {
    IpWhitelist.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    IpWhitelist.belongsTo(models.Root, { foreignKey: 'root_id', as: 'root' });
  };

  return IpWhitelist;
};