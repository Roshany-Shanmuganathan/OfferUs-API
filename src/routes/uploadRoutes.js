import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { createCloudinaryUpload } from '../services/cloudinaryService.js';

const router = express.Router();

// Middleware to set up Cloudinary upload based on folder
const setupCloudinaryUpload = (req, res, next) => {
  const folder = req.query.folder || 'general';
  const upload = createCloudinaryUpload(folder, 'image');
  upload(req, res, next);
};

// POST /api/upload/image - Upload image to Cloudinary
// Uses dynamic folder based on query parameter
// Registration folders (member-profiles, partner-profiles) allow unauthenticated uploads
// Other folders can still work with optional auth (authenticated users preferred)
// Note: For production, you may want to add rate limiting for unauthenticated uploads
router.post(
  '/image',
  optionalAuth, // Allow both authenticated and unauthenticated requests
  setupCloudinaryUpload,
  uploadImage
);

export default router;

