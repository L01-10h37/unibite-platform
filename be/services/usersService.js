import { logger } from '../utils/logger.js';
import User from '../models/User.js';
import { deleteAvatarFromS3 } from '../utils/s3Upload.js';
import bcrypt from 'bcryptjs';

/**
 * Get all users
 */
export const getAllUsers = async (page = 1, limit = 10) => {
  try {
    logger.info('Service: Getting all users');
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    return {
      users: users.map(user => user.getFormattedData?.() || user),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Service: Error getting all users', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (id) => {
  try {
    logger.info(`Service: Getting user by ID: ${id}`);

    const user = await User.findById(id);
    return user ? user.getFormattedData?.() || user : null;
  } catch (error) {
    logger.error('Service: Error getting user by ID', error);
    throw error;
  }
};

/**
 * Create new user
 */
export const createUser = async (userData) => {
  try {
    logger.info('Service: Creating new user', userData);

    // Hash password nếu có
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const newUser = await User.create(userData);
    return newUser.getFormattedData?.() || newUser;
  } catch (error) {
    logger.error('Service: Error creating user', error);
    throw error;
  }
};

/**
 * Update user
 */
export const updateUser = async (id, userData) => {
  try {
    logger.info(`Service: Updating user with ID: ${id}`);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      userData,
      {
        new: true, // Trả về document sau khi update
        runValidators: true, // Chạy validators
      }
    );

    if (!updatedUser) {
      return null;
    }

    return updatedUser.getFormattedData?.() || updatedUser;
  } catch (error) {
    logger.error('Service: Error updating user', error);
    throw error;
  }
};

/**
 * Delete user
 */
export const deleteUser = async (id) => {
  try {
    logger.info(`Service: Deleting user with ID: ${id}`);

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return null;
    }

    return true;
  } catch (error) {
    logger.error('Service: Error deleting user', error);
    throw error;
  }
};

/**
 * Get user by ID (for profile - excludes sensitive data)
 */
export const getUserProfile = async (id) => {
  try {
    logger.info(`Service: Getting user profile by ID: ${id}`);

    const user = await User.findById(id).select('-password');
    return user ? user.getFormattedData?.() || user : null;
  } catch (error) {
    logger.error('Service: Error getting user profile', error);
    throw error;
  }
};

/**
 * Update user profile (name, phone only)
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    logger.info(`Service: Updating user profile for ID: ${userId}`);

    // Only allow name and phone to be updated
    const allowedUpdates = {};
    if (profileData.name) {
      allowedUpdates.name = profileData.name;
    }
    if (profileData.phone) {
      allowedUpdates.phone = profileData.phone;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      allowedUpdates,
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    if (!updatedUser) {
      return null;
    }

    return updatedUser.getFormattedData?.() || updatedUser;
  } catch (error) {
    logger.error('Service: Error updating user profile', error);
    throw error;
  }
};

/**
 * Update user avatar
 */
export const updateAvatar = async (userId, avatarUrl) => {
  try {
    logger.info(`Service: Updating avatar for user ID: ${userId}`);

    // Get current user to delete old avatar if exists
    const currentUser = await User.findById(userId);
    if (currentUser && currentUser.avatar) {
      await deleteAvatarFromS3(currentUser.avatar);
    }

    // Update avatar URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    if (!updatedUser) {
      return null;
    }

    return {
      message: 'Avatar updated successfully',
      avatarURL: updatedUser.avatar,
      user: updatedUser.getFormattedData?.() || updatedUser,
    };
  } catch (error) {
    logger.error('Service: Error updating avatar', error);
    throw error;
  }
};

