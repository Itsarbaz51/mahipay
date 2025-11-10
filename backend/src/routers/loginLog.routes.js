import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import LoginLogController from "../controllers/loginLog.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import LoginLogsValidationSchemas from "../validations/loginLogValidation.schemas.js";

const loginLogRoutes = Router();

// Get login logs (ADMIN only)
loginLogRoutes.post(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  validateRequest(LoginLogsValidationSchemas.ListLoginLogsSchema),
  LoginLogController.index
);

// Get login log by ID (ADMIN only)
loginLogRoutes.get(
  "/login-logs/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  validateRequest(LoginLogsValidationSchemas.GetLoginLogByIdSchema),
  LoginLogController.show
);

// Create login log (ADMIN only)
loginLogRoutes.post(
  "/login-logs",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  validateRequest(LoginLogsValidationSchemas.CreateLoginLogSchema),
  LoginLogController.store
);

// Delete login log (ADMIN only)
loginLogRoutes.delete(
  "/login-logs/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  validateRequest(LoginLogsValidationSchemas.DeleteLoginLogSchema),
  LoginLogController.destroy
);

export default loginLogRoutes;
