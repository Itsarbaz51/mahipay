import { Router } from "express";
import { BusinessKycController } from "../controllers/businessKyc.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  getAllBusinessKycSchema,
  getBusinessKycByIdSchema,
  createBusinessKycSchema,
  updateBusinessKycSchema,
  verifyBusinessKycSchema,
  businessKycFilesSchema,
} from "../validations/businessKycValidation.schemas.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import PermissionMiddleware from "../middlewares/permission.middleware.js";
import PermissionRegistry from "../utils/permissionRegistry.js";
import { upload } from "../middlewares/multer.middleware.js";

const businessKycRoutes = Router();

// Apply authentication to all business KYC routes
businessKycRoutes.use(AuthMiddleware.authenticate);

// Get all Business KYC applications
businessKycRoutes.get(
  "/",
  validateRequest(getAllBusinessKycSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.KYC_MGMT[4]], // "business_kyc:view"
    userTypes: ["root", "employee"],
  }),
  BusinessKycController.getAllBusinessKyc
);

// Get Business KYC by ID
businessKycRoutes.get(
  "/:id",
  validateRequest(getBusinessKycByIdSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.KYC_MGMT[4]], // "business_kyc:view"
    userTypes: ["root", "employee"],
  }),
  BusinessKycController.getBusinessKycById
);

// Create Business KYC (Only Admin)
businessKycRoutes.post(
  "/",
  upload.fields([
    { name: "panFile", maxCount: 1 },
    { name: "gstFile", maxCount: 1 },
    { name: "udhyamAadhar", maxCount: 1 },
    { name: "brDoc", maxCount: 1 },
    { name: "partnershipDeed", maxCount: 1 },
    { name: "moaFile", maxCount: 1 },
    { name: "aoaFile", maxCount: 1 },
    { name: "directorShareholding", maxCount: 1 },
  ]),
  validateRequest(createBusinessKycSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.KYC_MGMT[5]], // "business_kyc:create"
    userTypes: ["admin"],
  }),
  PermissionMiddleware.canActOnBehalf("business_kyc:create"),
  BusinessKycController.createBusinessKyc
);

// Update Business KYC (Only Admin)
businessKycRoutes.put(
  "/:id",
  upload.fields([
    { name: "panFile", maxCount: 1 },
    { name: "gstFile", maxCount: 1 },
    { name: "udhyamAadhar", maxCount: 1 },
    { name: "brDoc", maxCount: 1 },
    { name: "partnershipDeed", maxCount: 1 },
    { name: "moaFile", maxCount: 1 },
    { name: "aoaFile", maxCount: 1 },
    { name: "directorShareholding", maxCount: 1 },
  ]),
  validateRequest(updateBusinessKycSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.KYC_MGMT[6]], // "business_kyc:update"
    userTypes: ["admin"],
  }),
  PermissionMiddleware.canActOnBehalf("business_kyc:update"),
  BusinessKycController.updateBusinessKyc
);

// Verify Business KYC (Only Root)
businessKycRoutes.post(
  "/verify",
  validateRequest(verifyBusinessKycSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.KYC_MGMT[7]], // "business_kyc:verify"
    userTypes: ["root", "employee"],
  }),
  BusinessKycController.verifyBusinessKyc
);

export default businessKycRoutes;
