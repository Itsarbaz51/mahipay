// import { Router } from "express";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import PermissionMiddleware from "../middlewares/permission.middleware.js";
// import PermissionRegistry from "../utils/permissionRegistry.js";
// import CommissionValidationSchemas from "../validations/commissionValidation.schemas.js";
// import { validateRequest } from "../middlewares/validateRequest.js";
// import {
//   CommissionEarningController,
//   CommissionSettingController,
// } from "../controllers/commission.controller.js";

// const commissionRoutes = Router();

// // Get commission settings by role or user (ADMIN with permissions)
// commissionRoutes.get(
//   "/setting",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [
//       PermissionRegistry.COMMISSION_SETTINGS.COMMISSION_SETTING_VIEW,
//     ],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.COMMISSION_SETTINGS.COMMISSION_SETTING_VIEW
//   ),
//   CommissionSettingController.getByRoleOrUser
// );

// // Get commission settings created by current user
// commissionRoutes.get(
//   "/setting/created-by-me",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   CommissionSettingController.getAll
// );

// // Create or update commission setting (ADMIN with permissions)
// commissionRoutes.post(
//   "/setting",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [
//       PermissionRegistry.COMMISSION_SETTINGS.COMMISSION_SETTING_MANAGE,
//     ],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.COMMISSION_SETTINGS.COMMISSION_SETTING_MANAGE
//   ),
//   validateRequest(
//     CommissionValidationSchemas.createOrUpdateCommissionSettingSchema
//   ),
//   CommissionSettingController.createOrUpdate
// );

// // Commission Earning Routes (ADMIN with permissions)
// commissionRoutes.post(
//   "/earn",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.COMMISSION_EARNING.COMMISSION_CALCULATE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.COMMISSION_EARNING.COMMISSION_CALCULATE
//   ),
//   validateRequest(CommissionValidationSchemas.createCommissionEarningSchema),
//   CommissionEarningController.create
// );

// commissionRoutes.get(
//   "/earnings",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.COMMISSION_EARNING.COMMISSION_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.COMMISSION_EARNING.COMMISSION_VIEW
//   ),
//   CommissionEarningController.getAll
// );

// export default commissionRoutes;
