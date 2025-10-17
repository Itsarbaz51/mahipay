import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import PermissionValidationSchemas from "../validations/permissionValidation.schemas.js";
import {
  RolePermissionController,
  UserPermissionController,
} from "../controllers/permission.controller.js";

const permissionRoutes = Router();

//Role
permissionRoutes.post(
  "/role-upsert",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(PermissionValidationSchemas.createRolePermission),
  RolePermissionController.createOrUpdate
);

permissionRoutes.get(
  "/role-permission/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  RolePermissionController.getByRole
);

permissionRoutes.delete(
  "/role-permission/delete/:roleId/:serviceId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  RolePermissionController.delete
);

//User
permissionRoutes.post(
  "/user-upsert",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(PermissionValidationSchemas.createUserPermission),
  UserPermissionController.createOrUpdate
);

// ✅ Get by User ID
permissionRoutes.get(
  "/user-permission/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  UserPermissionController.getByUser
);

// ✅ Delete
permissionRoutes.delete(
  "/user-permission/delete/:userId/:serviceId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  UserPermissionController.delete
);

export default permissionRoutes;
