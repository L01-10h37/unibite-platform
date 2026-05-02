import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { logger } from "../utils/logger.js";
import * as categoryService from "../services/categoryService.js";

export const getAllCategories = async (req, res, next) => {
  try {
    const cats = await categoryService.getAllCategories();
    successResponse(res, cats, "Categories retrieved successfully", 200);
  } catch (error) {
    logger.error("Error fetching categories", error);
    errorResponse(res, error, "Failed to fetch categories", 500);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const data = req.body;
    const cat = await categoryService.createCategory(data);
    successResponse(res, cat, "Category created successfully", 201);
  } catch (error) {
    logger.error("Error creating category", error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, error.message || "Failed to create category", statusCode);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const cat = await categoryService.updateCategory(id, data);
    successResponse(res, cat, "Category updated successfully", 200);
  } catch (error) {
    logger.error("Error updating category", error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, error.message || "Failed to update category", statusCode);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await categoryService.deleteCategory(id);
    successResponse(res, result, "Category deleted successfully", 200);
  } catch (error) {
    logger.error("Error deleting category", error);
    const statusCode = error.statusCode || 500;
    errorResponse(res, error, error.message || "Failed to delete category", statusCode);
  }
};
