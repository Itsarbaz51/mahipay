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
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  RoleController.getAllRolesByType
);

// ✅ GET BUSINESS ROLES FOR USER REGISTRATION
roleRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "ADMIN"]),

  RoleController.getAllRoles
);

roleRoutes.get(
  "/business",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  RoleController.getBusinessRoles
);

// ✅ GET EMPLOYEE ROLES FOR EMPLOYEE REGISTRATION
roleRoutes.get(
  "/employee",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "ADMIN"]),
  RoleController.getEmployeeRoles
);

// ✅ GET ROLE BY ID
roleRoutes.get(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  RoleController.getRolebyId
);

// ✅ CREATE EMPLOYEE ROLE (Only ADMIN can create employee roles)
roleRoutes.post(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "ADMIN"]),
  validateRequest(RoleValidationSchemas.createRole),
  RoleController.createRole
);

// ✅ UPDATE EMPLOYEE ROLE (Only ADMIN can update employee roles)
roleRoutes.put(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "ADMIN"]),
  validateRequest(RoleValidationSchemas.updateRole),
  RoleController.updateRole
);

// ✅ DELETE EMPLOYEE ROLE (Only ADMIN can delete employee roles)
roleRoutes.delete(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["employee", "ADMIN"]),
  RoleController.deleteRole
);

export default roleRoutes;
