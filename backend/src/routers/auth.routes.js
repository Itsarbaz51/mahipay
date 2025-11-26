import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import AuthValidationSchemas from "../validations/authValidation.schemas.js";
import PermissionRegistry from "../utils/permissionRegistry.js";
import PermissionMiddleware from "../middlewares/permission.middleware.js";

const authRoutes = Router();

// Public routes
authRoutes.post(
  "/login",
  validateRequest(AuthValidationSchemas.login),
  AuthController.login
);
authRoutes.post(
  "/password-reset",
  validateRequest(AuthValidationSchemas.forgotPassword),
  AuthController.requestPasswordReset
);
authRoutes.post("/password-reset/confirm", AuthController.confirmPasswordReset);
authRoutes.get("/verify-email", AuthController.verifyEmail);

// Protected routes
authRoutes.post("/logout", AuthMiddleware.authenticate, AuthController.logout);
authRoutes.post(
  "/refresh-token",
  AuthMiddleware.authenticate,
  AuthController.refreshToken
);
authRoutes.get(
  "/me",
  AuthMiddleware.authenticate,
  AuthController.getCurrentUser
);
authRoutes.put(
  "/:userId/credentials",
  AuthMiddleware.authenticate,
  validateRequest(AuthValidationSchemas.updateCredentials),
  AuthMiddleware.requireUser,
  PermissionMiddleware.requirePermission(
    PermissionRegistry.PERMISSIONS.USER_MANAGEMENT[5]
  ),
  AuthController.updateCredentials
);

authRoutes.get(
  "/dashboard",
  AuthMiddleware.authenticate,
  AuthController.getDashboard
);
authRoutes.put(
  "/profile",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireUser,
  PermissionMiddleware.requirePermission(
    PermissionRegistry.PERMISSIONS.USER_MANAGEMENT[2]
  ),
  AuthController.updateProfile
);
authRoutes.post(
  "/send-verification",
  AuthMiddleware.authenticate,
  AuthController.sendEmailVerification
);

export default authRoutes;
