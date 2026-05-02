import { errorResponse } from '../utils/responseHandler.js';
import { logger } from '../utils/logger.js';
import environment from '../config/environment.js';
import jwt from 'jsonwebtoken';

/**
 * Authentication middleware
 * Xác thực JWT access token từ Authorization header.
 * Gắn thông tin user vào req.user để các controller sử dụng.
 *
 * Header format: Authorization: Bearer <accessToken>
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('No token provided');
      return errorResponse(res, null, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, environment.jwt_access_secret);

    // Gắn user vào request để controller dùng (vd: req.user.id, req.user.username)
    req.user = decoded;

    logger.info(`User authenticated: ${decoded.username}`);
    next();
  } catch (error) {
    logger.error('Authentication error', error);

    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, null, 'Token has expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, null, 'Invalid token', 401);
    }

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
