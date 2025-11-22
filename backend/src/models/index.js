import { DataTypes } from "sequelize";
import sequelize from "../db/db.js";
import dotenv from "dotenv";

dotenv.config();

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
  Root: Root(sequelize, DataTypes),
  Employee: Employee(sequelize, DataTypes),
  User: User(sequelize, DataTypes),

  RootWallet: RootWallet(sequelize, DataTypes),
  RootCommissionEarning: RootCommissionEarning(sequelize, DataTypes),
  RootBankDetail: RootBankDetail(sequelize, DataTypes),
  RootLedgerEntry: RootLedgerEntry(sequelize, DataTypes),

  Wallet: Wallet(sequelize, DataTypes),
  Transaction: Transaction(sequelize, DataTypes),
  CommissionEarning: CommissionEarning(sequelize, DataTypes),
  BankDetail: BankDetail(sequelize, DataTypes),
  LedgerEntry: LedgerEntry(sequelize, DataTypes),

  CommissionSetting: CommissionSetting(sequelize, DataTypes),
  Role: Role(sequelize, DataTypes),
  Department: Department(sequelize, DataTypes),
  ServiceProvider: ServiceProvider(sequelize, DataTypes),

  RolePermission: RolePermission(sequelize, DataTypes),
  UserPermission: UserPermission(sequelize, DataTypes),
  DepartmentPermission: DepartmentPermission(sequelize, DataTypes),
  EmployeePermission: EmployeePermission(sequelize, DataTypes),

  UserKyc: UserKyc(sequelize, DataTypes),
  BusinessKyc: BusinessKyc(sequelize, DataTypes),
  State: State(sequelize, DataTypes),
  City: City(sequelize, DataTypes),
  Address: Address(sequelize, DataTypes),

  ApiEntity: ApiEntity(sequelize, DataTypes),
  ApiWebhook: ApiWebhook(sequelize, DataTypes),

  IpWhitelist: IpWhitelist(sequelize, DataTypes),
  SystemSetting: SystemSetting(sequelize, DataTypes),
  PiiConsent: PiiConsent(sequelize, DataTypes),
  Refund: Refund(sequelize, DataTypes),
  IdempotencyKey: IdempotencyKey(sequelize, DataTypes),

  AuditLog: AuditLog(sequelize, DataTypes),
};

// Apply associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
export default models;
