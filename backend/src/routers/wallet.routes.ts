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
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  idempotencyMiddleware({ required: true }),
  validateRequest(WallletValidationSchemas.walletCreditSchema),
  WalletController.creditWallet
);

// Debit wallet with idempotency
walletRoutes.post(
  "/debit",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  idempotencyMiddleware({ required: true }),
  validateRequest(WallletValidationSchemas.walletDebitSchema),
  WalletController.debitWallet
);

// Get wallet by user ID
walletRoutes.get(
  "/user/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN", "ADMIN", "USER"]),
  WalletController.getWallet
);

// Get wallet balance
walletRoutes.get(
  "/balance/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN", "ADMIN", "USER"]),
  WalletController.getWalletBalance
);

// Get wallet transactions
walletRoutes.get(
  "/transactions/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN", "ADMIN", "USER"]),
  WalletController.getWalletTransactions
);

export default walletRoutes;
