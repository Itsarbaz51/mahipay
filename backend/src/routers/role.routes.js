import { Router } from "express";
import RoleController from "../controllers/role.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import RoleValidationSchemas from "../validations/roleValidation.schemas.js";

const roleRoutes = Router();

// ✅ GET ROLES BY TYPE (employee or business)
roleRoutes.get(
  "/type/:type",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  RoleController.getAllRolesByType
);

// ✅ GET BUSINESS ROLES FOR USER REGISTRATION
roleRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  RoleController.getAllRoles
);

roleRoutes.get(
  "/business",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  RoleController.getBusinessRoles
);

// ✅ GET EMPLOYEE ROLES FOR EMPLOYEE REGISTRATION
roleRoutes.get(
  "/employee",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  RoleController.getEmployeeRoles
);

// ✅ GET ROLE BY ID
roleRoutes.get(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  RoleController.getRolebyId
);

// ✅ CREATE EMPLOYEE ROLE (Only ADMIN can create employee roles)
roleRoutes.post(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  validateRequest(RoleValidationSchemas.createRole),
  RoleController.createRole
);

// ✅ UPDATE EMPLOYEE ROLE (Only ADMIN can update employee roles)
roleRoutes.put(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  validateRequest(RoleValidationSchemas.updateRole),
  RoleController.updateRole
);

// ✅ DELETE EMPLOYEE ROLE (Only ADMIN can delete employee roles)
roleRoutes.delete(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  RoleController.deleteRole
);

export default roleRoutes;
