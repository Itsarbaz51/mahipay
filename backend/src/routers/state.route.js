// routes/state.routes.js
import { Router } from "express";
import { StateController } from "../controllers/state.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  getAllStatesSchema,
  getStateByIdSchema,
  upsertStateSchema,
  deleteStateSchema,
} from "../validations/stateValidation.schemas.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import PermissionMiddleware from "../middlewares/permission.middleware.js";
import PermissionRegistry from "../utils/permissionRegistry.js";

const stateRoutes = Router();

// Apply authentication to all state routes
stateRoutes.use(AuthMiddleware.authenticate);

// Get all states
stateRoutes.get(
  "/",
  validateRequest(getAllStatesSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.LOCATION_MGMT[0]], // "state:view"
    userTypes: ["root", "admin", "employee"],
  }),
  StateController.getAllStates
);

// Get state by ID
stateRoutes.get(
  "/:id",
  validateRequest(getStateByIdSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.LOCATION_MGMT[0]], // "state:view"
    userTypes: ["root", "admin", "employee"],
  }),
  StateController.getStateById
);

// Create or update state (Only Root)
stateRoutes.post(
  "/",
  validateRequest(upsertStateSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.LOCATION_MGMT[1]], // "state:manage"
    userTypes: ["root"],
  }),
  StateController.upsertState
);

// Delete state (Only Root)
stateRoutes.delete(
  "/:id",
  validateRequest(deleteStateSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.LOCATION_MGMT[2]], // "state:delete"
    userTypes: ["root"],
  }),
  StateController.deleteState
);

export default stateRoutes;