import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  BankController,
  AddBankController,
} from "../controllers/bank.controller.js";
import BankValidationSchemas from "../validations/bankValidation.schemas.js";

const bankRoutes = Router();

// ===================== ADMIN BANK ROUTES =====================

// List all banks
bankRoutes.get(
  "/list",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN", "SUPER ADMIN"]),
  BankController.index
);

// Show single bank
bankRoutes.get(
  "/show/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN", "SUPER ADMIN"]),
  BankController.show
);

// Create bank
bankRoutes.post(
  "/store",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN", "SUPER ADMIN"]),
  upload.single("bankIcon"),
  validateRequest(BankValidationSchemas.BankSchema),
  BankController.store
);

// Update bank
bankRoutes.put(
  "/update/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN", "SUPER ADMIN"]),
  upload.single("bankIcon"),
  validateRequest(BankValidationSchemas.BankUpdateSchema),
  BankController.update
);

// Delete bank
bankRoutes.delete(
  "/delete/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN", "SUPER ADMIN"]),
  BankController.destroy
);

// ===================== USER BANK ROUTES =====================

// List user’s added banks
bankRoutes.post(
  "/bank-list",
  AuthMiddleware.isAuthenticated,
  AddBankController.index
);

// Show user’s specific bank
bankRoutes.get(
  "/bank-show/:id",
  AuthMiddleware.isAuthenticated,
  AddBankController.show
);

// Add new bank detail
bankRoutes.post(
  "/store-bank",
  AuthMiddleware.isAuthenticated,
  upload.single("bankProofFile"),
  validateRequest(BankValidationSchemas.BankDetailSchema),
  AddBankController.store
);

// Update user bank detail
bankRoutes.put(
  "/bank-update/:id",
  AuthMiddleware.isAuthenticated,
  upload.single("bankProofFile"),
  validateRequest(BankValidationSchemas.BankDetailUpdateSchema),
  AddBankController.update
);

// Delete user bank
bankRoutes.delete(
  "/bank-delete/:id",
  AuthMiddleware.isAuthenticated,
  AddBankController.destroy
);

export default bankRoutes;
