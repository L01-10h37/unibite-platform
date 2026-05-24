import express from 'express';
import { logger } from '../utils/logger.js';
import { successResponse } from '../utils/responseHandler.js';

const router = express.Router();

/**
 * GET home page
 */
router.get('/', (req, res, next) => {
  logger.info('Home route accessed');
  successResponse(res, { 
    message: 'Welcome to Mobile App Backend',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      profile: '/api/users/me',
      shops: '/api/shops',
      foods: '/api/foods',
      vouchers: '/api/vouchers',
      health: '/health'
    }
  }, 'API is running');
});

export default router;
