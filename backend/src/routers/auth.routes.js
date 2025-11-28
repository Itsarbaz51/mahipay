import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import AuthValidationSchemas from "../validations/authValidation.schemas.js";
import PermissionRegistry from "../utils/permissionRegistry.js";
import PermissionMiddleware from "../middlewares/permission.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const authRoutes = Router();

// Public routes
// ✅
authRoutes.post(
  "/login",
  validateRequest(AuthValidationSchemas.login),
  AuthController.login
); // ✅
authRoutes.post(
  "/password-reset",
  validateRequest(AuthValidationSchemas.forgotPassword),
  AuthController.requestPasswordReset
);
authRoutes.post(
  "/password-reset/confirm",
  validateRequest(AuthValidationSchemas.confirmPasswordReset),
  AuthController.confirmPasswordReset
); // ✅

// Protected routes
authRoutes.post("/logout", AuthMiddleware.authenticate, AuthController.logout); // ✅
authRoutes.post(
  "/refresh-token",
  AuthMiddleware.authenticate,
  AuthController.refreshToken
);
authRoutes.get(
  "/me",
  AuthMiddleware.authenticate,
  AuthController.getCurrentUser
); // ✅

//Everyone credentials UPDATE METHODS
authRoutes.put(
  "/:userId/credentials",
  AuthMiddleware.authenticate,
  validateRequest(AuthValidationSchemas.updateCredentials),
  AuthMiddleware.requireUser,
  PermissionMiddleware.requirePermission(
    PermissionRegistry.PERMISSIONS.USER_MANAGEMENT[5]
  ),
  AuthController.updateCredentials
); // ✅

authRoutes.get(
  "/dashboard",
  AuthMiddleware.authenticate,
  AuthController.getDashboard
); // ✅

//own profile update
authRoutes.put(
  "/profile",
  AuthMiddleware.authenticate,
  validateRequest(AuthValidationSchemas.updateProfile),
  AuthController.updateProfile
); // ✅

//own profile image update
authRoutes.put(
  "/profile-image",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireUser,
  PermissionMiddleware.requirePermission(
    PermissionRegistry.PERMISSIONS.USER_MANAGEMENT[6]
  ),
  upload.single("profileImage"),
  AuthController.updateProfileImage
);

export default authRoutes;
