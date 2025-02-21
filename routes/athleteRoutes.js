import express from 'express';
import verifyToken from '../middleware/auth.js';
import { addPerformance } from '../controllers/athletePerformanceController.js';
import {
  getPerformanceDetails,
  updatePerformance,
} from '../controllers/healthcareContoller.js';

const router = express.Router();

//performance routes
router.post('/addPerformance/:id', verifyToken, addPerformance);
router.put('/editPerformance/:id', verifyToken, updatePerformance);
router.get('/getPerformance/:id', verifyToken, getPerformanceDetails);

export default router;
