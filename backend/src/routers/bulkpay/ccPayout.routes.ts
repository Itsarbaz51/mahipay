// routes/ccPayout.routes.ts

import { Router } from 'express';
import {
  CCSenderController,
  CCBeneficiaryController,
  CCCollectionController
} from '../controllers/ccPayout.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Sender routes
router.post('/senders', CCSenderController.create);
router.post('/senders/upload-card', upload.single('file'), CCSenderController.uploadCardImage);
router.get('/senders', CCSenderController.list);

// Beneficiary routes
router.post('/beneficiaries', CCBeneficiaryController.create);
router.get('/beneficiaries', CCBeneficiaryController.list);

// Collection routes
router.post('/collections', CCCollectionController.create);
router.get('/collections', CCCollectionController.list);

export default router;