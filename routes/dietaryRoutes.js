import express from 'express';
import verifyToken from '../middleware/auth.js';
import {
  addDietaryPlan,
  getDietaryPlan,
  updateDietaryPlan,
} from '../controllers/athlete/dietaryController.js';

const router = express.Router();

router.post('/addDietary/:id', verifyToken, addDietaryPlan);

router.put('/editDietary/:id', verifyToken, updateDietaryPlan);

router.get('/getDietary/:id', verifyToken, getDietaryPlan);

export default router;
