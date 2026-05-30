import { successResponse, paginatedResponse, errorResponse } from '../utils/responseHandler.js';
import { logger } from '../utils/logger.js';
import * as orderService from '../services/ordersService.js';

/**
 * Create new order
 */
export const createOrder = async (req, res, next) => {
    try {
        const createOrderData = req.body;

        logger.info('Creating new orders');

        const order = await orderService.createOrder(createOrderData, req.user.id);

        successResponse(res, order, 'Order created successfully', 201);
    } catch (error) {
        logger.error('Error creating order', error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, 'Failed to create order', statusCode);
    }
};

/**
 * Get all orders
 */
export const getMyOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        logger.info('Getting all orders of user with id: ', req.user.id);

        const result = await orderService.getMyOrders(req.user.id, page, limit);

        paginatedResponse(
            res, 
            result.orders, 
            result.pagination.page, 
            result.pagination.limit, 
            result.pagination.total, 
            "Orders retrieved successfully", 
            200
        );
    } catch (error) {
        logger.error('Error getting all orders', error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, 'Failed to get all orders', statusCode);
    }
};

/**
 * Get all orders assigned to current seller
 */
export const getMySellerOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = {
            fromDate: req.query.fromDate || req.query.dateFrom,
            toDate: req.query.toDate || req.query.dateTo,
            status: req.query.status,
        };

        logger.info('Getting all orders of seller with id: ', req.user.id);

        const result = await orderService.getMySellerOrders(
            req.user.id,
            page,
            limit,
            filters
        );

        paginatedResponse(
            res,
            result.orders,
            result.pagination.page,
            result.pagination.limit,
            result.pagination.total,
            "Seller orders retrieved successfully",
            200
        );
    } catch (error) {
        logger.error('Error getting seller orders', error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, 'Failed to get seller orders', statusCode);
    }
};

/**
 * Get order status by id
 */
export const getOrderById = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        logger.info(`User ${req.user.id} is fetching order ${orderId}`);

        const order = await orderService.getOrderById(orderId, req.user.id);

        successResponse(res, order, 'Getting order status successfully', 200);
    } catch (error) {
        logger.error('Error getting order status', error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, 'Failed to get order status', statusCode);
    }
};

/**
 * Update order status (admin only)
 */
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const { orderId } = req.params;

        if (!status || status.trim().length === 0) {
            return errorResponse(res, null, 'Order status is required', 400);
        };

        logger.info(`Updating order status to ${status} for orderId: ${orderId}`);

        const order = await orderService.updateOrderStatus(orderId, status, req.user.id);

        successResponse(res, order, 'Updating order status successfully', 200);
    } catch (error) {
        logger.error('Error updating order status', error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, 'Failed to update order status', statusCode);
    }
};

/**
 * Update order status by seller assigned to the order
 */
export const updateSellerOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const { orderId } = req.params;

        if (!status || status.trim().length === 0) {
            return errorResponse(res, null, 'Order status is required', 400);
        };

        logger.info(`Seller ${req.user.id} updating order status to ${status} for orderId: ${orderId}`);

        const order = await orderService.updateSellerOrderStatus(orderId, status, req.user.id);

        successResponse(res, order, 'Seller updated order status successfully', 200);
    } catch (error) {
        logger.error('Error updating seller order status', error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, 'Failed to update seller order status', statusCode);
    }
};

/**
 * Cancel order by id
 */
export const cancelOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        logger.info(`Canceling order ${orderId}`);

        const order = await orderService.cancelOrder(orderId, req.user.id);
        
        successResponse(res, order, 'Canceling order successfully', 200);
    } catch (error) {
        logger.error('Error canceling order', error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, 'Failed to cancel order', statusCode);
    }
};
