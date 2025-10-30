import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import FundRequestController from "../controllers/FundRequestController.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import FundRequestValidationSchemas from "../validations/FundRequestValidation.schemas.js";
import upload from "../middlewares/multer.middleware.js";

const fundRequestRoutes = Router();

// Fund request routes
fundRequestRoutes.post(
  "/list",
  AuthMiddleware.isAuthenticated,
  validateRequest(FundRequestValidationSchemas.ListFundRequests),
  FundRequestController.index
);

fundRequestRoutes.get(
  "/:id",
  AuthMiddleware.isAuthenticated,
  FundRequestController.show
);

fundRequestRoutes.post(
  "/create",
  AuthMiddleware.isAuthenticated,
  upload.fields([{ name: "paymentImage", maxCount: 1 }]),
  validateRequest(FundRequestValidationSchemas.CreateFundRequest),
  FundRequestController.store
);

fundRequestRoutes.put(
  "/:id/update",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN"]),
  validateRequest(FundRequestValidationSchemas.UpdateFundRequest),
  FundRequestController.update
);

fundRequestRoutes.post(
  "/verify-payment",
  AuthMiddleware.isAuthenticated,
  validateRequest(FundRequestValidationSchemas.VerifyPayment),
  FundRequestController.verification
);

fundRequestRoutes.post(
  "/create-order",
  AuthMiddleware.isAuthenticated,
  validateRequest(FundRequestValidationSchemas.CreateOrder),
  FundRequestController.createRazorpayOrder
);

fundRequestRoutes.get(
  "/wallet/balance",
  AuthMiddleware.isAuthenticated,
  FundRequestController.getWalletBalance
);

fundRequestRoutes.get(
  "/stats/summary",
  AuthMiddleware.isAuthenticated,
  FundRequestController.getStats
);

fundRequestRoutes.delete(
  "/:id",
  AuthMiddleware.isAuthenticated,
  FundRequestController.destroy
);

export default fundRequestRoutes;
