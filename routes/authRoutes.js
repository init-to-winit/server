import express from 'express';
import { login, signup } from '../controllers/auth/authController.js'; // Ensure correct path

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

export default router;
