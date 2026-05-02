import { logger } from "../utils/logger.js";
import Food from "../models/Food.js";
import Shop from "../models/Shop.js";

/**
 * Get all foods with pagination
 */
export const getAllFood = async (page = 1, limit = 10) => {
  try {
    logger.info("Service: Getting all foods");
    const skip = (page - 1) * limit;

    const foods = await Food.find({ isDraft: false })
      .populate("category")
      .populate("shop")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Food.countDocuments({ isDraft: false });

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
 * Create new food (shop owner)
 */
export const createFood = async (userId, foodData) => {
  try {
    logger.info("Service: Creating new food", foodData);

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
