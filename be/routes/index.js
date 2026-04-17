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
      users: '/api/users',
      health: '/health'
    }
  }, 'API is running');
});

export default router;
