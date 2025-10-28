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
commissionRoutes.get(
  "/setting",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  CommissionSettingController.getByRoleOrUser
);

commissionRoutes.get(
  "/setting/created-by-me",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "RETAIlER",
  ]),
  CommissionSettingController.getByCreatedBy
);

commissionRoutes.post(
  "/setting",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(
    CommissionValidationSchemas.createOrUpdateCommissionSettingSchema
  ),
  CommissionSettingController.createOrUpdate
);

// Commission Earning Routes
commissionRoutes.post(
  "/earn",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(CommissionValidationSchemas.createCommissionEarningSchema),
  CommissionEarningController.create
);

commissionRoutes.get(
  "/earnings",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  CommissionEarningController.getAll
);

export default commissionRoutes;
