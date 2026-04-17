import { errorResponse } from '../utils/responseHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Request validation middleware
 * Validate request body against a schema
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const errors = schema(req.body);

      if (errors) {
        logger.warn('Validation failed', errors);
        return errorResponse(res, errors, 'Validation failed', 400);
      }

      next();
    } catch (error) {
      logger.error('Validation error', error);
      errorResponse(res, error, 'Validation error', 400);
    }
  };
};

/**
 * Simple validators
 */
export const validators = {
  /**
   * Validate user creation
   */
  validateCreateUser: (data) => {
    const errors = {};

    if (!data.name) {
      errors.name = 'Name is required';
    }

    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!validators.isValidEmail(data.email)) {
      errors.email = 'Email is invalid';
    }

    return Object.keys(errors).length === 0 ? null : errors;
  },

  /**
   * Validate email format
   */
  isValidEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Validate ID format
   */
  isValidId: (id) => {
    return /^\d+$/.test(id) || /^[a-f0-9]{24}$/.test(id);
  },
};

export default { validateRequest, validators };
