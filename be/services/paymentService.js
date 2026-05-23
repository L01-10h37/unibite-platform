import { logger } from '../utils/logger.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import mongoose from 'mongoose';
import VNPayHelper from '../config/vnpay.js';
import qs from 'qs';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createPayment = async (paymentData, userId) => {
    const session = await mongoose.startSession();

    let result = {};

    const { orderId, method } = paymentData;

    try {
        await session.withTransaction(async () => { 
            logger.info('Service: Creating new payment', paymentData);

            if (!isValidObjectId(orderId)) {
                const error = new Error('Invalid orderId format');
                error.statusCode = 400;
                throw error;
            };

            const normalizedMethod = method?.toUpperCase().trim();

            const allowedMethods = ["COD", "VNPAY", "MOMO"];

            if (!allowedMethods.includes(normalizedMethod)) {
                const error = new Error('Invalid payment method');
                error.statusCode = 400;
                throw error;
            }

            const order = await Order.findById(orderId).session(session);

            if (!order) {
                const error = new Error('Order not found');
                error.statusCode = 404;
                throw error;
            };

            if (order.user.toString() !== userId) {
                const error = new Error('Not your order');
                error.statusCode = 403;
                throw error;
            };

            if (order.isPaid) {
                const error = new Error('Order already paid');
                error.statusCode = 400;
                throw error;
            };

            if (["CANCELLED", "COMPLETED"].includes(order.status)) {
                const error = new Error('Cannot pay this order');
                error.statusCode = 400;
                throw error;
            }

            const existing = await Payment.findOne({
                order: orderId,
                status: { $in: ["PENDING", "SUCCESS"] }
            }).session(session);

            if (existing) {
                result.payment = existing.getFormattedData?.() || existing;
                return;
            }

            const payment = await Payment.create([{
                order: order._id,
                amount: order.totalPrice,
                method: normalizedMethod,
                status: 'PENDING',
            }], {session});

            if (normalizedMethod === "COD") {
                payment[0].status = "SUCCESS";
                payment[0].paidAt = new Date();
                order.isPaid = true;

                await order.save({session});
                await payment[0].save({session});   
            } else if (normalizedMethod === "VNPAY") {
                const paymentUrl = VNPayHelper.buildPaymentUrl(order._id, order.totalPrice, payment[0]._id);

                result.paymentUrl = paymentUrl;
            }

            result.payment = payment[0].getFormattedData?.() || payment[0];
        })
        return result;
    } catch (error) {
        if (error.code === 11000) {
            const existing = await Payment.findOne({
                order: orderId,
                status: "PENDING"
            });

            return existing.getFormattedData?.() || existing;
        }
        logger.error('Service: Error creating new payment', error);
		throw error;
    } finally {
        session.endSession();
    }
};

export const vnpayReurnHandle = async (vnp_Params) => {
    VNPayHelper.verifySignature(vnp_Params);

    const paymentId = vnp_Params['vnp_TxnRef'];
    const isSuccess = vnp_Params['vnp_ResponseCode'] === "00";

    const session = await mongoose.startSession();

    let result = { success: false };

    await session.withTransaction(async () => {
        const payment = await Payment.findById(paymentId).session(session);

        if (!payment) throw new Error("Payment not found");

        if (payment.status === "SUCCESS") {
            result.success = true;
            return;
        }

        if (isSuccess) {
            payment.status = "SUCCESS";
            payment.paidAt = new Date();

            const order = await Order.findById(payment.order).session(session);
            order.isPaid = true;

            await order.save({ session });

            result.success = true;
        } else {
            payment.status = "FAILED";
        }

        await payment.save({ session });
    });

    session.endSession();

    return result;
};

// export const vnpayIpnHandle = async (vnp_Params) => {
//     try {
//         const secureHash = vnp_Params['vnp_SecureHash'];
//         delete vnp_Params['vnp_SecureHash'];
//         delete vnp_Params['vnp_SecureHashType'];

        
//     } catch (error) {
//         logger.error('Error handling VNPay IPN', error);
//         throw error;    
//     }
// }; 