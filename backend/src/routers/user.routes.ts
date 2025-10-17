import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import UserController from "../controllers/user.controller.js";

const userRoutes = Router();

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
