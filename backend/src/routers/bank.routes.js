import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { AddBankController } from "../controllers/bank.controller.js";
import BankValidationSchemas from "../validations/bankValidation.schemas.js";

const bankRoutes = Router();

// ===================== BANK ROUTES =====================

bankRoutes.post(
  "/bank-list",
  AuthMiddleware.isAuthenticated,
  AddBankController.index
);
bankRoutes.get(
  "/get-all-my",
  AuthMiddleware.isAuthenticated,
  AddBankController.getAllMyBanks
);

// Show s specific bank
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

// Update bank detail
bankRoutes.put(
  "/bank-update/:id",
  AuthMiddleware.isAuthenticated,
  upload.single("bankProofFile"),
  validateRequest(BankValidationSchemas.BankDetailUpdateSchema),
  AddBankController.update
);

// Delete bank
bankRoutes.delete(
  "/bank-delete/:id",
  AuthMiddleware.isAuthenticated,
  AddBankController.destroy
);

// ================= BANK Admin manage =================
bankRoutes.put(
  "/bank-verify",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(BankValidationSchemas.VerificationBankSchema),
  AddBankController.verify
);

export default bankRoutes;
