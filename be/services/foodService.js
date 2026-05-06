import { logger } from "../utils/logger.js";
import Food from "../models/Food.js";
import Shop from "../models/Shop.js";
import Category from "../models/Category.js";
import * as categoryService from "./categoryService.js";
import { uploadAvatarToS3, deleteAvatarFromS3, validateImageFile, validateFileSize } from '../utils/s3Upload.js';

/**
 * Get all foods with search, category filter, shop filter, rating filter, and sorting
 */
export const getAllFood = async (
  page = 1,
  limit = 10,
  search = "",
  categoryId = null,
  shopId = null,
  minRating = 0,
  order = "desc"
) => {
  try {
    logger.info(
      `Service: Getting all foods - search: ${search}, categoryId: ${categoryId}, shopId: ${shopId}, minRating: ${minRating}, order: ${order}`
    );
    const skip = (page - 1) * limit;

    const query = { isDraft: false };

    // Search by food name (case-insensitive)
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    // Filter by shop
    if (shopId) {
      query.shop = shopId;
    }

    // Filter by category and its descendants
    if (categoryId) {
      try {
        const deepChildren = await categoryService.getDeepChild(categoryId);
        const categoryIds = [categoryId, ...deepChildren.map((cat) => cat.id)];
        query.category = { $in: categoryIds };
      } catch (error) {
        logger.warn(`Service: Error getting deep children for category ${categoryId}`, error);
        query.category = categoryId;
      }
    }

    // Filter by minimum rating
    if (minRating > 0) {
      query.average_rating = { $gte: minRating };
    }

    // Sort by rating: desc (high to low, default) or asc (low to high)
    const ratingSort = order === "asc" ? 1 : -1;
    const sortOrder = { average_rating: ratingSort, createdAt: -1 };

    const foods = await Food.find(query)
      .populate("category")
      .populate("shop")
      .skip(skip)
      .limit(limit)
      .sort(sortOrder);

    const total = await Food.countDocuments(query);

    return {
      foods: foods.map((food) => food.getFormattedData?.() || food),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Service: Error getting all foods", error);
    throw error;
  }
};

/**
 * Get food by ID
 */
export const getFood = async (foodId) => {
  try {
    logger.info(`Service: Getting food by id: ${foodId}`);

    const food = await Food.findById(foodId)
      .populate("category")
      .populate("shop");

    if (!food) {
      const error = new Error("Food not found");
      error.statusCode = 404;
      throw error;
    }

    return food.getFormattedData?.() || food;
  } catch (error) {
    logger.error("Service: Error getting food by id", error);
    throw error;
  }
};

/**
 * Get current seller's menu
 */
export const getMyMenu = async (userId, page = 1, limit = 10) => {
  try {
    logger.info(`Service: Getting my menu for user ${userId}`);

    const shop = await Shop.findOne({ userId });
    if (!shop) {
      const error = new Error("Shop not found");
      error.statusCode = 404;
      throw error;
    }

    const skip = (page - 1) * limit;

    const foods = await Food.find({ shop: shop._id })
      .populate("category")
      .populate("shop")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Food.countDocuments({ shop: shop._id });

    return {
      foods: foods.map((food) => food.getFormattedData?.() || food),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Service: Error getting my menu", error);
    throw error;
  }
};

/**
 * Create new food (shop owner)
 */
export const createFood = async (userId, foodData) => {
  try {
    logger.info("Service: Creating new food", foodData);

    const category = await Category.findById(foodData.category);
    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    // Find shop owned by this user
    const shop = await Shop.findOne({ userId });
    if (!shop) {
      const error = new Error("You do not have a shop. Please create a shop first");
      error.statusCode = 400;
      throw error;
    }

    // Add shop to food data
    const newFoodData = {
      ...foodData,
      shop: shop._id,
    };

    const newFood = await Food.create(newFoodData);
    await newFood.populate(["category", "shop"]);

    return newFood.getFormattedData?.() || newFood;
  } catch (error) {
    logger.error("Service: Error creating food", error);
    throw error;
  }
};

/**
 * Update food (shop owner only)
 */
export const updateFood = async (foodId, userId, updateData) => {
  try {
    logger.info(`Service: Updating food ${foodId}`);

    if (updateData.category) {
      const category = await Category.findById(updateData.category);
      if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
      }
    }

    const food = await Food.findById(foodId).populate("shop");

    if (!food) {
      const error = new Error("Food not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if user owns the shop
    if (food.shop.userId.toString() !== userId.toString()) {
      const error = new Error("You do not have permission to update this food");
      error.statusCode = 403;
      throw error;
    }

    // Prevent immutable fields from being updated
    if (updateData.shop) {
      const error = new Error("Cannot change the shop for this food");
      error.statusCode = 400;
      throw error;
    }
    if (updateData.average_rating || updateData.rating_count) {
      const error = new Error("Cannot change rating fields");
      error.statusCode = 400;
      throw error;
    }
    if (updateData.sold_count) {
      const error = new Error("Cannot change sold count");
      error.statusCode = 400;
      throw error;
    }

    const updatedFood = await Food.findByIdAndUpdate(
      foodId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate(["category", "shop"]);

    return updatedFood.getFormattedData?.() || updatedFood;
  } catch (error) {
    logger.error("Service: Error updating food", error);
    throw error;
  }
};

/**
 * Delete food (auth required)
 */
export const deleteFood = async (foodId, userId) => {
  try {
    logger.info(`Service: Deleting food ${foodId}`);

    const food = await Food.findById(foodId).populate("shop");

    if (!food) {
      const error = new Error("Food not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if user owns the shop
    if (food.shop.userId.toString() !== userId.toString()) {
      const error = new Error("You do not have permission to delete this food");
      error.statusCode = 403;
      throw error;
    }

    await Food.findByIdAndDelete(foodId);
    return { id: foodId };
  } catch (error) {
    logger.error("Service: Error deleting food", error);
    throw error;
  }
};

/**
 * Upload food images (shop owner only)
 */
export const uploadFoodImages = async (foodId, userId, files) => {
  try {
    logger.info(`Service: Uploading images for food ${foodId}`);

    // Validate files
    for (const file of files) {
      if (!validateImageFile(file.mimetype)) {
        const error = new Error("Invalid file type. Only image files are allowed.");
        error.statusCode = 400;
        throw error;
      }
      if (!validateFileSize(file.size)) {
        const error = new Error("File size exceeds the limit of 5MB.");
        error.statusCode = 400;
        throw error;
      }
    }

    // Kiểm tra xem food có tồn tại không và lấy thông tin shop
    const food = await Food.findById(foodId).populate("shop");
    if (!food) {
      const error = new Error("Food not found");
      error.statusCode = 404;
      throw error;
    }

    // Kiểm tra xem user có phải là chủ shop không
    if (food.shop.userId.toString() !== userId.toString()) {
      const error = new Error("You do not have permission to upload images for this food");
      error.statusCode = 403;
      throw error;
    }

    // Tải tất cả ảnh lên S3 và lấy URL của chúng
    const uploadPromises = files.map((file) => uploadAvatarToS3(file.buffer, file.originalname));
    const imageUrls = await Promise.all(uploadPromises);

    // Thêm URL của các ảnh mới vào mảng listUrlImg của food
    food.listUrlImg = [...(food.listUrlImg || []), ...imageUrls];
    await food.save();

    return imageUrls;
  } catch (error) {
    logger.error("Service: Error uploading food images", error);
    throw error;
  }
};