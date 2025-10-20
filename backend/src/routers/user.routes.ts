import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import UserController from "../controllers/user.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import upload from "../middlewares/multer.middleware.js";
import UserValidationSchemas from "../validations/userValidation.schemas.js";

const userRoutes = Router();

userRoutes.post(
  "/register",
  upload.single("profileImage"),
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(UserValidationSchemas.register),
  UserController.register
);

userRoutes.put(
  "/:userId/profile",
  AuthMiddleware.isAuthenticated,
  validateRequest(UserValidationSchemas.updateProfile),
  UserController.updateProfile
);

userRoutes.put(
  "/:userId/profile-image",
  AuthMiddleware.isAuthenticated,
  upload.single("profileImage"),
  validateRequest(UserValidationSchemas.updateProfileImage),
  UserController.updateProfileImage
);

userRoutes.get(
  "/me",
  AuthMiddleware.isAuthenticated,
  UserController.getCurrentUser
);

userRoutes.get(
  "/:id",
  AuthMiddleware.isAuthenticated,
  UserController.getUserById
);

userRoutes.get(
  "/role/:roleId",
  AuthMiddleware.isAuthenticated,
  UserController.getAllUsersByRole
);

userRoutes.post(
  "/",
  AuthMiddleware.isAuthenticated,
  UserController.getAllUsersByParentId
);
userRoutes.get(
  "/children/:userId",
  AuthMiddleware.isAuthenticated,
  UserController.getAllUsersByChildrenId
);
userRoutes.get(
  "/count/parent/:parentId",
  AuthMiddleware.isAuthenticated,
  UserController.getAllUsersCountByParentId
);
userRoutes.get(
  "/count/children/:userId",
  AuthMiddleware.isAuthenticated,
  UserController.getAllUsersCountByChildrenId
);

export default userRoutes;
