import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import AuthValidationSchemas from "../validations/authValidation.schemas.js";

const authRoutes = Router();

authRoutes.post(
  "/login",
  validateRequest(AuthValidationSchemas.login),
  AuthController.login
);

authRoutes.post(
  "/logout",
  AuthMiddleware.isAuthenticated,
  AuthController.logout
);

authRoutes.post(
  "/refresh",
  AuthMiddleware.isAuthenticated,
  AuthController.refreshToken
);
authRoutes.post(
  "/forgot-password",
  validateRequest(AuthValidationSchemas.forgotPassword),
  AuthController.forgotPassword
);

authRoutes.post(
  "/reset-password",
  AuthMiddleware.isAuthenticated,
  validateRequest(AuthValidationSchemas.resetPassword),

  AuthController.resetPassword
);
authRoutes.get("/verify-email", AuthController.verifyEmail);

authRoutes.put(
  "/:userId/credentials",
  AuthMiddleware.isAuthenticated,
  validateRequest(AuthValidationSchemas.updateCredentials),
  AuthController.updateCredentials
);

export default authRoutes;
