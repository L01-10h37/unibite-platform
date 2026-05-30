import { successResponse, errorResponse } from '../utils/responseHandler.js';
import { logger } from '../utils/logger.js';
import * as paymentService from '../services/paymentService.js';
import { getRedisClient } from '../config/redis.js';

export const createPayment = async (req, res, next) => {
    try {
        const paymentData = req.body;

        logger.info('Creating new payment', paymentData);
        
        const payment = await paymentService.createPayment(paymentData, req.user.id);

        const client = getRedisClient();

        if (req.idemKey) {
            await client.set(req.idemKey, JSON.stringify({
                status: "SUCCESS",
                response: payment
            }), {
                EX: 3600
            });
        }

        successResponse(res, payment, 'Payment created successfully', 201);
    } catch (error) {
        if (req.idemKey) {
            const client = getRedisClient();
            await client.del(req.idemKey);
        }

        logger.error('Error creating payment', error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, 'Failed to create payment', statusCode);
    }
};

export const vnpayReturnHandle = async (req, res, next) => {
    try {
        const vnp_Params = req.query;

        const paymentId = vnp_Params["vnp_TxnRef"];

        return res.redirect(
            `exp://192.168.1.5:8081/--/payment-result?paymentId=${paymentId}`
        );
    } catch (error) {
        next(error);
    }
};

export const vnpayIpnHandle = async (req, res, next) => {
    try {
        const vnp_Params = req.query;

        const result = await paymentService.vnpayIpnHandle(vnp_Params);
        console.log("IPN RESULT", result);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const getPaymentById = async (req, res, next) => {
    try {
        const payment = await paymentService.getPaymentById(
            req.params.paymentId,
            req.user.id
        );

        successResponse(res, payment, "Payment fetched successfully", 200);
    } catch (error) {
        next(error);
    }
}