import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { idempotencyMiddleware } from '../middleware/idempotencyMiddleware.js';

const router = express.Router();

/**
 * Create payment and return payment url (if method = vnpay)
 * POST api/payments/
 */
router.post('/', authenticate, idempotencyMiddleware, paymentController.createPayment);

/**
 * VNPay return
 * GET api/payments/vnpay-return
 */
router.get('/vnpay-return', paymentController.vnpayReturnHandle);

/**
 * VNPay ipn
 * POST api/payments/vnpay-ipn
 */
router.post('/vnpay-ipn', paymentController.vnpayIpnHandle);

export default router;