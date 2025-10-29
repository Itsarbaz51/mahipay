import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { WalletController } from "../controllers/wallet.controller.js";
import WallletValidationSchemas from "../validations/walletValidation.schemas.js";
import idempotencyMiddleware from "../middlewares/idempotency.middleware.js";

const walletRoutes = Router();

// Credit wallet with idempotency
walletRoutes.post(
  "/credit",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  idempotencyMiddleware({ required: true }),
  validateRequest(WallletValidationSchemas.walletCreditSchema),
  WalletController.creditWallet
);

// Debit wallet with idempotency
walletRoutes.post(
  "/debit",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  idempotencyMiddleware({ required: true }),
  validateRequest(WallletValidationSchemas.walletDebitSchema),
  WalletController.debitWallet
);

// Hold amount
walletRoutes.post(
  "/hold",
  AuthMiddleware.isAuthenticated,
  idempotencyMiddleware({ required: true }),
  validateRequest(WallletValidationSchemas.holdAmountSchema),
  WalletController.holdAmount
);

// Release hold amount
walletRoutes.post(
  "/release-hold",
  AuthMiddleware.isAuthenticated,
  idempotencyMiddleware({ required: true }),
  validateRequest(WallletValidationSchemas.releaseHoldAmountSchema),
  WalletController.releaseHoldAmount
);

// Get wallet by user ID
walletRoutes.get(
  "/user/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAIlER",
  ]),
  validateRequest(WallletValidationSchemas.getWalletSchema),
  WalletController.getWallet
);

// Get all user wallets
walletRoutes.get(
  "/user/:userId/all",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAIlER",
  ]),
  WalletController.getUserWallets
);

// Get wallet balance
walletRoutes.get(
  "/balance/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAIlER",
  ]),
  validateRequest(WallletValidationSchemas.getWalletBalanceSchema),
  WalletController.getWalletBalance
);

// Get wallet transactions
walletRoutes.get(
  "/transactions/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAIlER",
  ]),
  validateRequest(WallletValidationSchemas.walletTransactionsSchema),
  WalletController.getWalletTransactions
);

export default walletRoutes;
