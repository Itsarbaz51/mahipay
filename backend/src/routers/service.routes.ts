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

// Get service provider by ID
serviceRoutes.get(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  ServiceProviderController.getById
);

// Toggle active status
serviceRoutes.patch(
  "/providers/:id/status",
  AuthMiddleware.isAuthenticated,
  ServiceProviderController.toggleActiveStatus
);

// Delete service provider
serviceRoutes.delete(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  ServiceProviderController.delete
);

export default serviceRoutes;
