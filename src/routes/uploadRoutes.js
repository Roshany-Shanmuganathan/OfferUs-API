import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createCloudinaryUpload } from '../services/cloudinaryService.js';

const router = express.Router();

// POST /api/upload/image - Upload image to Cloudinary
// Uses dynamic folder based on query parameter
router.post(
  '/image',
  verifyToken,
  (req, res, next) => {
    const folder = req.query.folder || 'general';
    const upload = createCloudinaryUpload(folder, 'image');
    upload(req, res, next);
  },
  uploadImage
);

export default router;

