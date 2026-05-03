import { logger } from "../utils/logger.js";
import Category from "../models/Category.js";

/**
 * Get root categories (parentId = null)
 */
export const getRoot = async () => {
  try {
    logger.info("Service: Getting root categories");
    const categories = await Category.find({ parentId: null }).sort({ name: 1 });
    return categories.map((c) => c.getFormattedData?.() || c);
  } catch (error) {
    logger.error("Service: Error getting root categories", error);
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
 * Get all categories in hierarchical structure (tree format)
 */
export const getAllCategoriesHierarchy = async () => {
  try {
    logger.info("Service: Getting all categories hierarchy");
    const all = await Category.find().sort({ name: 1 });

    const buildTree = (categories, parentId = null) => {
      return categories
        .filter((c) => {
          const cParentId = c.parentId ? c.parentId.toString() : null;
          const compareId = parentId ? parentId.toString() : null;
          return cParentId === compareId;
        })
        .map((c) => ({
          id: c._id,
          name: c.name,
          child: buildTree(categories, c._id),
        }));
    };

    return buildTree(all);
  } catch (error) {
    logger.error("Service: Error getting categories hierarchy", error);
    throw error;
  }
};

/**
 * Get child categories by parent ID
 */
export const getChildCategories = async (parentId) => {
  try {
    logger.info(`Service: Getting child categories for parent ${parentId}`);
    const children = await Category.find({ parentId }).sort({ name: 1 });
    return children.map((c) => c.getFormattedData?.() || c);
  } catch (error) {
    logger.error("Service: Error getting child categories", error);
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
