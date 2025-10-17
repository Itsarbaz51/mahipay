import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  ProviderCredentialController,
  ProviderRateCardController,
  ServiceController,
  ServiceProviderController,
} from "../controllers/service.controller.js";
import ServiceValidationSchemas from "../validations/serviceValidation.schemas.js";

const serviceRoutes = Router();

// ==================== SERVICE ROUTES ====================
serviceRoutes.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(ServiceValidationSchemas.create),
  ServiceController.create
);

serviceRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ServiceController.getAll
);

serviceRoutes.get(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ServiceController.getById
);

serviceRoutes.put(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(ServiceValidationSchemas.update),
  ServiceController.update
);

serviceRoutes.patch(
  "/:id/deactivate",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(ServiceValidationSchemas.deactivate),
  ServiceController.deactivate
);

// ==================== SERVICE PROVIDER ROUTES ====================
serviceRoutes.post(
  "/providers/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(ServiceValidationSchemas.serviceProviderSchema),
  ServiceProviderController.create
);

serviceRoutes.get(
  "/providers/all",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ServiceProviderController.list
);

serviceRoutes.get(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ServiceProviderController.getById
);

serviceRoutes.put(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(ServiceValidationSchemas.serviceProviderUpdateSchema),
  ServiceProviderController.update
);

serviceRoutes.delete(
  "/providers/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ServiceProviderController.delete
);

// ==================== PROVIDER RATE CARD ROUTES ====================
serviceRoutes.post(
  "/rate-cards/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(ServiceValidationSchemas.providerRateCardSchema),
  ProviderRateCardController.createOrUpdate
);

serviceRoutes.get(
  "/rate-cards/all",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ProviderRateCardController.list
);

serviceRoutes.get(
  "/rate-cards/provider/:providerId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ProviderRateCardController.getByProvider
);

serviceRoutes.get(
  "/rate-cards/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ProviderRateCardController.getById
);

// ==================== PROVIDER CREDENTIAL ROUTES ====================
serviceRoutes.post(
  "/credentials/create",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(ServiceValidationSchemas.providerCredentialSchema),
  ProviderCredentialController.upsert
);

serviceRoutes.get(
  "/credentials/all",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ProviderCredentialController.list
);

serviceRoutes.get(
  "/credentials/provider/:providerId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ProviderCredentialController.getByProvider
);

serviceRoutes.get(
  "/credentials/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ProviderCredentialController.getById
);

serviceRoutes.delete(
  "/credentials/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  ProviderCredentialController.delete
);

export default serviceRoutes;
