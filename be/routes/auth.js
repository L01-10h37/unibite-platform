import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

/**
 * POST /api/auth/register
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/logout
 */
router.post('/logout', authController.logout);

/**
 * POST /api/auth/refresh-token
 */
router.post('/refresh', authController.refreshToken);

export default router;