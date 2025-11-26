import { Router } from "express";
import { ApiIntegrationController } from "../controllers/apiIntegration.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  createApiIntegrationSchema,
  getAllApiIntegrationsSchema,
  getApiIntegrationByIdSchema,
  toggleApiIntegrationStatusSchema,
  updateApiIntegrationSchema,
} from "../validations/apiIntegrationValidation.schemas.js";
// import { authorize } from "../middlewares/authorize.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Only Root users can access these routes
router.get(
  "/",
  validateRequest(getAllApiIntegrationsSchema),
  ApiIntegrationController.getAllApiIntegrations
);

router.get(
  "/:id",
  validateRequest(getApiIntegrationByIdSchema),
  ApiIntegrationController.getApiIntegrationById
);

router.post(
  "/",
  validateRequest(createApiIntegrationSchema),
  ApiIntegrationController.createApiIntegration
);

router.put(
  "/:id",
  validateRequest(updateApiIntegrationSchema),
  ApiIntegrationController.updateApiIntegration
);

router.patch(
  "/:id/activate",
  validateRequest(toggleApiIntegrationStatusSchema),
  ApiIntegrationController.activateApiIntegration
);

router.patch(
  "/:id/deactivate",
  validateRequest(toggleApiIntegrationStatusSchema),
  ApiIntegrationController.deactivateApiIntegration
);

export default router;
