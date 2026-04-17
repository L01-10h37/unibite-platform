import { logger } from '../utils/logger.js';
import User from '../models/User.js';

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

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      const error = new Error('Email already exists');
      error.statusCode = 409;
      throw error;
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
