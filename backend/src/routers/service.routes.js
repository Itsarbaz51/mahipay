import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { ServiceProviderController } from "../controllers/service.controller.js";
import { ServiceValidationSchemas } from "../validations/serviceValidation.schemas.js";

const serviceRoutes = Router();

// Create service provider
serviceRoutes.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  validateRequest(ServiceValidationSchemas.createServiceProvider),
  ServiceProviderController.create
);

// Get all service providers created by current user
serviceRoutes.get(
  "/providers/my",
  AuthMiddleware.isAuthenticated,
  ServiceProviderController.getAllByCreatedUser
);

serviceRoutes.get(
  "/providers/status",
  AuthMiddleware.isAuthenticated,
  ServiceProviderController.getAllByCreatedUserAndStatus
);

// Get service provider by ID
serviceRoutes.get(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  ServiceProviderController.getById
);

// Update service provider
serviceRoutes.put(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  validateRequest(ServiceValidationSchemas.updateServiceProvider),
  ServiceProviderController.update
);

// Toggle active status
serviceRoutes.patch(
  "/providers/:id/status",
  AuthMiddleware.isAuthenticated,
  validateRequest(ServiceValidationSchemas.toggleStatus),
  ServiceProviderController.toggleActiveStatus
);

// Delete service provider
serviceRoutes.delete(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  ServiceProviderController.delete
);

export default serviceRoutes;
