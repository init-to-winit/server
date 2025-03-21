import express from 'express';
import {
  uploadVerificationDocs,
  verifyAthlete,
  verifyCoach,
  verifySponsor,
} from '../controllers/common/profileVerifyController.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();
router.post(
  '/athlete/:id/',
  verifyToken,
  uploadVerificationDocs,
  verifyAthlete
);

router.post('/coach/:id/', verifyToken, uploadVerificationDocs, verifyCoach);

router.post('/sponsor/:id/', verifyToken, verifySponsor);

export default router;
