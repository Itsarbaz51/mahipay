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

// Get active service providers (ADMIN sees all active, business users see assigned active)
serviceRoutes.get(
  "/providers/active",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business", "employee"]),
  ServiceProviderController.getAllActive
);

// Get service provider by ID (Business users and employees)
serviceRoutes.get(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business", "employee"]),
  ServiceProviderController.getById
);

// Update service provider (ADMIN only)
serviceRoutes.put(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  validateRequest(ServiceValidationSchemas.updateServiceProvider),
  ServiceProviderController.update
);

// Toggle active status (ADMIN only)
serviceRoutes.patch(
  "/providers/:id/status",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  validateRequest(ServiceValidationSchemas.toggleStatus),
  ServiceProviderController.toggleActiveStatus
);

// Delete service provider (ADMIN only)
serviceRoutes.delete(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  ServiceProviderController.delete
);

// Service Credential Management (ADMIN only)
serviceRoutes.put(
  "/providers/:id/credentials",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  ServiceProviderController.updateCredentials
);

serviceRoutes.get(
  "/providers/:id/credentials",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  ServiceProviderController.getCredentials
);

export default serviceRoutes;
