import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import SystemSettingController from "../controllers/systemSetting.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import upload from "../middlewares/multer.middleware.js";
import SystemSettingValidationSchemas from "../validations/systemSettingValidation.schemas.js";

const systemSettingRoutes = Router();

// Create system setting (logo + favicon upload)
systemSettingRoutes.post(
  "/store",
  AuthMiddleware.isAuthenticated,
  upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "favIcon", maxCount: 1 },
  ]),
  validateRequest(SystemSettingValidationSchemas.createSchema),
  SystemSettingController.create
);

// Update system setting (logo + favicon optional)
systemSettingRoutes.put(
  "/update/:id",
  AuthMiddleware.isAuthenticated,
  upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "favIcon", maxCount: 1 },
  ]),
  validateRequest(SystemSettingValidationSchemas.updateSchema),
  SystemSettingController.update
);

// Get system setting by ID
systemSettingRoutes.get(
  "/show/:id",
  AuthMiddleware.isAuthenticated,
  SystemSettingController.show
);

// List all system settings with pagination
systemSettingRoutes.get(
  "/list",
  AuthMiddleware.isAuthenticated,
  SystemSettingController.index
);

// Delete system setting
systemSettingRoutes.delete(
  "/delete/:id",
  AuthMiddleware.isAuthenticated,
  SystemSettingController.delete
);

export default systemSettingRoutes;
