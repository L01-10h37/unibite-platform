import { logger } from '../utils/logger.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Food from '../models/Food.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Create order
 */
export const createOrder = async (orderData, userId) => {
    try {
        logger.info('Service: Creating new order', orderData);

        if (!orderData.phone || !orderData.deliveryAddress) {
            const error = new Error('Not enough credentials');
            error.statusCode = 400;
            throw error;
        };

        if (!orderData.items || orderData.items.length === 0) {
            const error = new Error('Order must have at least 1 item');
            error.statusCode = 400;
            throw error;
        };

        if (orderData.items.some((item) => item.quantity < 1)) {
            const error = new Error('Order must have at least 1 item');
            error.statusCode = 400;
            throw error;
        };

        const foods = await Food.find({
            _id: { $in: orderData.items.map(i => i.food) }
        });

        if (foods.length !== orderData.items.length) {
            const error = new Error('Some foods not found');
            error.statusCode = 404;
            throw error;
        };

        let totalPrice = 0;
        
        const orderItems = orderData.items.map(item => {
            const food = foods.find(f => f._id.toString() === item.food);

            if (!food) {
                const error = new Error('Food not found');
                error.statusCode = 404;
                throw error;    
            }

            totalPrice += food.price * item.quantity;

            return {
                food: food._id,
                name: food.name,
                price: food.price,
                quantity: item.quantity,
            };
        });

        const order = await Order.create({
            user: userId,
            items: orderItems,
            totalPrice,
            deliveryAddress: orderData.deliveryAddress,
            phone: orderData.phone,
            status: "PENDING",
            isPaid: false,
            statusHistory: [
                {
                    status: "PENDING",
                    updatedAt: new Date(),
                }
            ],
        });

        return order.getFormattedData?.("basic") || order;
    } catch (error) {
        logger.error('Service: Error creating new order', error);
		throw error;
    }
};

/**
 * Get all orders
 */
export const getMyOrders = async (userId, page = 1, limit = 10) => {
    try {
        logger.info('Service: Getting all orders of user with id: ', userId);

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find({user: userId}).sort({createdAt: -1}).skip(skip).limit(limit), 
            Order.countDocuments({user: userId})
        ]);

        return {
            orders: orders.map(o => o.getFormattedData?.("basic") || o),
            pagination: {
                page,
                limit,
                total,
            },
        };
    } catch (error) {
        logger.error('Service: Error getting all orders', error);
		throw error;
    }
};

/**
 * Get order status by id
 */
export const getOrderById = async (orderId, userId) => {
    try {
        logger.info(`Service: Fetching order ${orderId} for user ${userId}`);

        if (!isValidObjectId(orderId)) {
            const error = new Error('Invalid orderId format');
            error.statusCode = 400;
            throw error;
        };

        const order = await Order.findById(orderId);

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

        // const payment = await Payment.findOne({ order: orderId }); nào có bảng payment thì thêm vào
        return order.getFormattedData?.("detail") || order;
    } catch (error) {
        logger.error('Service: Error getting order status', error);
		throw error;
    }
};

export const updateOrderStatus = async (orderId, newStatus, userId) => {
    try {
        logger.info(`Service: Updating order status to ${newStatus} for orderId: ${orderId}`);

        const user = await User.findById(userId).select("role -_id").lean();
        if (user.role !== "admin") {
            const error = new Error('Forbidden');
            error.statusCode = 403;
            throw error;
        };

        if (!isValidObjectId(orderId)) {
            const error = new Error('Invalid orderId format');
            error.statusCode = 400;
            throw error;
        };

        const order = await Order.findById(orderId);

        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        };

        const status = newStatus.toUpperCase().trim();

        const allowedTransitions = {
            PENDING: ["CONFIRMED", "CANCELLED"],
            CONFIRMED: ["PREPARING", "CANCELLED"],
            PREPARING: ["DELIVERING"],
            DELIVERING: ["COMPLETED"],
            COMPLETED: [],
            CANCELLED: []
        };

        if (!Object.values(allowedTransitions).flat().concat(Object.keys(allowedTransitions)).includes(status)) {
            const error = new Error("Invalid status value");
            error.statusCode = 400;
            throw error;
        };

        const currentStatus = order.status;

        if (!allowedTransitions[currentStatus]?.includes(status)) {
            const error = new Error("Invalid status transition");
            error.statusCode = 400;
            throw error;
        };

        order.status = status;
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
            status,
            updatedAt: new Date(),
        });

        await order.save();

        return order.getFormattedData?.("detail") || order;
    } catch (error) {
        logger.error('Service: Error updating order status', error);
		throw error;
    }
};

export const cancelOrder = async (orderId, userId) => {
    try {
        logger.info(`Service: Canceling order ${orderId}`);    

        if (!isValidObjectId(orderId)) {
            const error = new Error('Invalid orderId format');
            error.statusCode = 400;
            throw error;
        };

        const order = await Order.findById(orderId);

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

        if (order.status === "CANCELLED") {
            return order.getFormattedData?.("detail") || order;
        }

        const cancellableStatuses = ["PENDING", "CONFIRMED"];

        if (!cancellableStatuses.includes(order.status)) {
            const error = new Error("Order cannot be cancelled at this stage");
            error.statusCode = 400;
            throw error;
        }

        order.status = "CANCELLED";
        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
            status: "CANCELLED",
            updatedAt: new Date(),
        });

        await order.save();

        return order.getFormattedData?.("detail") || order;
    } catch (error) {
        logger.error('Service: Error canceling order status', error);
		throw error;
    }
};