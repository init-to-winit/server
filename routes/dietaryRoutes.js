import express from 'express';
import verifyToken from '../middleware/auth.js';
import {
  addDietaryPlan,
  updateDietaryPlan,
} from '../controllers/dietaryController.js';

const router = express.Router();

router.post('/addDietary/:id', verifyToken, addDietaryPlan);

router.put('/editDietary/:id', verifyToken, updateDietaryPlan);

export default router;
