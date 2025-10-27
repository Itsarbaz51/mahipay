import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import PermissionValidationSchemas from "../validations/permissionValidation.schemas.js";
import {
  RolePermissionController,
  UserPermissionController,
} from "../controllers/permission.controller.js";

const permissionRoutes = Router();

// Role Permission Routes
permissionRoutes.post(
  "/role-upsert",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(PermissionValidationSchemas.createOrUpdateRolePermission),
  RolePermissionController.createOrUpdate
);

permissionRoutes.get(
  "/role-permission/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  RolePermissionController.getByRole
);

permissionRoutes.delete(
  "/role-permission/:roleId/:serviceId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(PermissionValidationSchemas.deleteRolePermission),
  RolePermissionController.delete
);

// User Permission Routes
permissionRoutes.post(
  "/user-upsert",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(PermissionValidationSchemas.createOrUpdateUserPermission),
  UserPermissionController.createOrUpdate
);

permissionRoutes.get(
  "/user-permission/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  UserPermissionController.getByUser
);

permissionRoutes.delete(
  "/user-permission/:userId/:serviceId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(PermissionValidationSchemas.deleteUserPermission),
  UserPermissionController.delete
);

export default permissionRoutes;
