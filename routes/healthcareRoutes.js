import express from 'express';
import verifyToken from '../middleware/auth.js';
import {
  addHealthcare,
  editHealthcare,
  getHealthcareDetails,
} from '../controllers/healthcareContoller.js';

const router = express.Router();

router.post('/addHealthcare/:id', verifyToken, addHealthcare);

router.put('/editHealthcare/:id', verifyToken, editHealthcare);

router.get('/getHealthcareDetails/:id', verifyToken, getHealthcareDetails);

export default router;
