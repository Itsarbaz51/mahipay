import express from "express";
import UserController from "../controllers/user.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import PermissionMiddleware from "../middlewares/permission.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import PermissionRegistry from "../utils/permissionRegistry.js";

const router = express.Router();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

// Business User Registration
router.post(
  "/register",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireUser,
  PermissionMiddleware.requirePermission(
    PermissionRegistry.PERMISSIONS.USER_MANAGEMENT[0]
  ),
  upload.single("profileImage"),
  UserController.register
);

// Business User Profile Management
router.put(
  "/:userId/profile",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireUser,
  PermissionMiddleware.requirePermission(
    PermissionRegistry.PERMISSIONS.USER_MANAGEMENT[2]
  ),
  UserController.updateProfile
);

router.put(
  "/:userId/profile-image",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireUser,
  PermissionMiddleware.requirePermission(
    PermissionRegistry.PERMISSIONS.USER_MANAGEMENT[6]
  ),
  upload.single("profileImage"),
  UserController.updateProfileImage
);

router.get(
  "/:userId",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireUser,
  PermissionMiddleware.requirePermission(
    PermissionRegistry.PERMISSIONS.USER_MANAGEMENT[1]
  ),
  UserController.getUserById
);

// // Business User Management
// router.get(
//   "/role/:roleId",
//   AuthMiddleware.requirePermissions("user:view"),
//   UserController.getAllUsersByRole
// );

// router.get(
//   "/parent/children",
//   AuthMiddleware.requirePermissions("user:view"),
//   UserController.getAllRoleTypeUsersByParentId
// );

// // Business User Status Management
// router.patch(
//   "/:userId/deactivate",
//   AuthMiddleware.requirePermissions("user:manage"),
//   UserController.deactivateUser
// );

// router.patch(
//   "/:userId/reactivate",
//   AuthMiddleware.requirePermissions("user:manage"),
//   UserController.reactivateUser
// );

// router.delete(
//   "/:userId",
//   AuthMiddleware.requirePermissions("user:delete"),
//   UserController.deleteUser
// );

export default router;
