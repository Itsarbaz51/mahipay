// routes/city.routes.js
import { Router } from "express";
import { CityController } from "../controllers/city.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  getAllCitiesSchema,
  getCityByIdSchema,
  upsertCitySchema,
  deleteCitySchema,
} from "../validations/cityValidation.schemas.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import PermissionMiddleware from "../middlewares/permission.middleware.js";
import PermissionRegistry from "../utils/permissionRegistry.js";

const cityRoutes = Router();

// Apply authentication to all city routes
cityRoutes.use(AuthMiddleware.authenticate);

// Get all cities
cityRoutes.get(
  "/",
  validateRequest(getAllCitiesSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.LOCATION_MGMT[3]], // "city:view"
    userTypes: ["root", "admin", "employee"],
  }),
  CityController.getAllCities
);

// Get city by ID
cityRoutes.get(
  "/:id",
  validateRequest(getCityByIdSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.LOCATION_MGMT[3]], // "city:view"
    userTypes: ["root", "admin", "employee"],
  }),
  CityController.getCityById
);

// Create or update city (Only Root)
cityRoutes.post(
  "/",
  validateRequest(upsertCitySchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.LOCATION_MGMT[4]], // "city:manage"
    userTypes: ["root"],
  }),
  CityController.upsertCity
);

// Delete city (Only Root)
cityRoutes.delete(
  "/:id",
  validateRequest(deleteCitySchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.LOCATION_MGMT[5]], // "city:delete"
    userTypes: ["root"],
  }),
  CityController.deleteCity
);

export default cityRoutes;