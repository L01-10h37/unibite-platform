import { successResponse, paginatedResponse, errorResponse } from "../utils/responseHandler.js";
import { logger } from "../utils/logger.js";
import * as shopService from "../services/shopService.js";

/**
 * Get all shops
 */
export const getAllShops = async (req, res, next) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;

		logger.info(`Fetching shops - Page: ${page}, Limit: ${limit}`);
		const result = await shopService.getAllShops(page, limit);

		paginatedResponse(
			res,
			result.shops,
			result.pagination.page,
			result.pagination.limit,
			result.pagination.total,
			"Shops retrieved successfully",
			200
		);
	} catch (error) {
		logger.error("Error fetching shops", error);
		errorResponse(res, error, "Failed to fetch shops", 500);
	}
};

/**
 * Get shop by id
 */
export const getShopById = async (req, res, next) => {
    try {
        const shopId = req.params.id;
        logger.info(`Getting shop: ${shopId}`);
        const shop = await shopService.getShopById(shopId);
        successResponse(res, shop, "Shop retrieved successfully", 200);
    } catch (error) {
        logger.error("Error getting shop", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to get shop", statusCode);
    }
};

/**
 * Create shop
 */
export const createShop = async (req, res, next) => {
    try {
        const shopData = {
            ...req.body,
            userId: req.user?.id,
        };
        logger.info(`Creating shop for user: ${shopData.userId}`);
        if (!shopData.userId) {
            return errorResponse(res, null, "User is required to create shop", 401);
        }
        const shop = await shopService.createShop(shopData);
        successResponse(res, shop, "Shop created successfully", 201);
    } catch (error) {
        logger.error("Error creating shop", error);
        errorResponse(res, error, "Failed to create shop", 500);
    }
};

/**
 * Update shop
 */
export const updateShop = async (req, res, next) => {
    try {
        const shopId = req.params.id;
        const userId = req.user?.id;
        const updateData = req.body;

        logger.info(`Updating shop: ${shopId} by user: ${userId}`);

        if (!userId) {
            return errorResponse(res, null, "User is required to update shop", 401);
        }

        const shop = await shopService.updateShop(shopId, userId, updateData);
        successResponse(res, shop, "Shop updated successfully", 200);
    } catch (error) {
        logger.error("Error updating shop", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to update shop", statusCode);
    }
};
