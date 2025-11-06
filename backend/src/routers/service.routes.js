import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import ServiceProviderController from "../controllers/service.controller.js";
import { ServiceValidationSchemas } from "../validations/serviceValidation.schemas.js";
import upload from "../middlewares/multer.middleware.js";

const serviceRoutes = Router();

// Create service provider (ADMIN only)
serviceRoutes.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  upload.single("icon"),
  validateRequest(ServiceValidationSchemas.createServiceProvider),
  ServiceProviderController.create
);

// Get all service providers (ADMIN sees all, business users see assigned)
serviceRoutes.get(
  "/lists",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business", "employee"]),
  ServiceProviderController.getAll
);

serviceRoutes.put(
  "/env-config/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  ServiceProviderController.updateEnvConfig
);

serviceRoutes.put(
  "/status/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  ServiceProviderController.toggleServiceStatus
);

serviceRoutes.put(
  "/api-intigration-status/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  ServiceProviderController.toggleApiIntigrationStatus
);

serviceRoutes.post(
  "/api-testing/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  ServiceProviderController.apiTestConnection
);

export default serviceRoutes;
