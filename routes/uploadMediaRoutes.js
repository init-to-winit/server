import express from 'express';
import { uploadProfilePhoto } from '../middleware/cloudinaryMiddleware.js';
import {
  getProfilepic,
  uploadProfilepic,
} from '../controllers/common/uploadMediaController.js';
import upload from '../middleware/multerConfig.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

//profile routes
router.post(
  '/profilePic/:id',
  verifyToken,
  upload.single('photo'),
  uploadProfilePhoto,
  uploadProfilepic
);
router.post('/getProfilePic/:id', verifyToken, getProfilepic);

export default router;
