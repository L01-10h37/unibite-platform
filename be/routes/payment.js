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
 * GET api/payments/vnpay-ipn
 */
router.get('/vnpay-ipn', paymentController.vnpayIpnHandle);

router.get("/:paymentId", authenticate, paymentController.getPaymentById);

export default router;