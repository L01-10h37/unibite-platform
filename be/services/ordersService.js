import { logger } from '../utils/logger.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Food from '../models/Food.js';
import * as foodService from './foodService.js';
import * as shopService from './shopService.js';
import Cart from '../models/Cart.js';
import { removeItemFromCart } from './cartService.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Create order
 */
export const createOrder = async (createOrderData, userId) => {
    const session = await mongoose.startSession();

    const createdOrder = [];

    if (!createOrderData.phone || !createOrderData.deliveryAddress) {
        const error = new Error('Not enough credentials');
        error.statusCode = 400;
        throw error;
    };

    try {
        await session.withTransaction(async () => {
            for (const group of createOrderData.groupItems) {
                logger.info('Service: Creating new order', group);

                if (!group.items || group.items.length === 0) {
                    const error = new Error('Order must have at least 1 item');
                    error.statusCode = 400;
                    throw error;
                };

                if (group.items.some((item) => item.quantity < 1)) {
                    const error = new Error('Order must have at least 1 item');
                    error.statusCode = 400;
                    throw error;
                };

                const foods = await Food.find({
                    _id: { $in: group.items.map(i => i.food) }
                }).populate("shop").session(session);

                if (foods.length !== group.items.length) {
                    const error = new Error('Some foods not found');
                    error.statusCode = 404;
                    throw error;
                };

                const shopIds = new Set(foods.map((food) => food.shop?._id?.toString()));
                if (shopIds.size !== 1) {
                    const error = new Error('Order can only contain foods from one shop');
                    error.statusCode = 400;
                    throw error;
                };

                const sellerId = foods[0]?.shop?.userId;
                if (!sellerId) {
                    const error = new Error('Seller not found for this order');
                    error.statusCode = 404;
                    throw error;
                };

                let totalPrice = 0;
                
                const orderItems = group.items.map(item => {
                    const food = foods.find(f => f._id.toString() === item.food.toString());

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

                const [order] = await Order.create([{
                    user: userId,
                    seller: sellerId,
                    items: orderItems,
                    totalPrice,
                    deliveryAddress: createOrderData.deliveryAddress,
                    phone: createOrderData.phone,
                    status: "PENDING",
                    isPaid: false,
                    statusHistory: [
                        {
                            status: "PENDING",
                            updatedAt: new Date(),
                        }
                    ],
                }], {session});

                createdOrder.push(order.getFormattedData?.("basic") || order);

                for (const item of group.items) {
                    await removeItemFromCart(userId, item.id, { session });
                }
            }
        })

        return createdOrder;
    } catch (error) {
        logger.error('Service: Error creating new order', error);
		throw error;
    } finally {
        await session.endSession();
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
 * Get orders assigned to current seller with optional date/status filters
 */
export const getMySellerOrders = async (
    sellerUserId,
    page = 1,
    limit = 10,
    filters = {}
) => {
    try {
        logger.info('Service: Getting seller orders for seller id: ', sellerUserId);

        const skip = (page - 1) * limit;
        const query = { seller: sellerUserId };
        const { fromDate, toDate, status } = filters;

        if (status && status.trim()) {
            const normalizedStatus = status.toUpperCase().trim();
            const validStatuses = [
                "PENDING",
                "CONFIRMED",
                "PREPARING",
                "DELIVERING",
                "COMPLETED",
                "CANCELLED",
            ];

            if (!validStatuses.includes(normalizedStatus)) {
                const error = new Error("Invalid status value");
                error.statusCode = 400;
                throw error;
            }

            query.status = normalizedStatus;
        }

        if (fromDate || toDate) {
            query.createdAt = {};

            if (fromDate) {
                const startDate = new Date(fromDate);

                if (Number.isNaN(startDate.getTime())) {
                    const error = new Error("Invalid fromDate value");
                    error.statusCode = 400;
                    throw error;
                }

                startDate.setHours(0, 0, 0, 0);
                query.createdAt.$gte = startDate;
            }

            if (toDate) {
                const endDate = new Date(toDate);

                if (Number.isNaN(endDate.getTime())) {
                    const error = new Error("Invalid toDate value");
                    error.statusCode = 400;
                    throw error;
                }

                endDate.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDate;
            }
        }

        const [orders, total] = await Promise.all([
            Order.find(query).populate('user', 'username name phone').sort({ createdAt: -1 }).skip(skip).limit(limit),
            Order.countDocuments(query),
        ]);

        return {
            orders: orders.map(o => o.getFormattedData?.("detail") || o),
            pagination: {
                page,
                limit,
                total,
            },
        };
    } catch (error) {
        logger.error('Service: Error getting seller orders', error);
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

        const order = await Order.findById(orderId).populate('user', 'username name phone');

        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        };

        const orderUserId = order.user?._id?.toString?.() || order.user?.toString?.() || String(order.user);
        const orderSellerId = order.seller?._id?.toString?.() || order.seller?.toString?.() || String(order.seller);

        if (orderUserId !== userId && orderSellerId !== userId) {
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

        if (status === "COMPLETED") {
            const firstFood = await Food.findById(order.items[0]?.food).select("shop").lean();

            if (firstFood?.shop) {
                await shopService.incrementShopProfit(firstFood.shop, order.totalPrice);
            }
        }

        return order.getFormattedData?.("detail") || order;
    } catch (error) {
        logger.error('Service: Error updating order status', error);
		throw error;
    }
};

export const updateSellerOrderStatus = async (orderId, newStatus, sellerUserId) => {
    try {
        logger.info(`Service: Seller ${sellerUserId} updating order ${orderId} status to ${newStatus}`);
        const sellerAllowedTransitions = {
            PENDING: ["CONFIRMED", "CANCELLED"],
            CONFIRMED: ["PREPARING", "CANCELLED"],
            PREPARING: ["DELIVERING"],
            DELIVERING: ["COMPLETED"],
            COMPLETED: [],
            CANCELLED: []
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

        if (!order.seller || order.seller.toString() !== sellerUserId.toString()) {
            const error = new Error('You do not have permission to update this order');
            error.statusCode = 403;
            throw error;
        };

        const status = newStatus.toUpperCase().trim();
        if (!Object.values(sellerAllowedTransitions).flat().concat(Object.keys(sellerAllowedTransitions)).includes(status)) {
            const error = new Error("Invalid status value");
            error.statusCode = 400;
            throw error;
        };

        const currentStatus = order.status;
        if (!sellerAllowedTransitions[currentStatus]?.includes(status)) {
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

        if (status === "COMPLETED") {
            const firstFood = await Food.findById(order.items[0]?.food).select("shop").lean();

            await Promise.all(
                order.items.map((item) =>
                    foodService.incrementFoodSoldCount(item.food, item.quantity)
                )
            );

            if (firstFood?.shop) {
                await shopService.incrementShopProfit(firstFood.shop, order.totalPrice);
            }
        }

        return order.getFormattedData?.("detail") || order;
    } catch (error) {
        logger.error('Service: Error updating seller order status', error);
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

        const isBuyer = order.user.toString() === userId;
        const isSeller = order.seller.toString() === userId;

        if (!isBuyer && !isSeller) {
            const error = new Error('Not your order');
            error.statusCode = 403;
            throw error;
        };

        if (order.status === "CANCELLED") {
            return order.getFormattedData?.("detail") || order;
        }

        const cancellableStatuses = isBuyer ? ["PENDING"] : ["PENDING", "CONFIRMED"];

        if (!cancellableStatuses.includes(order.status)) {
            const error = new Error(
                isBuyer
                    ? "Order can only be cancelled before seller confirmation"
                    : "Order cannot be cancelled at this stage"
            );
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
