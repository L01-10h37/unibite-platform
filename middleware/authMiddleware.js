import { errorResponse } from '../utils/responseHandler.js';
import { logger } from '../utils/logger.js';
import environment from '../config/environment.js';

/**
 * Authentication middleware
 * Check if the request has a valid JWT token
 */
export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('No token provided');
      return errorResponse(res, null, 'No token provided', 401);
    }

    // TODO: Verify JWT token here
    // Example: const decoded = jwt.verify(token, environment.jwt_secret);
    // req.user = decoded;

    logger.info('User authenticated');
    next();
  } catch (error) {
    logger.error('Authentication error', error);
    errorResponse(res, error, 'Authentication failed', 401);
  }
};

/**
 * Authorization middleware
 * Check if the user has specific roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      // TODO: Check user role from req.user
      // if (!roles.includes(req.user.role)) {
      //   return errorResponse(res, null, 'Forbidden', 403);
      // }

      next();
    } catch (error) {
      logger.error('Authorization error', error);
      errorResponse(res, error, 'Authorization failed', 403);
    }
  };
};

export default { authenticate, authorize };
