import { logger } from "../utils/logger.js";
import mongoose from "mongoose";
import Shop from "../models/Shop.js";
import Food from "../models/Food.js";
import Comment from "../models/Comment.js";
import Order from "../models/Order.js";
import * as foodSearchService from "./foodSearchService.js";
import { uploadAvatarToS3, deleteAvatarFromS3, validateImageFile, validateFileSize } from '../utils/s3Upload.js';

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
            openingHours: shopData.openingHours,
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
 * Không cho phép cập nhật avatar trong hàm này, vì avatar cần xử lý riêng với upload lên S3.
 * Nếu muốn cập nhật avatar, nên gọi hàm uploadAvatarToS3 trước để lấy URL mới và sau đó cập nhật shop với URL đó.
 */
export const updateShop = async (shopId, userId, updateData) => {
    try {
        logger.info(`Service: Updating shop ${shopId}`);

        const allowedUpdateData = {};

        if (updateData.name !== undefined) {
            allowedUpdateData.name = updateData.name;
        }

        if (updateData.address !== undefined) {
            allowedUpdateData.address = updateData.address;
        }

        if (updateData.openingHours !== undefined) {
            allowedUpdateData.openingHours = updateData.openingHours;
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

/**
 * Increment shop profit by amount.
 */
export const incrementShopProfit = async (shopId, amount) => {
    try {
        logger.info(`Service: Incrementing shop ${shopId} profit by ${amount}`);

        const increment = Number(amount);

        if (!Number.isFinite(increment) || increment <= 0) {
            const error = new Error("Profit increment amount must be a positive number");
            error.statusCode = 400;
            throw error;
        }

        const updatedShop = await Shop.findByIdAndUpdate(
            shopId,
            { $inc: { profit: increment } },
            { new: true, runValidators: true }
        );

        if (!updatedShop) {
            const error = new Error("Shop not found");
            error.statusCode = 404;
            throw error;
        }

        return updatedShop.getFormattedData?.() || updatedShop;
    } catch (error) {
        logger.error("Service: Error incrementing shop profit", error);
        throw error;
    }
};

/**
 * Update shop rating when a new rating is added.
 */
export const updateShopRatingFromComment = async (shopId, rating, session = null) => {
    try {
        logger.info(`Service: Updating shop ${shopId} rating with ${rating}`);

        const ratingValue = Number(rating);

        if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            const error = new Error("Rating must be a number from 1 to 5");
            error.statusCode = 400;
            throw error;
        }

        const updatedShop = await Shop.findByIdAndUpdate(
            shopId,
            [
                {
                    $set: {
                        average_rating: {
                            $divide: [
                                {
                                    $add: [
                                        { $multiply: ["$average_rating", "$rating_count"] },
                                        ratingValue,
                                    ],
                                },
                                { $add: ["$rating_count", 1] },
                            ],
                        },
                        rating_count: { $add: ["$rating_count", 1] },
                    },
                },
            ],
            { new: true, session }
        );

        if (!updatedShop) {
            const error = new Error("Shop not found");
            error.statusCode = 404;
            throw error;
        }

        return updatedShop.getFormattedData?.() || updatedShop;
    } catch (error) {
        logger.error("Service: Error updating shop rating", error);
        throw error;
    }
};

/**
 * Sync shop profit from completed orders.
 */
export const syncShopProfit = async (shopId) => {
    try {
        logger.info(`Service: Syncing profit for shop ${shopId}`);

        const shop = await Shop.findById(shopId);

        if (!shop) {
            const error = new Error("Shop not found");
            error.statusCode = 404;
            throw error;
        }

        const result = await Order.aggregate([
            {
                $match: {
                    seller: shop.userId,
                    status: "COMPLETED",
                },
            },
            {
                $group: {
                    _id: null,
                    profit: { $sum: "$totalPrice" },
                },
            },
        ]);

        shop.profit = result[0]?.profit || 0;
        const updatedShop = await shop.save();

        return updatedShop.getFormattedData?.() || updatedShop;
    } catch (error) {
        logger.error("Service: Error syncing shop profit", error);
        throw error;
    }
};

/**
 * Sync rating for all foods in a shop, then sync the shop rating from those foods.
 */
export const syncShopRating = async (shopId) => {
    const session = await mongoose.startSession();
    let syncedShop;
    let foodsToIndex = [];

    try {
        logger.info(`Service: Syncing rating for shop ${shopId}`);

        await session.withTransaction(async () => {
            const shop = await Shop.findById(shopId).session(session);

            if (!shop) {
                const error = new Error("Shop not found");
                error.statusCode = 404;
                throw error;
            }

            const foods = await Food.find({ shop: shop._id })
                .select("_id")
                .session(session);
            const foodIds = foods.map((food) => food._id);

            const ratingStats = foodIds.length
                ? await Comment.aggregate([
                    {
                        $match: {
                            postId: { $in: foodIds },
                            isDeleted: false,
                        },
                    },
                    {
                        $group: {
                            _id: "$postId",
                            average_rating: { $avg: "$rating" },
                            rating_count: { $sum: 1 },
                        },
                    },
                ]).session(session)
                : [];

            const statsByFoodId = new Map(
                ratingStats.map((stat) => [
                    stat._id.toString(),
                    {
                        average_rating: stat.average_rating || 0,
                        rating_count: stat.rating_count || 0,
                    },
                ])
            );

            if (foodIds.length) {
                await Food.bulkWrite(
                    foodIds.map((foodId) => {
                        const stats = statsByFoodId.get(foodId.toString()) || {
                            average_rating: 0,
                            rating_count: 0,
                        };

                        return {
                            updateOne: {
                                filter: { _id: foodId },
                                update: {
                                    $set: {
                                        average_rating: stats.average_rating,
                                        rating_count: stats.rating_count,
                                    },
                                },
                            },
                        };
                    }),
                    { session }
                );
            }

            const totalRatingCount = ratingStats.reduce(
                (total, stat) => total + (stat.rating_count || 0),
                0
            );
            const totalRatingScore = ratingStats.reduce(
                (total, stat) => total + ((stat.average_rating || 0) * (stat.rating_count || 0)),
                0
            );

            const updatedShop = await Shop.findByIdAndUpdate(
                shop._id,
                {
                    $set: {
                        average_rating: totalRatingCount ? totalRatingScore / totalRatingCount : 0,
                        rating_count: totalRatingCount,
                    },
                },
                { new: true, runValidators: true, session }
            );

            syncedShop = updatedShop.getFormattedData?.() || updatedShop;
        });

        foodsToIndex = await Food.find({ shop: shopId })
            .populate("category")
            .populate("shop");

        await Promise.all(
            foodsToIndex.map((food) => foodSearchService.safeIndexFoodSearchDocument(food, logger))
        );

        return syncedShop;
    } catch (error) {
        logger.error("Service: Error syncing shop rating", error);
        throw error;
    } finally {
        session.endSession();
    }
};

export const syncShopAverageRating = async (shopId) => syncShopRating(shopId);

export const syncShopRatingCount = async (shopId) => syncShopRating(shopId);

/**
 * Update shop avatar
 */
export const updateShopAvatar = async (shopId, userId, file) => {
    try {
        logger.info(`Service: Updating shop avatar ${shopId}`);

        // Validate file type (chỉ cho phép file ảnh)
        if (!validateImageFile(file.mimetype)) {
            const error = new Error("Invalid file type. Only image files are allowed.");
            error.statusCode = 400;
            throw error;
        }

        // Validate file size (giới hạn 5MB)
        if (!validateFileSize(file.size)) {
            const error = new Error("File size exceeds the limit of 5MB.");
            error.statusCode = 400;
            throw error;
        }
        
        // Kiểm tra xem shop có tồn tại không
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

        // Xóa avatar cũ trên S3 nếu có
        if (shop.avatar) {
            await deleteAvatarFromS3(shop.avatar);
        }

        // Upload file lên S3 và lấy URL mới
        const avatarUrl = await uploadAvatarToS3(file.buffer, file.originalname);

        // Cập nhật URL avatar mới vào shop
        shop.avatar = avatarUrl;
        const updatedShop = await shop.save();

        return avatarUrl;
    } catch (error) {
        logger.error("Service: Error updating shop avatar", error);
        throw error;
    }
}; 
