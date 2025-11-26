// import { Router } from "express";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import PermissionMiddleware from "../middlewares/permission.middleware.js";
// import PermissionRegistry from "../utils/permissionRegistry.js";
// import { validateRequest } from "../middlewares/validateRequest.js";
// import { TransactionValidationSchemas } from "../validations/transactionValidation.schemas.js";
// import { TransactionController } from "../controllers/transaction.controller.js";
// import idempotencyMiddleware from "../middlewares/idempotency.middleware.js";

// const transactionRoutes = Router();

// // Create transaction with idempotency
// transactionRoutes.post(
//   "/",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.TRANSACTION_MANAGEMENT.TRANSACTION_CREATE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.TRANSACTION_MANAGEMENT.TRANSACTION_CREATE
//   ),
//   idempotencyMiddleware({ required: true }),
//   validateRequest(TransactionValidationSchemas.createTransactionSchema),
//   TransactionController.createTransaction
// );

// // Refund transaction (ADMIN with permissions)
// transactionRoutes.post(
//   "/refund",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.REFUND_MANAGEMENT.REFUND_PROCESS],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.REFUND_MANAGEMENT.REFUND_PROCESS
//   ),
//   validateRequest(TransactionValidationSchemas.refundTransactionSchema),
//   TransactionController.refundTransaction
// );

// // Get transactions
// transactionRoutes.get(
//   "/",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.TRANSACTION_MANAGEMENT.TRANSACTION_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.TRANSACTION_MANAGEMENT.TRANSACTION_VIEW
//   ),
//   TransactionController.getTransactions
// );

// // Get transaction by ID
// transactionRoutes.get(
//   "/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.TRANSACTION_MANAGEMENT.TRANSACTION_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.TRANSACTION_MANAGEMENT.TRANSACTION_VIEW
//   ),
//   PermissionMiddleware.requireResourceOwnership("transaction", "id"),
//   TransactionController.getTransactionById
// );

// // Update transaction status (ADMIN with permissions)
// transactionRoutes.patch(
//   "/status",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [
//       PermissionRegistry.TRANSACTION_MANAGEMENT.TRANSACTION_PROCESS,
//     ],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.TRANSACTION_MANAGEMENT.TRANSACTION_PROCESS
//   ),
//   validateRequest(TransactionValidationSchemas.updateTransactionStatusSchema),
//   TransactionController.updateTransactionStatus
// );

// export default transactionRoutes;
