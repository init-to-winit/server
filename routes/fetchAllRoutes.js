import express from 'express';
import verifyToken from '../middleware/auth.js';
import {
  getAllAthletes,
  getAllCoaches,
  getAllSponsors,
  getAllUsers,
  getLeaderboard,
} from '../controllers/fetchAllController.js';

const router = express.Router();

router.get('/getAllUsers', verifyToken, getAllUsers);

router.get('/getAllAthletes', verifyToken, getAllAthletes);

router.get('/getAllCoaches', verifyToken, getAllCoaches);

router.get('/getAllSponsors', verifyToken, getAllSponsors);

router.get('/getLeaderboardStats', verifyToken, getLeaderboard);

export default router;
