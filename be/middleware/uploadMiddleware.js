import multer from 'multer';
import { logger } from '../utils/logger.js';

/**
 * Configure multer for file uploads
 * Store files in memory (not on disk) before uploading to S3
 */
const storage = multer.memoryStorage();

/**
 * File filter - only allow images
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`);
    error.statusCode = 400;
    cb(error, false);
  }
};

/**
 * Create multer upload instance
 * Max file size: 5MB
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Middleware for single file upload
 * Usage: uploadMiddleware.single('avatar')(req, res, next)
 */
export const uploadSingleFile = upload.single('avatar');

/**
 * Error handling for multer
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error('Multer error', err);

    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size is 5MB',
        error: err.message,
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Only one file is allowed',
        error: err.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message,
    });
  }

  if (err && err.statusCode === 400) {
    logger.error('File validation error', err);
    return res.status(400).json({
      success: false,
      message: err.message,
      error: err.message,
    });
  }

  if (err) {
    logger.error('Upload error', err);
    return res.status(500).json({
      success: false,
      message: 'Upload error',
      error: err.message,
    });
  }

  next();
};
