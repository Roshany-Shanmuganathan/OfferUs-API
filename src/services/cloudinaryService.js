import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Create multer storage for Cloudinary with folder support
 * @param {string} folder - Folder name in Cloudinary (e.g., 'partner-profiles', 'member-profiles', 'offers')
 * @returns {CloudinaryStorage} Multer storage instance
 */
export const createCloudinaryStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Limit size
    },
  });
};

/**
 * Create multer upload middleware for Cloudinary
 * @param {string} folder - Folder name in Cloudinary
 * @param {string} fieldName - Form field name (default: 'image')
 * @returns {multer.Multer} Multer instance
 */
export const createCloudinaryUpload = (folder, fieldName = 'image') => {
  const storage = createCloudinaryStorage(folder);
  
  const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
    }
  };

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }).single(fieldName);
};

/**
 * Upload image to Cloudinary directly (without multer)
 * @param {Buffer|string} file - File buffer or file path
 * @param {string} folder - Folder name in Cloudinary
 * @param {object} options - Additional options
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadToCloudinary = async (file, folder, options = {}) => {
  try {
    const uploadOptions = {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
      ...options,
    };

    const result = await cloudinary.uploader.upload(file, uploadOptions);
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image to delete
 * @returns {Promise<object>} Cloudinary deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID or null if invalid URL
 */
export const extractPublicId = (url) => {
  if (!url) return null;
  
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    return null;
  }
};

export default cloudinary;

