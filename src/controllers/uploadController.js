import { sendSuccess, sendError } from '../utils/responseFormat.js';

/**
 * @desc    Upload image to Cloudinary
 * @route   POST /api/upload/image
 * @access  Private (Authenticated users)
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No image file provided');
    }

    // req.file from CloudinaryStorage contains secure_url and public_id
    const imageUrl = req.file.secure_url || req.file.path;
    const publicId = req.file.public_id;

    if (!imageUrl) {
      return sendError(res, 500, 'Failed to get image URL from Cloudinary');
    }

    return sendSuccess(res, 200, 'Image uploaded successfully', {
      url: imageUrl,
      public_id: publicId,
    });
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to upload image');
  }
};

