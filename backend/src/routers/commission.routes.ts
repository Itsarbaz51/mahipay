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

commissionRoutes.post(
  "/setting",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(
    CommissionValidationSchemas.createOrUpdateCommissionSettingSchema
  ),
  CommissionSettingController.createOrUpdate
);

commissionRoutes.get(
  "/setting/:roleId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  CommissionSettingController.getByRoleOrUser
);

// Commission Earning Routes

commissionRoutes.post(
  "/earn",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(CommissionValidationSchemas.createCommissionEarningSchema),
  CommissionEarningController.create
);

commissionRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  CommissionEarningController.getAll
);

export default commissionRoutes;
