import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { TransactionValidationSchemas } from "../validations/transactionValidation.schemas.js";
import { TransactionController } from "../controllers/transaction.controller.js";
import idempotencyMiddleware from "../middlewares/idempotency.middleware.js";

const transactionRoutes = Router();

// Create transaction with idempotency
transactionRoutes.post(
  "/",
  AuthMiddleware.isAuthenticated,
  idempotencyMiddleware({ required: true }),
  validateRequest(TransactionValidationSchemas.createTransactionSchema),
  TransactionController.createTransaction
);

// Refund transaction
transactionRoutes.post(
  "/refund",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN", "ADMIN"]),
  validateRequest(TransactionValidationSchemas.refundTransactionSchema),
  TransactionController.refundTransaction
);

// Get transactions (with query params)
transactionRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  TransactionController.getTransactions
);

// Get transaction by ID
transactionRoutes.get(
  "/:id",
  AuthMiddleware.isAuthenticated,
  TransactionController.getTransactionById
);

// Update transaction status
transactionRoutes.patch(
  "/status",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN", "ADMIN"]),
  validateRequest(TransactionValidationSchemas.updateTransactionStatusSchema),
  TransactionController.updateTransactionStatus
);

export default transactionRoutes;
