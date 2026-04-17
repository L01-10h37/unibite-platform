import { logger } from '../utils/logger.js';

// Mock database - Replace with actual database queries
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

let nextId = 3;

/**
 * Get all users
 */
export const getAllUsers = async () => {
  try {
    logger.info('Service: Getting all users');
    return users;
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
    const user = users.find(u => u.id === parseInt(id));
    return user || null;
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
    const newUser = {
      id: nextId++,
      ...userData,
    };
    users.push(newUser);
    return newUser;
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
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    
    if (userIndex === -1) {
      return null;
    }
    
    users[userIndex] = { ...users[userIndex], ...userData };
    return users[userIndex];
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
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    
    if (userIndex === -1) {
      return null;
    }
    
    users.splice(userIndex, 1);
    return true;
  } catch (error) {
    logger.error('Service: Error deleting user', error);
    throw error;
  }
};
