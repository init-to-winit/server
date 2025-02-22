import express from 'express';
import {
  getDietarySuggestions,
  getHealthcareSuggestions,
  getPerformanceSuggestions,
} from '../controllers/genAIController.js';
import verifyToken from '../middleware/auth.js';
import { chatbotController } from '../controllers/chatbotController.js';

const router = express.Router();
//suggestion routes
router.get('/dietary/:athleteId', verifyToken, getDietarySuggestions);
router.get('/performance/:athleteId', verifyToken, getPerformanceSuggestions);
router.get('/healthcare/:athleteId', verifyToken, getHealthcareSuggestions);

//chatbot routes
router.post('/chat', verifyToken, chatbotController);

export default router;
