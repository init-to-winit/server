import express from 'express';
import verifyToken from '../middleware/auth.js';
import {
  getAllAthletes,
  getAllCoaches,
  getAllSponsors,
  getAllUsers,
  getAthlete,
  getLeaderboard,
  getUserById,
} from '../controllers/fetchAllController.js';

const router = express.Router();

router.get('/getAllUsers', verifyToken, getAllUsers);

router.post('/getAllAthletes', verifyToken, getAllAthletes);

router.post('/getAllCoaches', verifyToken, getAllCoaches);

router.post('/getAllSponsors', verifyToken, getAllSponsors);

router.post('/getLeaderboardStats', verifyToken, getLeaderboard);

router.get('/getAthlete/:athleteId', verifyToken, getAthlete);

router.get('/user/:userId/:role', verifyToken, getUserById);

export default router;
