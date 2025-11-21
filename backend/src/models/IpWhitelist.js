import { DataTypes } from "sequelize";

export default (sequelize) => {
  const IpWhitelist = sequelize.define('IpWhitelist', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    domain_name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    server_ip: {
      type: DataTypes.STRING,
      allowNull: false
    },
    local_ip: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    root_id: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'ip_whitelists',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  IpWhitelist.associate = (models) => {
    IpWhitelist.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    IpWhitelist.belongsTo(models.Root, { foreignKey: 'root_id', as: 'root' });
  };

  return IpWhitelist;
};