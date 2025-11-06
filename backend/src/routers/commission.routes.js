import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import CommissionValidationSchemas from "../validations/commissionValidation.schemas.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  CommissionEarningController,
  CommissionSettingController,
} from "../controllers/commission.controller.js";

const commissionRoutes = Router();

// Commission Setting Routes

// Get commission settings by role or user (ADMIN only)
commissionRoutes.get(
  "/setting",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  CommissionSettingController.getByRoleOrUser
);

// Get commission settings created by current user (Business users)
commissionRoutes.get(
  "/setting/created-by-me",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business"]),
  CommissionSettingController.getByCreatedBy
);

// Create or update commission setting (ADMIN only)
commissionRoutes.post(
  "/setting",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  validateRequest(
    CommissionValidationSchemas.createOrUpdateCommissionSettingSchema
  ),
  CommissionSettingController.createOrUpdate
);

// Commission Earning Routes (ADMIN only)
commissionRoutes.post(
  "/earn",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  validateRequest(CommissionValidationSchemas.createCommissionEarningSchema),
  CommissionEarningController.create
);

commissionRoutes.get(
  "/earnings",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeBusinessRoles(["ADMIN"]),
  CommissionEarningController.getAll
);

export default commissionRoutes;
