// import { Router } from "express";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import PermissionMiddleware from "../middlewares/permission.middleware.js";
// import PermissionRegistry from "../utils/permissionRegistry.js";
// import { validateRequest } from "../middlewares/validateRequest.js";
// import { WalletController } from "../controllers/wallet.controller.js";
// import WallletValidationSchemas from "../validations/walletValidation.schemas.js";
// import idempotencyMiddleware from "../middlewares/idempotency.middleware.js";

// const walletRoutes = Router();

// // Credit wallet with idempotency (ADMIN with permissions)
// walletRoutes.post(
//   "/credit",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.WALLET_MANAGEMENT.WALLET_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.WALLET_MANAGEMENT.WALLET_MANAGE
//   ),
//   idempotencyMiddleware({ required: true }),
//   validateRequest(WallletValidationSchemas.walletCreditSchema),
//   WalletController.creditWallet
// );

// // Debit wallet with idempotency (ADMIN with permissions)
// walletRoutes.post(
//   "/debit",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.WALLET_MANAGEMENT.WALLET_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.WALLET_MANAGEMENT.WALLET_MANAGE
//   ),
//   idempotencyMiddleware({ required: true }),
//   validateRequest(WallletValidationSchemas.walletDebitSchema),
//   WalletController.debitWallet
// );

// // Hold amount
// walletRoutes.post(
//   "/hold",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.WALLET_MANAGEMENT.WALLET_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.WALLET_MANAGEMENT.WALLET_MANAGE
//   ),
//   idempotencyMiddleware({ required: true }),
//   validateRequest(WallletValidationSchemas.holdAmountSchema),
//   WalletController.holdAmount
// );

// // Release hold amount
// walletRoutes.post(
//   "/release-hold",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.WALLET_MANAGEMENT.WALLET_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.WALLET_MANAGEMENT.WALLET_MANAGE
//   ),
//   idempotencyMiddleware({ required: true }),
//   validateRequest(WallletValidationSchemas.releaseHoldAmountSchema),
//   WalletController.releaseHoldAmount
// );

// // Get wallet by user ID
// walletRoutes.get(
//   "/user/:userId",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.WALLET_MANAGEMENT.WALLET_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.WALLET_MANAGEMENT.WALLET_VIEW
//   ),
//   PermissionMiddleware.requireResourceOwnership("wallet", "userId"),
//   validateRequest(WallletValidationSchemas.getWalletSchema),
//   WalletController.getWallet
// );

// // Get all user wallets
// walletRoutes.get(
//   "/user/:userId/all",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.WALLET_MANAGEMENT.WALLET_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.WALLET_MANAGEMENT.WALLET_VIEW
//   ),
//   PermissionMiddleware.requireResourceOwnership("wallet", "userId"),
//   WalletController.getUserWallets
// );

// // Get wallet balance
// walletRoutes.get(
//   "/balance/:userId",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.WALLET_MANAGEMENT.WALLET_BALANCE_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.WALLET_MANAGEMENT.WALLET_BALANCE_VIEW
//   ),
//   PermissionMiddleware.requireResourceOwnership("wallet", "userId"),
//   validateRequest(WallletValidationSchemas.getWalletBalanceSchema),
//   WalletController.getWalletBalance
// );

// // Get wallet transactions
// walletRoutes.get(
//   "/transactions/:userId",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.WALLET_MANAGEMENT.WALLET_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.WALLET_MANAGEMENT.WALLET_VIEW
//   ),
//   PermissionMiddleware.requireResourceOwnership("wallet", "userId"),
//   validateRequest(WallletValidationSchemas.walletTransactionsSchema),
//   WalletController.getWalletTransactions
// );

// export default walletRoutes;
