export default (sequelize, DataTypes) => {
  const RootBankDetail = sequelize.define(
    "RootBankDetail",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      accountHolder: {
        type: DataTypes.TEXT,
        field: "account_holder",
        allowNull: false,
      },
      accountNumber: {
        type: DataTypes.STRING(18),
        field: "account_number",
        unique: true,
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        field: "phone_number",
        allowNull: false,
      },
      accountType: {
        type: DataTypes.ENUM("PERSONAL", "BUSINESS"),
        field: "account_type",
        allowNull: false,
      },
      ifscCode: {
        type: DataTypes.TEXT,
        field: "ifsc_code",
        allowNull: false,
      },
      bankName: {
        type: DataTypes.TEXT,
        field: "bank_name",
        allowNull: false,
      },
      bankRejectionReason: {
        type: DataTypes.TEXT,
        field: "bank_rejection_reason",
        allowNull: true,
      },
      bankProofFile: {
        type: DataTypes.STRING,
        field: "bank_proof_file",
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "VERIFIED", "REJECTED"),
        defaultValue: "PENDING",
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        field: "is_primary",
        defaultValue: false,
      },
      rootId: {
        type: DataTypes.UUID,
        field: "root_id",
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
      tableName: "root_bank_details",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["root_id"],
        },
      ],
    }
  );

  RootBankDetail.associate = function (models) {
    RootBankDetail.belongsTo(models.Root, {
      foreignKey: "root_id",
      as: "root",
    });
  };

  return RootBankDetail;
};
