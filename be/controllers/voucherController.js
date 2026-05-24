import { successResponse, paginatedResponse, errorResponse } from '../utils/responseHandler.js';
import { logger } from '../utils/logger.js';
import * as voucherService from '../services/voucherService.js';

export const getVouchers = async (req, res, next) => {
  try {
    const status = req.query.status || 'all';
    const vouchers = await voucherService.listVouchers({ status });

    successResponse(res, vouchers, 'Vouchers retrieved successfully', 200);
  } catch (error) {
    logger.error('Error getting vouchers', error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, 'Failed to get vouchers', statusCode);
  }
};

export const getVoucherByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const voucher = await voucherService.getVoucherByCode(code);

    successResponse(res, voucher.getFormattedData?.() || voucher, 'Voucher retrieved successfully', 200);
  } catch (error) {
    logger.error('Error getting voucher by code', error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, 'Failed to get voucher', statusCode);
  }
};

export const validateVoucher = async (req, res, next) => {
  try {
    const { code, subtotal, shippingFee } = req.body;
    const result = await voucherService.validateVoucherForCheckout(code, subtotal, shippingFee);

    successResponse(res, result, 'Voucher validated successfully', 200);
  } catch (error) {
    logger.error('Error validating voucher', error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, 'Failed to validate voucher', statusCode);
  }
};
