// import express from "express";
// import AuditLogsController from "../controllers/auditLog.controller.js";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import PermissionMiddleware from "../middlewares/permission.middleware.js";
// import PermissionRegistry from "../utils/permissionRegistry.js";

// const router = express.Router();

// router.post(
//   "/",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.AUDIT_LOGS.AUDIT_LOG_VIEW],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.AUDIT_LOGS.AUDIT_LOG_VIEW
//   ),
//   AuditLogsController.getAuditLogs
// );

// export default router;
