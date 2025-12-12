import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { createCloudinaryUpload } from '../services/cloudinaryService.js';

const router = express.Router();

// Middleware to set up Cloudinary upload based on folder
const setupCloudinaryUpload = (req, res, next) => {
  const folder = req.query.folder || 'general';
  
  // Wrap the upload middleware to catch errors
  const upload = createCloudinaryUpload(folder, 'image');
  
  upload(req, res, (err) => {
    if (err) {
      console.error('Cloudinary upload error:', err);
      // Pass the error to the next error handler, or handle it here
      return res.status(500).json({ 
        success: false, 
        message: 'Image upload failed', 
        error: err.message 
      });
    }
    next();
  });
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
