// import { Router } from "express";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import PermissionMiddleware from "../middlewares/permission.middleware.js";
// import PermissionRegistry from "../utils/permissionRegistry.js";
// import upload from "../middlewares/multer.middleware.js";
// import { validateRequest } from "../middlewares/validateRequest.js";
// import { AddBankController } from "../controllers/bank.controller.js";
// import BankValidationSchemas from "../validations/bankValidation.schemas.js";

// const bankRoutes = Router();

// // ===================== BANK ROUTES =====================

// // List banks (Business users only)
// bankRoutes.post(
//   "/bank-list",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   AddBankController.index
// );

// // Get all my banks (Users can see their own banks)
// bankRoutes.get(
//   "/get-all-my",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   AddBankController.getAllMyBanks
// );

// // Show specific bank (Resource ownership check)
// bankRoutes.get(
//   "/bank-show/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   PermissionMiddleware.requireResourceOwnership("bank", "id"),
//   AddBankController.show
// );

// // Add new bank detail (Users can add their own banks)
// bankRoutes.post(
//   "/store-bank",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   upload.single("bankProofFile"),
//   validateRequest(BankValidationSchemas.BankDetailSchema),
//   AddBankController.store
// );

// // Update bank detail (Resource ownership check)
// bankRoutes.put(
//   "/bank-update/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   PermissionMiddleware.requireResourceOwnership("bank", "id"),
//   upload.single("bankProofFile"),
//   validateRequest(BankValidationSchemas.BankDetailUpdateSchema),
//   AddBankController.update
// );

// // Delete bank (Resource ownership check)
// bankRoutes.delete(
//   "/bank-delete/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   PermissionMiddleware.requireResourceOwnership("bank", "id"),
//   AddBankController.destroy
// );

// // ================= BANK Admin manage =================
// // Verify bank (ADMIN with permissions only)
// bankRoutes.put(
//   "/bank-verify",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.BANK_DETAILS.BANK_DETAIL_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.BANK_DETAILS.BANK_DETAIL_MANAGE
//   ),
//   validateRequest(BankValidationSchemas.VerificationBankSchema),
//   AddBankController.verify
// );

// export default bankRoutes;
