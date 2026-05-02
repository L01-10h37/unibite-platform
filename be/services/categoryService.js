import { logger } from "../utils/logger.js";
import Category from "../models/Category.js";

/**
 * Get all categories (flat list)
 */
export const getAllCategories = async () => {
  try {
    logger.info("Service: Getting all categories");
    const categories = await Category.find().sort({ name: 1 });
    return categories.map((c) => c.getFormattedData?.() || c);
  } catch (error) {
    logger.error("Service: Error getting categories", error);
    throw error;
  }
};

/**
 * Create category
 */
export const createCategory = async (data) => {
  try {
    logger.info("Service: Creating category", data);

    // Optional: prevent duplicate names under same parent
    const exists = await Category.findOne({ name: data.name, parentId: data.parentId || null });
    if (exists) {
      const err = new Error("Category with same name already exists");
      err.statusCode = 409;
      throw err;
    }

    const cat = await Category.create(data);
    return cat.getFormattedData?.() || cat;
  } catch (error) {
    logger.error("Service: Error creating category", error);
    throw error;
  }
};

/**
 * Update category
 */
export const updateCategory = async (id, data) => {
  try {
    logger.info(`Service: Updating category ${id}`);
    const updated = await Category.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    if (!updated) {
      const err = new Error("Category not found");
      err.statusCode = 404;
      throw err;
    }
    return updated.getFormattedData?.() || updated;
  } catch (error) {
    logger.error("Service: Error updating category", error);
    throw error;
  }
};

/**
 * Delete category
 */
export const deleteCategory = async (id) => {
  try {
    logger.info(`Service: Deleting category ${id}`);
    const cat = await Category.findById(id);
    if (!cat) {
      const err = new Error("Category not found");
      err.statusCode = 404;
      throw err;
    }

    // Optional: prevent deleting parent with children
    const child = await Category.findOne({ parentId: id });
    if (child) {
      const err = new Error("Cannot delete category that has child categories");
      err.statusCode = 409;
      throw err;
    }

    await Category.findByIdAndDelete(id);
    return { id };
  } catch (error) {
    logger.error("Service: Error deleting category", error);
    throw error;
  }
};
