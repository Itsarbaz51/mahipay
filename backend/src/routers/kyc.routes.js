// import { Router } from "express";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import PermissionMiddleware from "../middlewares/permission.middleware.js";
// import PermissionRegistry from "../utils/permissionRegistry.js";
// import { UserKycController } from "../controllers/kyc.controller.js";
// import { validateRequest } from "../middlewares/validateRequest.js";
// import KycValidationSchemas from "../validations/kycValidation.schemas.js";
// import upload from "../middlewares/multer.middleware.js";

// const kycRoutes = Router();

// // List KYC applications (Users with KYC view permissions)
// kycRoutes.post(
//   "/list-kyc",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.USER_KYC.USER_KYC_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.USER_KYC.USER_KYC_VIEW
//   ),
//   validateRequest(KycValidationSchemas.ListkycSchema),
//   UserKycController.index
// );

// // Get KYC by ID (Resource ownership check)
// kycRoutes.get(
//   "/user-kyc-show/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.USER_KYC.USER_KYC_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.USER_KYC.USER_KYC_VIEW
//   ),
//   PermissionMiddleware.requireResourceOwnership("kyc", "id"),
//   UserKycController.show
// );

// // Submit KYC (Users can submit their own KYC)
// kycRoutes.post(
//   "/user-kyc-store",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   upload.fields([
//     { name: "panFile", maxCount: 1 },
//     { name: "aadhaarFile", maxCount: 1 },
//     { name: "addressProofFile", maxCount: 1 },
//     { name: "photo", maxCount: 1 },
//   ]),
//   validateRequest(KycValidationSchemas.UserKyc),
//   UserKycController.store
// );

// // Verify KYC (ADMIN with KYC verify permissions)
// kycRoutes.put(
//   "/user-verify",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.USER_KYC.USER_KYC_VERIFY],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.USER_KYC.USER_KYC_VERIFY
//   ),
//   validateRequest(KycValidationSchemas.VerificationKycSchema),
//   UserKycController.verification
// );

// // Update KYC (Resource ownership check)
// kycRoutes.put(
//   "/user-kyc-update/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   PermissionMiddleware.requireResourceOwnership("kyc", "id"),
//   upload.fields([
//     { name: "panFile", maxCount: 1 },
//     { name: "aadhaarFile", maxCount: 1 },
//     { name: "addressProofFile", maxCount: 1 },
//     { name: "photo", maxCount: 1 },
//   ]),
//   UserKycController.update
// );

// export default kycRoutes;
