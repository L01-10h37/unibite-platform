import express from 'express';
import * as voucherController from '../controllers/voucherController.js';

const router = express.Router();

/**
 * Get vouchers
 */
router.get('/', voucherController.getVouchers);

/**
 * Validate voucher for checkout
 */
router.post('/validate', voucherController.validateVoucher);

/**
 * Get voucher by code
 */
router.get('/:code', voucherController.getVoucherByCode);

export default router;
