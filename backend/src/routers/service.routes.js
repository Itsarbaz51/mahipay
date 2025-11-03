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

// Get active service providers (ADMIN sees all active, users see assigned active)
serviceRoutes.get(
  "/providers/active",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
  ]),
  ServiceProviderController.getAllActive
);

// Get service provider by ID
serviceRoutes.get(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAILER",
  ]),
  ServiceProviderController.getById
);

// Update service provider (ADMIN only)
serviceRoutes.put(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(ServiceValidationSchemas.updateServiceProvider),
  ServiceProviderController.update
);

// Toggle active status (ADMIN only)
serviceRoutes.patch(
  "/providers/:id/status",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(ServiceValidationSchemas.toggleStatus),
  ServiceProviderController.toggleActiveStatus
);

// Delete service provider (ADMIN only)
serviceRoutes.delete(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  ServiceProviderController.delete
);

// Service Credential Management
serviceRoutes.put(
  "/providers/:id/credentials",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  ServiceProviderController.updateCredentials
);

serviceRoutes.get(
  "/providers/:id/credentials",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  ServiceProviderController.getCredentials
);

export default serviceRoutes;
