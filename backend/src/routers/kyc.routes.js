// routes/kyc.routes.js
import { Router } from "express";
import { KycController } from "../controllers/kyc.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  getAllKycSchema,
  getKycByIdSchema,
  createKycSchema,
  updateKycSchema,
  verifyKycSchema,
  kycFilesSchema,
} from "../validations/kycValidation.schemas.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import PermissionMiddleware from "../middlewares/permission.middleware.js";
import PermissionRegistry from "../utils/permissionRegistry.js";
import { upload } from "../middlewares/multer.middleware.js";

const kycRoutes = Router();

// Apply authentication to all KYC routes
kycRoutes.use(AuthMiddleware.authenticate);

// Get all KYC applications
kycRoutes.get(
  "/",
  validateRequest(getAllKycSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.KYC_MGMT[0]], // "kyc:view"
    userTypes: ["root", "admin", "employee"],
  }),
  KycController.getAllKyc
);

// Get KYC by ID
kycRoutes.get(
  "/:id",
  validateRequest(getKycByIdSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.KYC_MGMT[0]], // "kyc:view"
    userTypes: ["root", "admin", "employee"],
  }),
  KycController.getKycById
);

// Create KYC
kycRoutes.post(
  "/",
  upload.fields([
    { name: "panFile", maxCount: 1 },
    { name: "aadhaarFile", maxCount: 1 },
    { name: "addressProofFile", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  validateRequest(createKycSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.KYC_MGMT[1]], // "kyc:create"
    userTypes: ["root", "admin", "employee"],
  }),
  PermissionMiddleware.canActOnBehalf("kyc:create"),
  KycController.createKyc
);

// Update KYC
kycRoutes.put(
  "/:id",
  upload.fields([
    { name: "panFile", maxCount: 1 },
    { name: "aadhaarFile", maxCount: 1 },
    { name: "addressProofFile", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  validateRequest(updateKycSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.KYC_MGMT[2]], // "kyc:update"
    userTypes: ["root", "admin", "employee"],
  }),
  PermissionMiddleware.canActOnBehalf("kyc:update"),
  KycController.updateKyc
);

// Verify KYC (Only for Root and Admin roles)
kycRoutes.post(
  "/verify",
  validateRequest(verifyKycSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.KYC_MGMT[3]], // "kyc:verify"
    userTypes: ["root", "admin"],
  }),
  // For employees, they can only verify through their admin's hierarchy
  PermissionMiddleware.canActOnBehalf("kyc:verify"),
  KycController.verifyKyc
);

export default kycRoutes;
