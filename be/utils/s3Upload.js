import cloudinary from 'cloudinary';
import environment from '../config/environment.js';
import { logger } from './logger.js';
import path from 'path';

/**
 * Configure Cloudinary
 */
cloudinary.v2.config({
  cloud_name: environment.cloudinary_cloud_name,
  api_key: environment.cloudinary_api_key,
  api_secret: environment.cloudinary_api_secret,
});

/**
 * Upload avatar to Cloudinary
 * @param {Buffer} fileBuffer - File content buffer
 * @param {string} originalFileName - Original file name
 * @returns {Promise<string>} Cloudinary file URL
 */
export const uploadAvatarToS3 = async (fileBuffer, originalFileName) => {
  try {
    if (!environment.cloudinary_cloud_name || !environment.cloudinary_api_key || !environment.cloudinary_api_secret) {
      const error = new Error('Cloudinary credentials not configured');
      error.statusCode = 500;
      throw error;
    }

    // Convert buffer to base64 for upload
    const base64String = fileBuffer.toString('base64');
    const dataURI = `data:image/jpeg;base64,${base64String}`;

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(dataURI, {
      folder: 'unibite/avatars',
      resource_type: 'auto',
      public_id: `avatar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quality: 'auto',
      fetch_format: 'auto',
    });

    logger.info(`Avatar uploaded to Cloudinary: ${result.public_id}`);
    return result.secure_url;
  } catch (error) {
    logger.error('Error uploading avatar to Cloudinary', error);
    throw error;
  }
};

/**
 * Delete avatar from Cloudinary
 * @param {string} fileUrl - Cloudinary file URL
 */
export const deleteAvatarFromS3 = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.includes('cloudinary')) {
      logger.warn('Invalid Cloudinary URL format, skipping deletion');
      return;
    }

    // Extract public_id from URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/path/to/public_id.jpg
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const publicId = `unibite/avatars/${fileName.split('.')[0]}`;

    await cloudinary.v2.uploader.destroy(publicId);
    logger.info(`Avatar deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error('Error deleting avatar from Cloudinary', error);
    // Don't throw error for deletion failure, just log it
  }
};

/**
 * Validate file type (only allow images)
 */
export const validateImageFile = (mimeType) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
  return allowedMimes.includes(mimeType);
};

/**
 * Validate file size (max 5MB)
 */
export const validateFileSize = (fileSize, maxSizeMB = 5) => {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxBytes;
};
