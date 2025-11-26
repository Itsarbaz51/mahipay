// import { Router } from "express";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import PermissionMiddleware from "../middlewares/permission.middleware.js";
// import PermissionRegistry from "../utils/permissionRegistry.js";
// import { validateRequest } from "../middlewares/validateRequest.js";
// import ServiceProviderController from "../controllers/service.controller.js";
// import { ServiceValidationSchemas } from "../validations/serviceValidation.schemas.js";
// import upload from "../middlewares/multer.middleware.js";

// const serviceRoutes = Router();

// // Create service provider (ADMIN with permissions)
// serviceRoutes.post(
//   "/create",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.SERVICE_PROVIDER.SERVICE_PROVIDER_CREATE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.SERVICE_PROVIDER.SERVICE_PROVIDER_CREATE
//   ),
//   upload.single("icon"),
//   validateRequest(ServiceValidationSchemas.createServiceProvider),
//   ServiceProviderController.create
// );

// // Get all service providers
// serviceRoutes.post(
//   "/lists",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   ServiceProviderController.getAll
// );

// // Update environment config (ADMIN with permissions)
// serviceRoutes.put(
//   "/env-config/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.SERVICE_PROVIDER.SERVICE_PROVIDER_UPDATE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.SERVICE_PROVIDER.SERVICE_PROVIDER_UPDATE
//   ),
//   ServiceProviderController.updateEnvConfig
// );

// // Toggle service status (ADMIN with permissions)
// serviceRoutes.put(
//   "/status/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.SERVICE_PROVIDER.SERVICE_PROVIDER_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.SERVICE_PROVIDER.SERVICE_PROVIDER_MANAGE
//   ),
//   ServiceProviderController.toggleServiceStatus
// );

// // Toggle API integration status (ADMIN with permissions)
// serviceRoutes.put(
//   "/api-intigration-status/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.SERVICE_PROVIDER.SERVICE_PROVIDER_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.SERVICE_PROVIDER.SERVICE_PROVIDER_MANAGE
//   ),
//   ServiceProviderController.toggleApiIntigrationStatus
// );

// // API test connection (ADMIN with permissions)
// serviceRoutes.post(
//   "/api-testing/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.SERVICE_PROVIDER.SERVICE_PROVIDER_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.SERVICE_PROVIDER.SERVICE_PROVIDER_MANAGE
//   ),
//   ServiceProviderController.apiTestConnection
// );

// export default serviceRoutes;
