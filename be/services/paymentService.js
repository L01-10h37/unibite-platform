import { logger } from '../utils/logger.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import mongoose from 'mongoose';
import VNPayHelper from '../config/vnpay.js';
import * as voucherService from './voucherService.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createPayment = async (paymentData, userId) => {
    const session = await mongoose.startSession();

    let result = {};

    const { orderId, method, voucherCode, shippingFee = 0 } = paymentData;

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

            const baseAmount = Number(order.totalPrice) || 0;
            const shippingValue = Number(shippingFee) || 0;

            let voucherDocument = null;
            let discountAmount = 0;
            let shippingDiscount = 0;
            let finalAmount = baseAmount + shippingValue;

            if (voucherCode) {
                voucherDocument = await voucherService.getVoucherByCode(voucherCode);

                const benefit = voucherService.calculateVoucherBenefit(
                    voucherDocument,
                    baseAmount,
                    shippingValue,
                );

                discountAmount = benefit.discountAmount;
                shippingDiscount = benefit.shippingDiscount;
                finalAmount = benefit.finalAmount;
            }

            const payment = await Payment.create([{
                order: order._id,
                amount: finalAmount,
                baseAmount,
                shippingFee: shippingValue,
                discountAmount,
                shippingDiscount,
                finalAmount,
                voucherId: voucherDocument?._id,
                voucherCode: voucherDocument?.code,
                voucherType: voucherDocument?.type,
                method: normalizedMethod,
                status: 'PENDING',
            }], {session});

            if (voucherDocument) {
                if (normalizedMethod === "COD") {
                    await voucherService.consumeVoucherForPayment(
                        voucherDocument._id,
                        payment[0]._id,
                        order._id,
                        { session }
                    );
                } else {
                    await voucherService.reserveVoucherForPayment(
                        voucherDocument._id,
                        payment[0]._id,
                        { session }
                    );
                }
            }

            if (normalizedMethod === "COD") {
                payment[0].status = "SUCCESS";
                payment[0].paidAt = new Date();
                order.isPaid = true;

                await order.save({session});
                await payment[0].save({session});   
            } else if (normalizedMethod === "VNPAY") {
                const paymentUrl = VNPayHelper.buildPaymentUrl(order._id, payment[0].amount, payment[0]._id);

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

export const vnpayIpnHandle = async (vnp_Params) => {
    try {
        if (!VNPayHelper.verifySignature(vnp_Params)) {
            return { RspCode: "97", Message: "Invalid signature" };
        }

        const paymentId = vnp_Params['vnp_TxnRef'];
        const isSuccess = vnp_Params['vnp_ResponseCode'] === "00";

        const session = await mongoose.startSession();

        let result = {};

        await session.withTransaction(async () => {
            const payment = await Payment.findById(paymentId).session(session);

            if (!payment) {
                return { RspCode: "01", Message: "Order not found" };
            }

            if (payment.status === "SUCCESS") {
                return { RspCode: "00", Message: "Already processed" };
            }

            if (isSuccess) {
                payment.status = "SUCCESS";
                payment.paidAt = new Date();    

                const order = await Order.findById(payment.order).session(session);
                if (!order) {
                    return { RspCode: "01", Message: "Order not found" };
                }

                order.isPaid = true;
                await order.save({ session });

                if (payment.voucherId) {
                    await voucherService.consumeVoucherForPayment(
                        payment.voucherId,
                        payment._id,
                        order._id,
                        { session }
                    );
                }
            } else {
                payment.status = "FAILED";

                if (payment.voucherId) {
                    await voucherService.releaseVoucherReservation(payment._id, { session });
                }
            }

            await payment.save({ session });
        });
        session.endSession();

        return { RspCode: "00", Message: "IPN processed successfully" };
    } catch (error) {
        return { RspCode: "99", Message: "Unknown error" }   
    }
}; 