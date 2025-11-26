// import { Router } from "express";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import PermissionMiddleware from "../middlewares/permission.middleware.js";
// import PermissionRegistry from "../utils/permissionRegistry.js";
// import { validateRequest } from "../middlewares/validateRequest.js";
// import PermissionValidationSchemas from "../validations/permissionValidation.schemas.js";
// import {
//   RolePermissionController,
//   UserPermissionController,
// } from "../controllers/permission.controller.js";

// const permissionRoutes = Router();

// // Role Permission Routes (ADMIN with permissions)
// permissionRoutes.post(
//   "/role-upsert",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.ROLE_PERMISSIONS.ROLE_PERMISSION_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.ROLE_PERMISSIONS.ROLE_PERMISSION_MANAGE
//   ),
//   validateRequest(PermissionValidationSchemas.createOrUpdateRolePermission),
//   RolePermissionController.createOrUpdate
// );

// permissionRoutes.get(
//   "/role-permission/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.ROLE_PERMISSIONS.ROLE_PERMISSION_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.ROLE_PERMISSIONS.ROLE_PERMISSION_VIEW
//   ),
//   RolePermissionController.getByRole
// );

// permissionRoutes.delete(
//   "/role-permission/:roleId/:serviceId",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.ROLE_PERMISSIONS.ROLE_PERMISSION_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.ROLE_PERMISSIONS.ROLE_PERMISSION_MANAGE
//   ),
//   validateRequest(PermissionValidationSchemas.deleteRolePermission),
//   RolePermissionController.delete
// );

// // User Permission Routes (ADMIN with permissions)
// permissionRoutes.post(
//   "/user-upsert",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.USER_PERMISSIONS.USER_PERMISSION_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.USER_PERMISSIONS.USER_PERMISSION_MANAGE
//   ),
//   validateRequest(PermissionValidationSchemas.createOrUpdateUserPermission),
//   UserPermissionController.createOrUpdate
// );

// permissionRoutes.get(
//   "/user-permission/:userId",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.USER_PERMISSIONS.USER_PERMISSION_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.USER_PERMISSIONS.USER_PERMISSION_VIEW
//   ),
//   UserPermissionController.getByUser
// );

// permissionRoutes.delete(
//   "/user-permission/:userId/:serviceId",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.USER_PERMISSIONS.USER_PERMISSION_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.USER_PERMISSIONS.USER_PERMISSION_MANAGE
//   ),
//   validateRequest(PermissionValidationSchemas.deleteUserPermission),
//   UserPermissionController.delete
// );

// export default permissionRoutes;
