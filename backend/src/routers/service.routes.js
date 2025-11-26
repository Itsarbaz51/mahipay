import { Router } from "express";
import { ServiceProviderController } from "../controllers/serviceProvider.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  assignServicesSchema,
  updateServiceStatusSchema,
  deleteServicesSchema,
  getServicesSchema,
} from "../validations/serviceValidation.schemas.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import checkServiceMiddleware from "../middlewares/checkServiceMiddleware.js";

const serviceRoutes = Router();

// Apply authentication to all service routes
serviceRoutes.use(AuthMiddleware.authenticate);

// ========== SERVICE ASSIGNMENT ROUTES ==========
serviceRoutes.post(
  "/assign",
  validateRequest(assignServicesSchema),
  checkServiceMiddleware("assign"),
  ServiceProviderController.assignServices
);

// ========== SERVICE STATUS ROUTES ==========
serviceRoutes.patch(
  "/status/:id?",
  validateRequest(updateServiceStatusSchema),
  checkServiceMiddleware("modify"),
  ServiceProviderController.updateServiceStatus
);

// ========== SERVICE DELETION ROUTES ==========
serviceRoutes.delete(
  "/:id?",
  validateRequest(deleteServicesSchema),
  checkServiceMiddleware("delete"),
  ServiceProviderController.deleteServices
);

// ========== SERVICE QUERY ROUTES ==========
serviceRoutes.get(
  "/",
  validateRequest(getServicesSchema),
  checkServiceMiddleware("view"),
  ServiceProviderController.getServices
);

export default serviceRoutes;
