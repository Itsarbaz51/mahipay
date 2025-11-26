import { Router } from "express";
import RoleController from "../controllers/role.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  deleteRoleSchema,
  getAllRolesByTypeSchema,
  upsertRoleSchema,
} from "../validations/roleValidation.schemas.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import PermissionMiddleware from "../middlewares/permission.middleware.js";
import PermissionRegistry from "../utils/permissionRegistry.js";

// const roleRoutes = Router();

// Apply authentication to all role routes
roleRoutes.use(AuthMiddleware.authenticate);

roleRoutes.get(
  "/roles",
  validateRequest(getAllRolesByTypeSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.SYSTEM_MGMT[3]], // "role:manage"
    userTypes: ["root", "business", "employee"],
  }),
  RoleController.getAllRoles
);

roleRoutes.post(
  "/",
  validateRequest(upsertRoleSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.SYSTEM_MGMT[3]], // "role:manage"
    userTypes: ["root", "business"],
  }),
  // For employees, verify they can act on behalf of their creator
  PermissionMiddleware.canActOnBehalf("role:manage"),
  RoleController.upsertRole
);

roleRoutes.delete(
  "/:id",
  validateRequest(deleteRoleSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.SYSTEM_MGMT[3]], // "role:manage"
    userTypes: ["root", "business"],
  }),
  // For employees, verify they can act on behalf of their creator
  PermissionMiddleware.canActOnBehalf("role:manage"),
  RoleController.deleteRole
);

// export default roleRoutes;
