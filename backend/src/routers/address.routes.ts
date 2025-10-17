import { Router } from "express";
import {
  AddressController,
  CityController,
  StateController,
} from "../controllers/address.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";

const addressRoutes = Router();

// address
addressRoutes.get(
  "/address-show/:id",
  AuthMiddleware.isAuthenticated,
  AddressController.show
);
addressRoutes.post(
  "/address-store",
  AuthMiddleware.isAuthenticated,
  AddressController.store
);
addressRoutes.put(
  "/address-update/:id",
  AuthMiddleware.isAuthenticated,
  AddressController.update
);
addressRoutes.delete(
  "/address-delete/:id",
  AuthMiddleware.isAuthenticated,
  AddressController.destroy
);

// state
addressRoutes.get("/state-list", StateController.index);
addressRoutes.post(
  "/state-store",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  StateController.store
);
addressRoutes.put(
  "/state-update/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  StateController.update
);
addressRoutes.delete(
  "/state-delete/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  StateController.destroy
);

// city
addressRoutes.get("/city-list", CityController.index);
addressRoutes.post(
  "/city-store",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  CityController.store
);
addressRoutes.put(
  "/city-update/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  CityController.update
);
addressRoutes.delete(
  "/city-delete/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  CityController.destroy
);

export default addressRoutes;
