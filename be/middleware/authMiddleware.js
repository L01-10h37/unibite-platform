import { errorResponse } from '../utils/responseHandler.js';
import { logger } from '../utils/logger.js';
import environment from '../config/environment.js';
import jwt from 'jsonwebtoken';

/**
 * Authentication middleware (Xác thực)
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
 * Authorization middleware (Ủy quyền)
 * Kiểm tra liệu người dùng có quyền truy cập không
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      // Kiểm tra nếu user role không nằm trong danh sách roles được phép truy cập
      if (!roles.includes(req.user.role)) {
        throw new Error('User role not authorized');
      }

      // Log thông tin về quyền truy cập của người dùng và sang bước tiếp theo
      logger.info('User authorized with roles:', roles);
      next();
    } catch (error) {
      logger.error('Authorization error', error);
      errorResponse(res, error, 'Authorization failed', 403);
    }
  };
};

export default { authenticate, authorize };
