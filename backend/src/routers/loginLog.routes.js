import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import LoginLogController from "../controllers/loginLog.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import LoginLogsValidationSchemas from "../validations/loginLogValidation.schemas.js";

const loginLogRoutes = Router();

// Login log routes
loginLogRoutes.post(
  "/",
  AuthMiddleware.isAuthenticated,
  validateRequest(LoginLogsValidationSchemas.ListLoginLogsSchema),
  LoginLogController.index
);  

loginLogRoutes.get(
  "/login-logs/:id",
  AuthMiddleware.isAuthenticated,
  validateRequest(LoginLogsValidationSchemas.GetLoginLogByIdSchema),
  LoginLogController.show
);

loginLogRoutes.post(
  "/login-logs",
  AuthMiddleware.isAuthenticated,
  validateRequest(LoginLogsValidationSchemas.CreateLoginLogSchema),
  LoginLogController.store
);

loginLogRoutes.delete(
  "/login-logs/:id",
  AuthMiddleware.isAuthenticated,
  validateRequest(LoginLogsValidationSchemas.DeleteLoginLogSchema),
  LoginLogController.destroy
);

export default loginLogRoutes;