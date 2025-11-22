import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Environment configuration
const config = {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "mysql",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  timezone: "+05:30", // IST
};

const sequelize = new Sequelize(config);

// Import all models
import Root from "./core/Root.js";
import Employee from "./core/Employee.js";
import User from "./core/User.js";

import RootWallet from "./business/RootWallet.js";
import RootCommissionEarning from "./business/RootCommissionEarning.js";
import RootBankDetail from "./business/RootBankDetail.js";
import RootLedgerEntry from "./business/RootLedgerEntry.js";
import Wallet from "./business/Wallet.js";
import Transaction from "./business/Transaction.js";
import CommissionEarning from "./business/CommissionEarning.js";
import BankDetail from "./business/BankDetail.js";
import LedgerEntry from "./business/LedgerEntry.js";

import CommissionSetting from "./shared/CommissionSetting.js";
import Role from "./shared/Role.js";
import Department from "./shared/Department.js";
import ServiceProvider from "./shared/ServiceProvider.js";

import RolePermission from "./permissions/RolePermission.js";
import UserPermission from "./permissions/UserPermission.js";
import DepartmentPermission from "./permissions/DepartmentPermission.js";
import EmployeePermission from "./permissions/EmployeePermission.js";

import UserKyc from "./kyc/UserKyc.js";
import BusinessKyc from "./kyc/BusinessKyc.js";
import State from "./kyc/State.js";
import City from "./kyc/City.js";
import Address from "./kyc/Address.js";

import ApiEntity from "./api/ApiEntity.js";
import ApiWebhook from "./api/ApiWebhook.js";

import IpWhitelist from "./security/IpWhitelist.js";
import SystemSetting from "./security/SystemSetting.js";
import PiiConsent from "./security/PiiConsent.js";
import Refund from "./security/Refund.js";
import IdempotencyKey from "./security/IdempotencyKey.js";

import AuditLog from "./audit/AuditLog.js";

// Initialize models
const models = {
  Root: Root(sequelize, Sequelize.DataTypes),
  Employee: Employee(sequelize, Sequelize.DataTypes),
  User: User(sequelize, Sequelize.DataTypes),

  RootWallet: RootWallet(sequelize, Sequelize.DataTypes),
  RootCommissionEarning: RootCommissionEarning(sequelize, Sequelize.DataTypes),
  RootBankDetail: RootBankDetail(sequelize, Sequelize.DataTypes),
  RootLedgerEntry: RootLedgerEntry(sequelize, Sequelize.DataTypes),

  Wallet: Wallet(sequelize, Sequelize.DataTypes),
  Transaction: Transaction(sequelize, Sequelize.DataTypes),
  CommissionEarning: CommissionEarning(sequelize, Sequelize.DataTypes),
  BankDetail: BankDetail(sequelize, Sequelize.DataTypes),
  LedgerEntry: LedgerEntry(sequelize, Sequelize.DataTypes),

  CommissionSetting: CommissionSetting(sequelize, Sequelize.DataTypes),
  Role: Role(sequelize, Sequelize.DataTypes),
  Department: Department(sequelize, Sequelize.DataTypes),
  ServiceProvider: ServiceProvider(sequelize, Sequelize.DataTypes),

  RolePermission: RolePermission(sequelize, Sequelize.DataTypes),
  UserPermission: UserPermission(sequelize, Sequelize.DataTypes),
  DepartmentPermission: DepartmentPermission(sequelize, Sequelize.DataTypes),
  EmployeePermission: EmployeePermission(sequelize, Sequelize.DataTypes),

  UserKyc: UserKyc(sequelize, Sequelize.DataTypes),
  BusinessKyc: BusinessKyc(sequelize, Sequelize.DataTypes),
  State: State(sequelize, Sequelize.DataTypes),
  City: City(sequelize, Sequelize.DataTypes),
  Address: Address(sequelize, Sequelize.DataTypes),

  ApiEntity: ApiEntity(sequelize, Sequelize.DataTypes),
  ApiWebhook: ApiWebhook(sequelize, Sequelize.DataTypes),

  IpWhitelist: IpWhitelist(sequelize, Sequelize.DataTypes),
  SystemSetting: SystemSetting(sequelize, Sequelize.DataTypes),
  PiiConsent: PiiConsent(sequelize, Sequelize.DataTypes),
  Refund: Refund(sequelize, Sequelize.DataTypes),
  IdempotencyKey: IdempotencyKey(sequelize, Sequelize.DataTypes),

  AuditLog: AuditLog(sequelize, Sequelize.DataTypes),
};

// Apply associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

export default models;
