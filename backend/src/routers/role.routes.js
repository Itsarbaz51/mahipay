// import { Router } from "express";
// import RoleController from "../controllers/role.controller.js";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import PermissionMiddleware from "../middlewares/permission.middleware.js";
// import PermissionRegistry from "../utils/permissionRegistry.js";
// import { validateRequest } from "../middlewares/validateRequest.js";
// import RoleValidationSchemas from "../validations/roleValidation.schemas.js";

// const roleRoutes = Router();

// //  GET ROLES BY TYPE
// roleRoutes.get(
//   "/type/:type",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.ROLE_MANAGEMENT.ROLE_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.ROLE_MANAGEMENT.ROLE_VIEW
//   ),
//   RoleController.getAllRolesByType
// );

// //  CREATE ROLE
// roleRoutes.post(
//   "/",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.ROLE_MANAGEMENT.ROLE_CREATE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.ROLE_MANAGEMENT.ROLE_CREATE
//   ),
//   validateRequest(RoleValidationSchemas.createRole),
//   RoleController.createRole
// );

// //  UPDATE ROLE
// roleRoutes.put(
//   "/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.ROLE_MANAGEMENT.ROLE_UPDATE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.ROLE_MANAGEMENT.ROLE_UPDATE
//   ),
//   validateRequest(RoleValidationSchemas.updateRole),
//   RoleController.updateRole
// );

// //  DELETE ROLE
// roleRoutes.delete(
//   "/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.ROLE_MANAGEMENT.ROLE_DELETE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.ROLE_MANAGEMENT.ROLE_DELETE
//   ),
//   RoleController.deleteRole
// );

// export default roleRoutes;
