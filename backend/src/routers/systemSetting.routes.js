// import { Router } from "express";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import PermissionMiddleware from "../middlewares/permission.middleware.js";
// import PermissionRegistry from "../utils/permissionRegistry.js";
// import SystemSettingController from "../controllers/systemSetting.controller.js";
// import { validateRequest } from "../middlewares/validateRequest.js";
// import upload from "../middlewares/multer.middleware.js";
// import SystemSettingValidationSchemas from "../validations/systemSettingValidation.schemas.js";

// const systemSettingRoutes = Router();

// // Get system setting by ID (ADMIN with permissions)
// systemSettingRoutes.get(
//   "/show",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.SYSTEM_SETTINGS.SYSTEM_SETTING_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.SYSTEM_SETTINGS.SYSTEM_SETTING_VIEW
//   ),
//   SystemSettingController.show
// );

// // List all system settings (ADMIN with permissions)
// systemSettingRoutes.get(
//   "/list",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.SYSTEM_SETTINGS.SYSTEM_SETTING_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.SYSTEM_SETTINGS.SYSTEM_SETTING_VIEW
//   ),
//   SystemSettingController.index
// );

// // Delete system setting (ADMIN with permissions)
// systemSettingRoutes.delete(
//   "/delete/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.SYSTEM_SETTINGS.SYSTEM_SETTING_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.SYSTEM_SETTINGS.SYSTEM_SETTING_MANAGE
//   ),
//   SystemSettingController.delete
// );

// // Upsert system setting (ADMIN with permissions)
// systemSettingRoutes.post(
//   "/upsert",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.SYSTEM_SETTINGS.SYSTEM_SETTING_MANAGE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.SYSTEM_SETTINGS.SYSTEM_SETTING_MANAGE
//   ),
//   upload.fields([
//     { name: "companyLogo", maxCount: 1 },
//     { name: "favIcon", maxCount: 1 },
//   ]),
//   validateRequest(SystemSettingValidationSchemas.upsertSchema),
//   SystemSettingController.upsert
// );

// export default systemSettingRoutes;
