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

/**
 * DELETE /api/cart/items/:id
 */
router.delete('/items/:id', authenticate, cartController.removeItemFromCart);

/** 
 * PATCH /api/cart/:id
*/
router.patch('/:id', authenticate, cartController.updateCart);

export default router;