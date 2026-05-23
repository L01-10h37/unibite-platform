import { successResponse, paginatedResponse, errorResponse } from "../utils/responseHandler.js";
import { logger } from "../utils/logger.js";
import * as foodService from "../services/foodService.js";

/**
 * Get all foods (no auth required)
 */
export const getAllFood = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const categoryId = req.query.categoryId || null;
    const shopId = req.query.shopId || null;
    const minRating = parseFloat(req.query.minRating) || 0;
    const minPrice = req.query.minPrice != null ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice != null ? parseFloat(req.query.maxPrice) : null;
    const area = req.query.area || "";
    const order = req.query.order || "relevant";

    logger.info(
      `Fetching foods - Page: ${page}, Limit: ${limit}, Search: ${search}, CategoryId: ${categoryId}, ShopId: ${shopId}, MinRating: ${minRating}, MinPrice: ${minPrice}, MaxPrice: ${maxPrice}, Area: ${area}, Order: ${order}`
    );
    const result = await foodService.getAllFood(
      page,
      limit,
      search,
      categoryId,
      shopId,
      minRating,
      order,
      minPrice,
      maxPrice,
      area
    );

    paginatedResponse(
      res,
      result.foods,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      "Foods retrieved successfully",
      200
    );
  } catch (error) {
    logger.error("Error fetching foods", error);
    errorResponse(res, error, "Failed to fetch foods", 500);
  }
};

/**
 * Get food detail by ID (no auth required)
 */
export const getFood = async (req, res, next) => {
  try {
    const foodId = req.params.id;
    logger.info(`Getting food: ${foodId}`);
    const food = await foodService.getFood(foodId);
    successResponse(res, food, "Food retrieved successfully", 200);
  } catch (error) {
    logger.error("Error getting food", error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, error.message || "Failed to get food", statusCode);
  }
};

/**
 * Get seller's own menu
 */
export const getMyMenu = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
      return errorResponse(res, null, "User is required to get my menu", 401);
    }

    logger.info(`Getting my menu for user: ${userId} - Page: ${page}, Limit: ${limit}`);
    const result = await foodService.getMyMenu(userId, page, limit);

    paginatedResponse(
      res,
      result.foods,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      "My menu retrieved successfully",
      200
    );
  } catch (error) {
    logger.error("Error getting my menu", error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, error.message || "Failed to get my menu", statusCode);
  }
};

/**
 * Create food (shop owner only)
 */
export const createFood = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const foodData = {
      ...req.body,
    };

    logger.info(`Creating food for user: ${userId}`);

    if (!userId) {
      return errorResponse(res, null, "User is required to create food", 401);
    }

    const food = await foodService.createFood(userId, foodData);
    successResponse(res, food, "Food created successfully", 201);
  } catch (error) {
    logger.error("Error creating food", error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, error.message || "Failed to create food", statusCode);
  }
};

/**
 * Update food (shop owner only)
 */
export const updateFood = async (req, res, next) => {
  try {
    const foodId = req.params.id;
    const userId = req.user?.id;
    const updateData = req.body;

    logger.info(`Updating food: ${foodId} by user: ${userId}`);

    if (!userId) {
      return errorResponse(res, null, "User is required to update food", 401);
    }

    const food = await foodService.updateFood(foodId, userId, updateData);
    successResponse(res, food, "Food updated successfully", 200);
  } catch (error) {
    logger.error("Error updating food", error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, error.message || "Failed to update food", statusCode);
  }
};

/**
 * Delete food (auth required)
 */
export const deleteFood = async (req, res, next) => {
  try {
    const foodId = req.params.id;
    const userId = req.user?.id;

    logger.info(`Deleting food: ${foodId} by user: ${userId}`);

    if (!userId) {
      return errorResponse(res, null, "User is required to delete food", 401);
    }

    const result = await foodService.deleteFood(foodId, userId);
    successResponse(res, result, "Food deleted successfully", 200);
  } catch (error) {
    logger.error("Error deleting food", error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, error.message || "Failed to delete food", statusCode);
  }
};

/**
 * Upload food images (shop owner only)
 * Cho phép upload nhiều ảnh cùng lúc, lưu trữ URL của các ảnh này trong mảng `listUrlImg` của food.
 */
export const uploadFoodImages = async (req, res, next) => {
  try {
    const foodId = req.params.id;
    const userId = req.user.id;
    const files = req.files; // Multer sẽ lưu thông tin các file đã upload vào `req.files`
    
    if (!files || files.length === 0) {
      return errorResponse(res, null, "At least one image file is required", 400);
    }

    if (files.length > 5) {
      return errorResponse(res, null, "You can upload a maximum of 5 images", 400);
    }

    logger.info(`Uploading images for food: ${foodId} by user: ${userId} - Number of files: ${files.length}`);

    const imageUrls = await foodService.uploadFoodImages(foodId, userId, files);
    successResponse(res, { imageUrls }, "Food images uploaded successfully", 200);
  } catch (error) {
    logger.error("Error uploading food images", error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, error.message || "Failed to upload food images", statusCode);
  }
};

/**
 * Delete food image (shop owner only)
 * Xóa URL của ảnh khỏi mảng `listUrlImg` của food và xóa ảnh khỏi S3.
 */
export const deleteFoodImage = async (req, res, next) => {
  try {
    const foodId = req.params.id;
    const imageUrl = req.body.imageUrl;
    const userId = req.user.id;
    
    if (!imageUrl) {
      return errorResponse(res, null, "Image URL is required", 400);
    }

    logger.info(`Deleting image for food: ${foodId} by user: ${userId} - Image URL: ${imageUrl}`);

    await foodService.deleteFoodImage(foodId, userId, imageUrl);
    successResponse(res, null, "Food image deleted successfully", 200);
  } catch (error) {
    logger.error("Error deleting food image", error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, error.message || "Failed to delete food image", statusCode);
  }
};

export const syncFoodSearchIndex = async (req, res, next) => {
  try {
    const result = await foodService.syncFoodSearchIndex();
    successResponse(res, result, "Food search index synced successfully", 200);
  } catch (error) {
    logger.error("Error syncing food search index", error);
    errorResponse(res, error, "Failed to sync food search index", 500);
  }
};

export const searchFoods = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const minRating = parseFloat(req.query.minRating) || 0;
    const minPrice = req.query.minPrice != null ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice != null ? parseFloat(req.query.maxPrice) : null;
    const area = req.query.area || "";
    const order = req.query.order || "desc";

    const result = await foodService.searchFoods(
      page,
      limit,
      search,
      minRating,
      order,
      minPrice,
      maxPrice,
      area
    );

    paginatedResponse(
      res,
      result.foods,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      "Foods searched successfully",
      200
    );
  } catch (error) {
    logger.error("Error searching foods", error);
    errorResponse(res, error, "Failed to search foods", 500);
  }
};
