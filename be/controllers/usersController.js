import { successResponse, paginatedResponse, errorResponse } from '../utils/responseHandler.js';
import { logger } from '../utils/logger.js';
import * as usersService from '../services/usersService.js';
import * as authService from '../services/authService.js';
import { uploadAvatarToS3, validateImageFile, validateFileSize } from '../utils/s3Upload.js';
import { validatePasswordChange, validateProfileUpdate } from '../utils/validators.js';

/**
 * Get all users
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    logger.info(`Fetching users - Page: ${page}, Limit: ${limit}`);
    const result = await usersService.getAllUsers(page, limit);

    paginatedResponse(
      res,
      result.users,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      'Users retrieved successfully',
      200
    );
  } catch (error) {
    logger.error('Error fetching users', error);
    errorResponse(res, error, 'Failed to fetch users', 500);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching user with ID: ${id}`);
    const user = await usersService.getUserById(id);

    if (!user) {
      return errorResponse(res, null, 'User not found', 404);
    }

    successResponse(res, user, 'User retrieved successfully', 200);
  } catch (error) {
    logger.error('Error fetching user', error);
    errorResponse(res, error, 'Failed to fetch user', 500);
  }
};

/**
 * Create new user
 */
export const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    logger.info('Creating new user', userData);
    const user = await usersService.createUser(userData);
    successResponse(res, user, 'User created successfully', 201);
  } catch (error) {
    logger.error('Error creating user', error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, 'Failed to create user', statusCode);
  }
};

/**
 * Update user
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    logger.info(`Updating user with ID: ${id}`);
    const user = await usersService.updateUser(id, userData);

    if (!user) {
      return errorResponse(res, null, 'User not found', 404);
    }

    successResponse(res, user, 'User updated successfully', 200);
  } catch (error) {
    logger.error('Error updating user', error);
    errorResponse(res, error, 'Failed to update user', 500);
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`Deleting user with ID: ${id}`);
    const result = await usersService.deleteUser(id);

    if (!result) {
      return errorResponse(res, null, 'User not found', 404);
    }

    successResponse(res, null, 'User deleted successfully', 200);
  } catch (error) {
    logger.error('Error deleting user', error);
    errorResponse(res, error, 'Failed to delete user', 500);
  }
};

/**
 * Get current user profile (authenticated user)
 * GET /me
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    logger.info(`Fetching current user profile: ${userId}`);

    const user = await usersService.getUserProfile(userId);

    if (!user) {
      return errorResponse(res, null, 'User not found', 404);
    }

    successResponse(res, user, 'User profile retrieved successfully', 200);
  } catch (error) {
    logger.error('Error fetching current user profile', error);
    errorResponse(res, error, 'Failed to fetch user profile', 500);
  }
};

/**
 * Update current user profile (name, phone only)
 * PATCH /me
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body;

    logger.info(`Updating user profile: ${userId}`, { name, phone });

    // Validate input
    const validation = validateProfileUpdate({ name, phone });
    if (!validation.valid) {
      return errorResponse(res, null, validation.messages?.join(', ') || 'Validation failed', 400);
    }

    const updatedUser = await usersService.updateUserProfile(userId, { name, phone });

    if (!updatedUser) {
      return errorResponse(res, null, 'User not found', 404);
    }

    successResponse(res, updatedUser, 'User profile updated successfully', 200);
  } catch (error) {
    logger.error('Error updating user profile', error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, 'Failed to update user profile', statusCode);
  }
};

/**
 * Update user avatar
 * PATCH /me/avatar
 */
export const updateAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      return errorResponse(res, null, 'No file uploaded', 400);
    }

    logger.info(`Updating avatar for user: ${userId}`);

    // Validate file type
    if (!validateImageFile(req.file.mimetype)) {
      return errorResponse(res, null, 'Invalid file type. Only images are allowed', 400);
    }

    // Validate file size
    if (!validateFileSize(req.file.size)) {
      return errorResponse(res, null, 'File size exceeds 5MB limit', 413);
    }

    // Upload to Cloudinary
    const avatarUrl = await uploadAvatarToS3(req.file.buffer, req.file.originalname);

    // Update user avatar in database
    const result = await usersService.updateAvatar(userId, avatarUrl);

    if (!result) {
      return errorResponse(res, null, 'User not found', 404);
    }

    successResponse(res, { message: result.message, avatarURL: avatarUrl }, 'Avatar updated successfully', 200);
  } catch (error) {
    logger.error('Error updating avatar', error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, 'Failed to update avatar', statusCode);
  }
};

/**
 * Change user password
 * PATCH /me/password
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    logger.info(`Changing password for user: ${userId}`);

    // Validate input
    const validation = validatePasswordChange(oldPassword, newPassword);
    if (!validation.valid) {
      return errorResponse(res, null, validation.message, 400);
    }

    // Change password via auth service
    const result = await authService.changePassword(userId, oldPassword, newPassword);

    successResponse(res, result, 'Password changed successfully', 200);
  } catch (error) {
    logger.error('Error changing password', error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, 'Failed to change password', statusCode);
  }
};
