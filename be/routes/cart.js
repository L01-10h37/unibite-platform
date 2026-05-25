import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/cart/
 */
router.get('/', authenticate, cartController.getCart);

/**
 * POST /api/cart/items
 */
router.post('/items', authenticate, cartController.addItemToCart);

export default router;