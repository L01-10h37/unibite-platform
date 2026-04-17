import { successResponse, paginatedResponse, errorResponse } from '../utils/responseHandler.js';
import { logger } from '../utils/logger.js';
import * as usersService from '../services/usersService.js';

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
