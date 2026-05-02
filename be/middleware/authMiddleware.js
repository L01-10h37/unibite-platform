import { errorResponse } from '../utils/responseHandler.js';
import { logger } from '../utils/logger.js';
import environment from '../config/environment.js';
import jwt from 'jsonwebtoken';

/**
 * Authentication middleware (Xác thực)
 * Kiểm tra xem request có chứa token JWT hợp lệ hay không (Đăng nhập chưa)
 */
export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('No token provided');
      return errorResponse(res, null, 'No token provided', 401);
    }

    // Xác thực token và lấy thông tin người dùng cho các bước tiếp theo
    const decoded = jwt.verify(token, environment.jwt_access_secret);
    req.user = decoded;

    // Log thông tin người dùng đã được xác thực và sang bước tiếp theo
    logger.info('User authenticated');
    next();
  } catch (error) {
    logger.error('Authentication error', error);
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
