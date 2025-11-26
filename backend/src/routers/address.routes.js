// routes/address.routes.js
import { Router } from "express";
import { AddressController } from "../controllers/address.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  getAddressByIdSchema,
  createAddressSchema,
  updateAddressSchema,
  deleteAddressSchema,
} from "../validations/addressValidation.schemas.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import PermissionMiddleware from "../middlewares/permission.middleware.js";
import PermissionRegistry from "../utils/permissionRegistry.js";

const addressRoutes = Router();

// Apply authentication to all address routes
addressRoutes.use(AuthMiddleware.authenticate);

// Get address by ID
addressRoutes.get(
  "/:id",
  validateRequest(getAddressByIdSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.ADDRESS_MGMT[0]], // "address:view"
    userTypes: ["root", "admin", "employee"],
  }),
  AddressController.getAddressById
);

// Create address (Only Admin)
addressRoutes.post(
  "/",
  validateRequest(createAddressSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.ADDRESS_MGMT[1]], // "address:create"
    userTypes: ["admin"],
  }),
  PermissionMiddleware.canActOnBehalf("address:create"),
  AddressController.createAddress
);

// Update address (Only Admin)
addressRoutes.put(
  "/:id",
  validateRequest(updateAddressSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.ADDRESS_MGMT[2]], // "address:update"
    userTypes: ["admin"],
  }),
  PermissionMiddleware.canActOnBehalf("address:update"),
  AddressController.updateAddress
);

// Delete address (Only Admin)
addressRoutes.delete(
  "/:id",
  validateRequest(deleteAddressSchema),
  AuthMiddleware.authorize({
    permissions: [PermissionRegistry.ADDRESS_MGMT[3]], // "address:delete"
    userTypes: ["admin"],
  }),
  PermissionMiddleware.canActOnBehalf("address:delete"),
  AddressController.deleteAddress
);

export default addressRoutes;
