import express from 'express';
import {
  sendConnectionRequest,
  handleConnectionRequest,
  getConnections,
} from '../controllers/connectionController.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Send a connection request
router.post('/send-connection', verifyToken, sendConnectionRequest);

// Accept or reject a connection request
router.post('/handle-connection', verifyToken, handleConnectionRequest);

// Get all connections for a user
router.get('/connections/:userId', verifyToken, getConnections);

export default router;
