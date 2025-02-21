import express from 'express';
import verifyToken from '../middleware/auth.js';
import { addDietaryPlan } from '../controllers/dietaryController.js';

const router = express.Router();

router.post('/addDietary/:id', verifyToken, addDietaryPlan);

export default router;
