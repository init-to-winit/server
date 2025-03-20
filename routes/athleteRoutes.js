import express from 'express';
import verifyToken from '../middleware/auth.js';
import upload from '../middleware/multerConfig.js'; // Import multer config
import {
  addPerformance,
  getPerformanceDetails,
  updatePerformance,
} from '../controllers/athlete/athletePerformanceController.js';
import {
  analyzePlayerPerformance,
  getPlayerVideoPerformance,
} from '../controllers/aiAnalysis/playerVideoAnalysis.js';
import { uploadVideo } from '../middleware/cloudinaryMiddleware.js';

const router = express.Router();

// Performance routes
router.post('/addPerformance/:id', verifyToken, addPerformance);
router.put('/editPerformance/:id', verifyToken, updatePerformance);
router.get('/getPerformance/:id', verifyToken, getPerformanceDetails);

router.post(
  '/videoAnalysis/:athleteId',
  verifyToken,
  upload.single('video'),
  uploadVideo,
  analyzePlayerPerformance
);
router.get(
  '/getVideoPerformanceAnalysis/:athleteId',
  verifyToken,
  getPlayerVideoPerformance
);

export default router;
