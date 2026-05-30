import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { logger } from "../utils/logger.js";
import * as cartService from "../services/cartService.js";

export const getCart = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const result = await cartService.getCartByUserId(userId);

        successResponse(res, result.data, result.message, 200);
    } catch (error) {
        logger.error("Error fetching cart", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to fetch cart", statusCode);
    }
};

export const addItemToCart = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { foodId, quantity } = req.body;    

        const result = await cartService.addItemToCart(userId, foodId, quantity);

        successResponse(res, result.data, result.message, 200);
    } catch (error) {
        logger.error("Error adding item to cart", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to add item to cart", statusCode);
    }
};

export const removeItemFromCart = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const itemId = req.params.id;

        const result = await cartService.removeItemFromCart(userId, itemId);

        successResponse(res, result.data, result.message, 200);
    } catch (error) {
        logger.error("Error removing item from cart", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to remove item from cart", statusCode);
    }   
};

export const updateCart = async (req, res, next) => {
    try {
        const cartId = req.params.id;
        const { items } = req.body;

        const result = await cartService.updateCart(cartId, items);

        successResponse(res, result.data, result.message, 200);
    } catch (error) {
        logger.error("Error updating cart", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to update cart", statusCode);
    }
};