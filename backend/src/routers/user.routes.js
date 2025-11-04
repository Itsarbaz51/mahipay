import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import UserController from "../controllers/user.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import upload from "../middlewares/multer.middleware.js";
import UserValidationSchemas from "../validations/userValidation.schemas.js";

const userRoutes = Router();

// ✅ SPECIFIC ROUTES FIRST (before parameterized routes)

userRoutes.get(
  "/employe",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  UserController.getAllEmployeUsersByParentId
);

userRoutes.get(
  "/me",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  UserController.getCurrentUser
);

userRoutes.get(
  "/role/:roleId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  UserController.getAllUsersByRole
);

userRoutes.get(
  "/children/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  UserController.getAllUsersByChildrenId
);

userRoutes.get(
  "/count/parent/:parentId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  UserController.getAllUsersCountByParentId
);

userRoutes.get(
  "/count/children/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  UserController.getAllUsersCountByChildrenId
);

// ✅ PARAMETERIZED ROUTES LAST

userRoutes.get(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  UserController.getUserById
);

// Other routes remain the same...
userRoutes.post(
  "/register",
  upload.single("profileImage"),
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  validateRequest(UserValidationSchemas.register),
  UserController.register
);

userRoutes.put(
  "/:userId/profile",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  validateRequest(UserValidationSchemas.updateProfile),
  UserController.updateProfile
);

userRoutes.put(
  "/:userId/profile-image",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  upload.single("profileImage"),
  validateRequest(UserValidationSchemas.updateProfileImage),
  UserController.updateProfileImage
);

userRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
  ]),
  UserController.getAllRoleTypeUsersByParentId
);

userRoutes.patch(
  "/:userId/deactivate",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(UserValidationSchemas.deactivateUser),
  UserController.deactivateUser
);

userRoutes.patch(
  "/:userId/reactivate",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(UserValidationSchemas.reactivateUser),
  UserController.reactivateUser
);

userRoutes.delete(
  "/:userId/delete",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(UserValidationSchemas.deleteUser),
  UserController.deleteUser
);

export default userRoutes;
