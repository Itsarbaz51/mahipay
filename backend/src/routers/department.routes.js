// routes/department.routes.js
import { Router } from "express";
import DepartmentController from "../controllers/department.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  deleteDepartmentSchema,
  getAllDepartmentsSchema,
  upsertDepartmentSchema,
} from "../validations/departmentValidation.schemas.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import PermissionMiddleware from "../middlewares/permission.middleware.js";
import PermissionRegistry from "../utils/permissionRegistry.js";

const departmentRoutes = Router();

// Apply authentication to all department routes
departmentRoutes.use(AuthMiddleware.authenticate);

// Get all departments
departmentRoutes.get(
  "/",
  validateRequest(getAllDepartmentsSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.SYSTEM_MGMT[4]], // "department:view"
    userTypes: ["root", "admin", "employee"],
  }),
  DepartmentController.getAllDepartments
);

// Create or update department
departmentRoutes.post(
  "/",
  validateRequest(upsertDepartmentSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.SYSTEM_MGMT[5]], // "department:manage"
    userTypes: ["root", "admin"],
  }),
  // For employees, verify they can act on behalf of their creator
  PermissionMiddleware.canActOnBehalf("department:manage"),
  DepartmentController.upsertDepartment
);

// Delete department
departmentRoutes.delete(
  "/:id",
  validateRequest(deleteDepartmentSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.SYSTEM_MGMT[5]], // "department:manage"
    userTypes: ["root", "admin"],
  }),
  // For employees, verify they can act on behalf of their creator
  PermissionMiddleware.canActOnBehalf("department:manage"),
  DepartmentController.deleteDepartment
);

// Get department by ID
departmentRoutes.get(
  "/:id",
  validateRequest(deleteDepartmentSchema), // Reuse the same schema for ID validation
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.SYSTEM_MGMT[4]], // "department:view"
    userTypes: ["root", "admin", "employee"],
  }),
  DepartmentController.getDepartmentById
);

export default departmentRoutes;
