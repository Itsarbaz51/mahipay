// src/routes/ccPayout.routes.ts
import { Router } from "express";
import CCPayoutController from "../../controllers/bulkpay/ccPayout.controller.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";
import CCPayoutValidationSchemas from "../../validations/bulkpay/ccPayoutValidation.schemas.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import upload from "../../middlewares/multer.middleware.js";

const router = Router();
const payoutController = new CCPayoutController();

// Apply auth middleware to all routes
router.use(AuthMiddleware.isAuthenticated);

// Sender routes
router.post(
  "/createSender",
  validateRequest(CCPayoutValidationSchemas.CreateSender),
  payoutController.createSender
);

router.post(
  "/uploadCreditcard",
  validateRequest(CCPayoutValidationSchemas.UploadCardImage),
  upload.single("file"),
  payoutController.uploadCardImage
);

router.post(
  "/listSenders",
  validateRequest(CCPayoutValidationSchemas.ListSenders),
  payoutController.listSenders
);

// Beneficiary routes
router.post(
  "/createBeneficiary",
  validateRequest(CCPayoutValidationSchemas.CreateBeneficiary),
  payoutController.createBeneficiary
);

router.post(
  "/listBeneficiary",
  validateRequest(CCPayoutValidationSchemas.ListBeneficiaries),
  payoutController.listBeneficiaries
);

// Collection routes
router.post(
  "/createCardCollectionUrl",
  validateRequest(CCPayoutValidationSchemas.CreateCollection),
  payoutController.createCollection
);

router.post(
  "/listCardCollection",
  validateRequest(CCPayoutValidationSchemas.ListCollections),
  payoutController.listCollections
);

// Dashboard
router.get("/dashboard", payoutController.getDashboard);

// Webhook (no auth required)
router.post(
  "/webhook",
  validateRequest(CCPayoutValidationSchemas.Webhook),
  payoutController.webhookHandler
);

export default router;
