import express from 'express';
import verifyToken from '../middleware/auth.js';
import {
  addPerformance,
  getPerformanceDetails,
  updatePerformance,
} from '../controllers/athletePerformanceController.js';

const router = express.Router();

//performance routes
router.post('/addPerformance/:id', verifyToken, addPerformance);
router.put('/editPerformance/:id', verifyToken, updatePerformance);
router.get('/getPerformance/:id', verifyToken, getPerformanceDetails);

export default router;
