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
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  upload.single("icon"),
  validateRequest(ServiceValidationSchemas.createServiceProvider),
  ServiceProviderController.create
);

// Get all service providers (ADMIN sees all, users see assigned)
serviceRoutes.get(
  "/lists",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
  ]),
  ServiceProviderController.getAll
);

serviceRoutes.put(
  "/env-config/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  ServiceProviderController.updateEnvConfig
);

serviceRoutes.put(
  "/status/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  ServiceProviderController.toggleServiceStatus
);

serviceRoutes.put(
  "/api-intigration-status/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  ServiceProviderController.toggleApiIntigrationStatus
);

serviceRoutes.post(
  "/api-testing/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  ServiceProviderController.apiTestConnection
);

export default serviceRoutes;
