import { logger } from '../utils/logger.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import mongoose from 'mongoose';
import VNPayHelper from '../config/vnpay.js';
import * as voucherService from './voucherService.js';
import crypto from 'crypto'

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createPayment = async (paymentData, userId) => {
    const session = await mongoose.startSession();

    let result = {};

    const { orderIds, method, voucherCode, shippingFee = 0 } = paymentData;

    const sortedOrders = [...orderIds].sort();
    const tempHash = crypto
        .createHash('sha256')
        .update(sortedOrders.map(id => id.toString()).join(','))
        .digest('hex');

    try {
        await session.withTransaction(async () => { 
            logger.info('Service: Creating new payment', paymentData);

            if (orderIds.some(id => !isValidObjectId(id))) {
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

            const orders = await Order.find({
                _id: { $in: orderIds }
            }).session(session);

            if (orders.length !== orderIds.length) {
                const error = new Error('Some orders not found');
                error.statusCode = 404;
                throw error;
            }

            if (orders.some(order => order.user.toString() !== userId.toString())) {
                const error = new Error('Not your order');
                error.statusCode = 403;
                throw error;
            }

            if (orders.some(order => order.isPaid)) {
                const error = new Error('Some orders already paid');
                error.statusCode = 400;
                throw error;
            }

            if (orders.some(order =>
                ["CANCELLED", "COMPLETED"].includes(order.status)
            )) {
                const error = new Error('Some orders cannot be paid');
                error.statusCode = 400;
                throw error;
            }

            const existing = await Payment.findOne({
                ordersHash: tempHash,
                status: { $in: ["PENDING", "SUCCESS"] }
            }).session(session);

            if (existing) {
                result.payment = existing.getFormattedData?.() || existing;
                return;
            }

            const baseAmount = orders.reduce(
                (sum, order) => sum + order.totalPrice,
                0
            );            
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

            const payment = new Payment({
                orders: sortedOrders,
                ordersHash: tempHash,
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
            });

            await payment.save({ session });

            if (voucherDocument) {
                if (normalizedMethod === "COD") {
                    await voucherService.consumeVoucherForPayment(
                        voucherDocument._id,
                        payment._id,
                        userId,
                        { session }
                    );
                } else {
                    await voucherService.reserveVoucherForPayment(
                        voucherDocument._id,
                        payment._id,
                        { session }
                    );
                }
            }

            if (normalizedMethod === "COD") {
                payment.status = "SUCCESS";
                payment.paidAt = new Date();
                await Order.updateMany(
                    {
                        _id: { $in: orderIds }
                    },
                    {
                        $set: { isPaid: true }
                    },
                    { session }
                );
                await payment.save({session});   
            } else if (normalizedMethod === "VNPAY") {
                const paymentUrl = VNPayHelper.buildPaymentUrl(payment.amount, payment._id);

                result.paymentUrl = paymentUrl;
            }

            result.payment = payment.getFormattedData?.() || payment;
        })
        return result;
    } catch (error) {
        if (error.code === 11000) {
            const existing = await Payment.findOne({
                ordersHash: tempHash,
                status: "PENDING"
            }).session(session);

            return existing.getFormattedData?.() || existing;
        }
        logger.error('Service: Error creating new payment', error);
		throw error;
    } finally {
        session.endSession();
    }
};

export const vnpayIpnHandle = async (vnp_Params) => {
    const session = await mongoose.startSession();
    
    try {
        if (!VNPayHelper.verifySignature(vnp_Params)) {
            return { RspCode: "97", Message: "Invalid signature" };
        }

        const paymentId = vnp_Params['vnp_TxnRef'];
        const isSuccess = vnp_Params['vnp_ResponseCode'] === "00";

        let result = {};

        await session.withTransaction(async () => {
            const payment = await Payment.findById(paymentId).session(session);

            if (!payment) {
                result = { RspCode: "01", Message: "Order not found" };
            } else if (payment.status === "SUCCESS") {
                result = { RspCode: "00", Message: "Already processed" };
            } else if (isSuccess) {
                const order = await Order.findById(payment.order).session(session);

                if (!order) {
                    result = { RspCode: "01", Message: "Order not found" };
                } else {
                    payment.status = "SUCCESS";
                    payment.paidAt = new Date();

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

                    await payment.save({ session });

                    result = { RspCode: "00", Message: "IPN processed successfully" };
                }
            } else {
                payment.status = "FAILED";

                if (payment.voucherId) {
                    await voucherService.releaseVoucherReservation(payment._id, { session });
                }

                await payment.save({ session });

                result = { RspCode: "00", Message: "Failed handled" };
            }
        });

        console.log("result:", result);
        return result;
    } catch (error) {
        console.error("IPN ERROR:", error);
        return { RspCode: "99", Message: "Unknown error" }   
    } finally {
        session.endSession();
    }
}; 