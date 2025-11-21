import { DataTypes } from "sequelize";

export default (sequelize) => {
  const RootBankDetail = sequelize.define(
    "RootBankDetail",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      account_holder: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      account_number: {
        type: DataTypes.STRING(18),
        unique: true,
        allowNull: false,
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      account_type: {
        type: DataTypes.ENUM("PERSONAL", "BUSINESS"),
        allowNull: false,
      },
      ifsc_code: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      bank_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      bank_rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      bank_proof_file: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "VERIFIED", "REJECTED"),
        defaultValue: "PENDING",
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      root_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: "root_bank_details",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ fields: ["root_id"] }],
    }
  );

  RootBankDetail.associate = (models) => {
    RootBankDetail.belongsTo(models.Root, {
      foreignKey: "root_id",
      as: "root",
    });
  };

  return RootBankDetail;
};
