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
		const search = req.query.search || "";
		const minRating = parseFloat(req.query.minRating) || 0;
		const order = req.query.order || "desc";

		logger.info(`Fetching shops - Page: ${page}, Limit: ${limit}, Search: ${search}, MinRating: ${minRating}, Order: ${order}`);
		const result = await shopService.getAllShops(page, limit, search, minRating, order);

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
 * Get my shop
 */
export const getMyShop = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return errorResponse(res, null, "User is required to get my shop", 401);
        }

        logger.info(`Getting shop for user: ${userId}`);
        const shop = await shopService.getShopByUserId(userId);
        successResponse(res, shop, "My shop retrieved successfully", 200);
    } catch (error) {
        logger.error("Error getting my shop", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to get my shop", statusCode);
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

/**
 * Sync current seller shop profit
 */
export const syncMyShopProfit = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return errorResponse(res, null, "User is required to sync shop profit", 401);
        }

        const shop = await shopService.getShopByUserId(userId);
        const syncedShop = await shopService.syncShopProfit(shop.id);

        successResponse(res, syncedShop, "Shop profit synced successfully", 200);
    } catch (error) {
        logger.error("Error syncing shop profit", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to sync shop profit", statusCode);
    }
};

/**
 * Sync any shop profit by shopId (admin only)
 */
export const syncShopProfitById = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { shopId } = req.params;

        if (!userId) {
            return errorResponse(res, null, "User is required to sync shop profit", 401);
        }

        if (!shopId) {
            return errorResponse(res, null, "shopId is required to sync shop profit", 400);
        }

        const syncedShop = await shopService.syncShopProfit(shopId);

        successResponse(res, syncedShop, "Shop profit synced successfully", 200);
    } catch (error) {
        logger.error("Error syncing shop profit by shopId", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to sync shop profit", statusCode);
    }
};

/**
 * Sync any shop rating by shopId (admin only)
 */
export const syncShopRatingById = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { shopId } = req.params;

        if (!userId) {
            return errorResponse(res, null, "User is required to sync shop rating", 401);
        }

        if (!shopId) {
            return errorResponse(res, null, "shopId is required to sync shop rating", 400);
        }

        const syncedShop = await shopService.syncShopRating(shopId);

        successResponse(res, syncedShop, "Shop rating synced successfully", 200);
    } catch (error) {
        logger.error("Error syncing shop rating by shopId", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to sync shop rating", statusCode);
    }
};

/**
 * Sync any shop average rating by shopId (admin only)
 */
export const syncShopAverageRatingById = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { shopId } = req.params;

        if (!userId) {
            return errorResponse(res, null, "User is required to sync shop average rating", 401);
        }

        if (!shopId) {
            return errorResponse(res, null, "shopId is required to sync shop average rating", 400);
        }

        const syncedShop = await shopService.syncShopAverageRating(shopId);

        successResponse(res, syncedShop, "Shop average rating synced successfully", 200);
    } catch (error) {
        logger.error("Error syncing shop average rating by shopId", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to sync shop average rating", statusCode);
    }
};

/**
 * Sync any shop rating count by shopId (admin only)
 */
export const syncShopRatingCountById = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { shopId } = req.params;

        if (!userId) {
            return errorResponse(res, null, "User is required to sync shop rating count", 401);
        }

        if (!shopId) {
            return errorResponse(res, null, "shopId is required to sync shop rating count", 400);
        }

        const syncedShop = await shopService.syncShopRatingCount(shopId);

        successResponse(res, syncedShop, "Shop rating count synced successfully", 200);
    } catch (error) {
        logger.error("Error syncing shop rating count by shopId", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to sync shop rating count", statusCode);
    }
};

/**
 * Sync current seller shop rating
 */
export const syncMyShopRating = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return errorResponse(res, null, "User is required to sync shop rating", 401);
        }

        const shop = await shopService.getShopByUserId(userId);
        const syncedShop = await shopService.syncShopRating(shop.id);

        successResponse(res, syncedShop, "Shop rating synced successfully", 200);
    } catch (error) {
        logger.error("Error syncing shop rating", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to sync shop rating", statusCode);
    }
};

/**
 * Sync current seller shop average rating
 */
export const syncMyShopAverageRating = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return errorResponse(res, null, "User is required to sync shop average rating", 401);
        }

        const shop = await shopService.getShopByUserId(userId);
        const syncedShop = await shopService.syncShopAverageRating(shop.id);

        successResponse(res, syncedShop, "Shop average rating synced successfully", 200);
    } catch (error) {
        logger.error("Error syncing shop average rating", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to sync shop average rating", statusCode);
    }
};

/**
 * Sync current seller shop rating count
 */
export const syncMyShopRatingCount = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return errorResponse(res, null, "User is required to sync shop rating count", 401);
        }

        const shop = await shopService.getShopByUserId(userId);
        const syncedShop = await shopService.syncShopRatingCount(shop.id);

        successResponse(res, syncedShop, "Shop rating count synced successfully", 200);
    } catch (error) {
        logger.error("Error syncing shop rating count", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to sync shop rating count", statusCode);
    }
};

/**
 * Update shop avatar
 */
export const updateShopAvatar = async (req, res, next) => {
    try {
        const shopId = req.params.id;
        const userId = req.user.id;
        const file = req.file;
        logger.info(`Updating shop avatar: ${shopId} by user: ${userId}`);

        if (!file) {
            return errorResponse(res, null, "Avatar file is required", 400);
        }

        const avatarUrl = await shopService.updateShopAvatar(shopId, userId, file);
        successResponse(res, { avatar: avatarUrl }, "Shop avatar updated successfully", 200);
    } catch (error) {
        logger.error("Error updating shop avatar", error);
        const statusCode = error.statusCode || 500;
        errorResponse(res, error, error.message || "Failed to update shop avatar", statusCode);
    }
};
