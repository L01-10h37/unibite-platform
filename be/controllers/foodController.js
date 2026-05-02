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

    logger.info(`Fetching foods - Page: ${page}, Limit: ${limit}`);
    const result = await foodService.getAllFood(page, limit);

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
