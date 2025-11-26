// import { Router } from "express";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import PermissionMiddleware from "../middlewares/permission.middleware.js";
// import PermissionRegistry from "../utils/permissionRegistry.js";
// import DepartmentController from "../controllers/department.controller.js";
// import { validateRequest } from "../middlewares/validateRequest.js";
// import DepartmentValidationSchemas from "../validations/departmentValidation.schemas.js";

// const departmentRoutes = Router();

// // Get all departments
// departmentRoutes.get(
//   "/",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.DEPARTMENT_MANAGEMENT.DEPARTMENT_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.DEPARTMENT_MANAGEMENT.DEPARTMENT_VIEW
//   ),
//   DepartmentController.getAllDepartments
// );

// // Get department by ID
// departmentRoutes.get(
//   "/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.DEPARTMENT_MANAGEMENT.DEPARTMENT_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.DEPARTMENT_MANAGEMENT.DEPARTMENT_VIEW
//   ),
//   DepartmentController.getDepartmentById
// );

// // Create department
// departmentRoutes.post(
//   "/",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.DEPARTMENT_MANAGEMENT.DEPARTMENT_CREATE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.DEPARTMENT_MANAGEMENT.DEPARTMENT_CREATE
//   ),
//   validateRequest(DepartmentValidationSchemas.createDepartment),
//   DepartmentController.createDepartment
// );

// // Update department
// departmentRoutes.put(
//   "/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.DEPARTMENT_MANAGEMENT.DEPARTMENT_UPDATE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.DEPARTMENT_MANAGEMENT.DEPARTMENT_UPDATE
//   ),
//   validateRequest(DepartmentValidationSchemas.updateDepartment),
//   DepartmentController.updateDepartment
// );

// // Delete department
// departmentRoutes.delete(
//   "/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.DEPARTMENT_MANAGEMENT.DEPARTMENT_DELETE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.DEPARTMENT_MANAGEMENT.DEPARTMENT_DELETE
//   ),
//   DepartmentController.deleteDepartment
// );

// // Get department permissions
// departmentRoutes.get(
//   "/:id/permissions",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [
//       PermissionRegistry.DEPARTMENT_PERMISSIONS.DEPARTMENT_PERMISSION_VIEW,
//     ],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.DEPARTMENT_PERMISSIONS.DEPARTMENT_PERMISSION_VIEW
//   ),
//   DepartmentController.getDepartmentPermissions
// );

// // Update department permissions
// departmentRoutes.put(
//   "/:id/permissions",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [
//       PermissionRegistry.DEPARTMENT_PERMISSIONS.DEPARTMENT_PERMISSION_MANAGE,
//     ],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.DEPARTMENT_PERMISSIONS.DEPARTMENT_PERMISSION_MANAGE
//   ),
//   validateRequest(DepartmentValidationSchemas.updateDepartmentPermissions),
//   DepartmentController.updateDepartmentPermissions
// );

// export default departmentRoutes;
