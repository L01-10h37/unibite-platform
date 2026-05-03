import { logger } from "../utils/logger.js";
import Shop from "../models/Shop.js";

/**
 * Get shop by id
 */
export const getShopById = async (shopId) => {
    try {
        logger.info(`Service: Getting shop by id: ${shopId}`);

        const shop = await Shop.findById(shopId);

        if (!shop) {
            const error = new Error("Shop not found");
            error.statusCode = 404;
            throw error;
        }

        return shop.getFormattedData?.() || shop;
    } catch (error) {
        logger.error("Service: Error getting shop by id", error);
        throw error;
    }
};

/**
 * Get shop by owner user id
 */
export const getShopByUserId = async (userId) => {
    try {
        logger.info(`Service: Getting shop by user id: ${userId}`);

        const shop = await Shop.findOne({ userId });

        if (!shop) {
            const error = new Error("Shop not found");
            error.statusCode = 404;
            throw error;
        }

        return shop.getFormattedData?.() || shop;
    } catch (error) {
        logger.error("Service: Error getting shop by user id", error);
        throw error;
    }
};

/**
 * Get all shops with optional search, filter, and rating sort
 */
export const getAllShops = async (page = 1, limit = 10, search = "", minRating = 0, order = "desc") => {
    try {
        logger.info(`Service: Getting all shops - search: ${search}, minRating: ${minRating}, order: ${order}`);
        
        const query = {};
        
        // Search by shop name (case-insensitive)
        if (search && search.trim()) {
            query.name = { $regex: search.trim(), $options: "i" };
        }
        
        // Filter by minimum rating
        if (minRating > 0) {
            query.average_rating = { $gte: minRating };
        }
        
        const skip = (page - 1) * limit;
        
        // Sort by rating: desc (high to low, default) or asc (low to high)
        const ratingSort = order === "asc" ? 1 : -1;
        const sortOrder = { average_rating: ratingSort, createdAt: -1 };

        const shops = await Shop.find(query)
            .skip(skip)
            .limit(limit)
            .sort(sortOrder);

        const total = await Shop.countDocuments(query);

        return {
            shops: shops.map((shop) => shop.getFormattedData?.() || shop),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        logger.error("Service: Error getting all shops", error);
        throw error;
    }
};

/**
 * Create new shop
 */
export const createShop = async (shopData) => {
    try {
        logger.info("Service: Creating new shop", shopData);

        const allowedShopData = {
            name: shopData.name,
            avatar: shopData.avatar,
            address: shopData.address,
            about: shopData.about,
            userId: shopData.userId,
        };

        const existingShop = await Shop.findOne({ userId: shopData.userId });

        if (existingShop) {
            const error = new Error("Each user can only create one shop");
            error.statusCode = 409;
            throw error;
        }

        const newShop = await Shop.create(allowedShopData);
        return newShop.getFormattedData?.() || newShop;
    } catch (error) {
        logger.error("Service: Error creating shop", error);
        throw error;
    }
};

/**
 * Update shop
 */
export const updateShop = async (shopId, userId, updateData) => {
    try {
        logger.info(`Service: Updating shop ${shopId}`);

        const allowedUpdateData = {};

        if (updateData.name !== undefined) {
            allowedUpdateData.name = updateData.name;
        }

        if (updateData.avatar !== undefined) {
            allowedUpdateData.avatar = updateData.avatar;
        }

        if (updateData.address !== undefined) {
            allowedUpdateData.address = updateData.address;
        }

        if (updateData.about !== undefined) {
            allowedUpdateData.about = updateData.about;
        }

        const shop = await Shop.findById(shopId);

        if (!shop) {
            const error = new Error("Shop not found");
            error.statusCode = 404;
            throw error;
        }

        // Kiểm tra xem user có phải là chủ shop không
        if (shop.userId.toString() !== userId.toString()) {
            const error = new Error("You do not have permission to update this shop");
            error.statusCode = 403;
            throw error;
        }

        const updatedShop = await Shop.findByIdAndUpdate(
            shopId,
            { $set: allowedUpdateData },
            { new: true, runValidators: true }
        );

        return updatedShop.getFormattedData?.() || updatedShop;
    } catch (error) {
        logger.error("Service: Error updating shop", error);
        throw error;
    }
};
