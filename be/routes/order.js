import express from 'express';
import * as ordersController from '../controllers/ordersController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Create order
 * POST api/orders/
 */
router.post('/', authenticate, ordersController.createOrder);

/**
 * Get all user's orders
 * GET api/orders/my
 */
router.get('/my', authenticate, ordersController.getMyOrders);

/**
 * Get order status by id
 * GET api/orders/:orderId
 */
router.get('/:orderId', authenticate, ordersController.getOrderById);

/**
 * Update order status (admin only)
 * PATCH api/orders/:orderId/status
 */
router.patch('/:orderId/status', authenticate, ordersController.updateOrderStatus);

/**
 * Update order status by assigned seller
 * PATCH api/orders/:orderId/seller-status
 */
router.patch(
	'/:orderId/seller-status',
	authenticate,
	authorize('seller'),
	ordersController.updateSellerOrderStatus
);

/**
 * Cancel order by id 
 * POST api/orders/:orderId/cancel
 */
router.post('/:orderId/cancel', authenticate, ordersController.cancelOrder);

export default router;
