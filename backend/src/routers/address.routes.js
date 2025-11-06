import { Router } from "express";
import {
  AddressController,
  CityController,
  StateController,
} from "../controllers/address.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";

const addressRoutes = Router();

// ===================== ADDRESS ROUTES =====================

// Address operations (Business users only)
addressRoutes.get(
  "/address-show/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  AddressController.show
);

addressRoutes.post(
  "/address-store",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  AddressController.store
);

addressRoutes.put(
  "/address-update/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  AddressController.update
);

addressRoutes.delete(
  "/address-delete/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  AddressController.destroy
);

// ===================== STATE ROUTES =====================

// State list (Public)
addressRoutes.get("/state-list", StateController.index);

// State management (ADMIN only)
addressRoutes.post(
  "/state-store",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  StateController.store
);

addressRoutes.put(
  "/state-update/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  StateController.update
);

addressRoutes.delete(
  "/state-delete/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  StateController.destroy
);

// ===================== CITY ROUTES =====================

// City list (Public)
addressRoutes.get("/city-list", CityController.index);

// City management (ADMIN only)
addressRoutes.post(
  "/city-store",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  CityController.store
);

addressRoutes.put(
  "/city-update/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  CityController.update
);

addressRoutes.delete(
  "/city-delete/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  CityController.destroy
);

export default addressRoutes;
