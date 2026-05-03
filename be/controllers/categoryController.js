import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { logger } from "../utils/logger.js";
import * as categoryService from "../services/categoryService.js";

export const getRoot = async (req, res, next) => {
  try {
    const cats = await categoryService.getRoot();
    successResponse(res, cats, "Root categories retrieved successfully", 200);
  } catch (error) {
    logger.error("Error fetching root categories", error);
    errorResponse(res, error, "Failed to fetch root categories", 500);
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

export const getAllCategoriesHierarchy = async (req, res, next) => {
  try {
    const hierarchy = await categoryService.getAllCategoriesHierarchy();
    successResponse(res, hierarchy, "Categories hierarchy retrieved successfully", 200);
  } catch (error) {
    logger.error("Error fetching categories hierarchy", error);
    errorResponse(res, error, "Failed to fetch categories hierarchy", 500);
  }
};

export const getChildCategories = async (req, res, next) => {
  try {
    const parentId = req.params.id;
    const children = await categoryService.getDeepChild(parentId);
    successResponse(res, children, "Child categories retrieved successfully", 200);
  } catch (error) {
    logger.error("Error fetching child categories", error);
    errorResponse(res, error, "Failed to fetch child categories", 500);
  }
};
