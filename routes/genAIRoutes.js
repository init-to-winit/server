import express from 'express';
import {
  getDietarySuggestions,
  getHealthcareSuggestions,
  getPerformanceSuggestions,
} from '../controllers/genAIController.js';

const router = express.Router();

router.get('/dietary/:athleteId', getDietarySuggestions);
router.get('/performance/:athleteId', getPerformanceSuggestions);
router.get('/healthcare/:athleteId', getHealthcareSuggestions);

export default router;
