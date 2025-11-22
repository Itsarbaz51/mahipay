export default (sequelize, DataTypes) => {
  const BankDetail = sequelize.define(
    "BankDetail",
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
      userId: {
        type: DataTypes.UUID,
        field: "user_id",
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
      deletedAt: {
        type: DataTypes.DATE,
        field: "deleted_at",
        allowNull: true,
      },
    },
    {
      tableName: "bank_details",
      timestamps: true,
      underscored: true,
      paranoid: true,
      indexes: [
        {
          fields: ["user_id"],
        },
      ],
    }
  );

  BankDetail.associate = function (models) {
    BankDetail.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
  };

  return BankDetail;
};
