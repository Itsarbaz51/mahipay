import express from "express";
import EmployeeController from "../controllers/employee.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import PermissionMiddleware from "../middlewares/permission.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

// // All routes require authentication
// router.use(AuthMiddleware.authenticate);

// // Employee Registration & Management
// router.post(
//   "/register",
//   AuthMiddleware.requirePermissions("employee:create"),
//   upload.single("profileImage"),
//   EmployeeController.register
// );

// router.put(
//   "/:employeeId/profile",
//   PermissionMiddleware.requireOwnership("employee", "employeeId"),
//   AuthMiddleware.requirePermissions("employee:update"),
//   EmployeeController.updateProfile
// );

// router.put(
//   "/:employeeId/profile-image",
//   PermissionMiddleware.requireOwnership("employee", "employeeId"),
//   AuthMiddleware.requirePermissions("employee:update"),
//   upload.single("profileImage"),
//   EmployeeController.updateProfileImage
// );

// // Employee Permissions Management
// router.put(
//   "/:employeeId/permissions",
//   AuthMiddleware.requirePermissions("employee:manage"),
//   EmployeeController.updatePermissions
// );

// router.get(
//   "/:employeeId/permissions",
//   AuthMiddleware.requirePermissions("employee:view"),
//   EmployeeController.getPermissions
// );

// // Employee Access
// router.get(
//   "/",
//   AuthMiddleware.requirePermissions("employee:view"),
//   EmployeeController.getAllEmployeesByParentId
// );

// router.get(
//   "/:employeeId",
//   AuthMiddleware.requirePermissions("employee:view"),
//   EmployeeController.getEmployeeById
// );

// // Employee Status Management
// router.patch(
//   "/:employeeId/deactivate",
//   AuthMiddleware.requirePermissions("employee:manage"),
//   EmployeeController.deactivateEmployee
// );

// router.patch(
//   "/:employeeId/reactivate",
//   AuthMiddleware.requirePermissions("employee:manage"),
//   EmployeeController.reactivateEmployee
// );

// router.delete(
//   "/:employeeId",
//   AuthMiddleware.requirePermissions("employee:delete"),
//   EmployeeController.deleteEmployee
// );

// // Permission Checks
// router.post("/check-permission", EmployeeController.checkPermission);

// router.post("/check-permissions", EmployeeController.checkPermissions);

export default router;
