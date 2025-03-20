import express from 'express';
import {
  uploadVerificationDocs,
  verifyAthlete,
} from '../controllers/common/profileVerifyController.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();
router.post(
  '/athletes/:id/',
  verifyToken,
  uploadVerificationDocs,
  verifyAthlete
);

export default router;
