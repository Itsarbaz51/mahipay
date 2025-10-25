import addressRoutes from "./address.routes.js";
// import auditLogRoutes from "./auditLog.routes.js";
import authRoutes from "./auth.routes.js";
import bankRoutes from "./bank.routes.js";
import commissionRoutes from "./commission.routes.js";
// import idempotencyKeyRoutes from "./idempotencyKey.routes.js";
import kycRoutes from "./kyc.routes.js";
// import ledgerRoutes from "./ledger.routes.js";
import loginLogRoutes from "./loginLog.routes.js";
import permissionRoutes from "./permission.routes.js";
// import piiConsentRoutes from "./piiConsent.routes.js";
import roleRoutes from "./role.routes.js";
import serviceRoutes from "./service.routes.js";
import systemSettingRoutes from "./systemSetting.routes.js";
import transactionRoutes from "./transaction.routes.js";
import userRoutes from "./user.routes.js";
// import walletRoutes from "./wallet.routes.js";
import walletRoutes from "./wallet.routes.js";

export function StaticRoutes(app: any) {
  app.use("/api/v1/addresses", addressRoutes);
  // app.use("api/v1/audit-logs", auditLogRoutes);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/banks", bankRoutes);
  app.use("/api/v1/commissions", commissionRoutes);
  // app.use("api/v1/idempotency-key", idempotencyKeyRoutes);
  app.use("/api/v1/kycs", kycRoutes);
  // app.use("api/v1/ledgers", ledgerRoutes);
  app.use("/api/v1/login-logs", loginLogRoutes);
  app.use("/api/v1/permissions", permissionRoutes);
  // app.use("api/v1/pii-consent", piiConsentRoutes);
  app.use("/api/v1/roles", roleRoutes);
  app.use("/api/v1/services", serviceRoutes);
  app.use("/api/v1/system-setting", systemSettingRoutes);
  app.use("/api/v1/transactions", transactionRoutes);
  app.use("/api/v1/users", userRoutes);
  // app.use("api/v1/wallets", walletRoutes);
  app.use("/api/v1/wallets", walletRoutes);
}
