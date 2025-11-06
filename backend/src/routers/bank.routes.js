import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { AddBankController } from "../controllers/bank.controller.js";
import BankValidationSchemas from "../validations/bankValidation.schemas.js";

const bankRoutes = Router();

// ===================== BANK ROUTES =====================

// List banks (Business users only)
bankRoutes.post(
  "/bank-list",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  AddBankController.index
);

// Get all my banks (Business users only)
bankRoutes.get(
  "/get-all-my",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  AddBankController.getAllMyBanks
);

// Show specific bank (Business users only)
bankRoutes.get(
  "/bank-show/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  AddBankController.show
);

// Add new bank detail (Business users only)
bankRoutes.post(
  "/store-bank",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  upload.single("bankProofFile"),
  validateRequest(BankValidationSchemas.BankDetailSchema),
  AddBankController.store
);

// Update bank detail (Business users only)
bankRoutes.put(
  "/bank-update/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  upload.single("bankProofFile"),
  validateRequest(BankValidationSchemas.BankDetailUpdateSchema),
  AddBankController.update
);

// Delete bank (Business users only)
bankRoutes.delete(
  "/bank-delete/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  AddBankController.destroy
);

// ================= BANK Admin manage =================
// Verify bank (ADMIN only)
bankRoutes.put(
  "/bank-verify",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  validateRequest(BankValidationSchemas.VerificationBankSchema),
  AddBankController.verify
);

export default bankRoutes;
