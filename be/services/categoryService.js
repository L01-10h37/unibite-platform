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
 * When deleting a category:
 * 1. Get parent category
 * 2.1. If parent exists, use it
 * 2.2. If not, find category with name="Khác"
 * 3. Move all child categories to the target parent
 * 4. TODO: Move all food items with deleted category to target parent (implement in food service)
 * 5. Delete the category
 */
export const deleteCategory = async (id) => {
  try {
    logger.info(`Service: Deleting category ${id}`);
    
    // 1. Get the category to delete
    const cat = await Category.findById(id);
    if (!cat) {
      const err = new Error("Category not found");
      err.statusCode = 404;
      throw err;
    }

    let targetParentId = null;

    // 2. Determine target parent category
    // 2.1. If category has a parent, use it
    if (cat.parentId) {
      targetParentId = cat.parentId;
      logger.info(`Service: Using parent category ${targetParentId} as target`);
    } else {
      // 2.2. If no parent, find category with name="Khác"
      const otherCategory = await Category.findOne({ name: "Khác" });
      if (!otherCategory) {
        const err = new Error('Cannot find parent category or "Khác" category');
        err.statusCode = 400;
        throw err;
      }
      targetParentId = otherCategory._id;
      logger.info(`Service: Using "Khác" category ${targetParentId} as target`);
    }

    // 3. Get all child categories of the deleted category and move them
    const childCategories = await Category.find({ parentId: id });
    if (childCategories.length > 0) {
      await Category.updateMany(
        { parentId: id },
        { $set: { parentId: targetParentId } }
      );
      logger.info(`Service: Moved ${childCategories.length} child categories to parent ${targetParentId}`);
    }

    // 4. TODO: Move all food items with deleted category to target parent category
    // This should be handled in the food/order service to reassign all orders/comments
    // that reference this category to the target parent category

    // 5. Delete the category
    await Category.findByIdAndDelete(id);
    logger.info(`Service: Category ${id} deleted successfully`);

    return {
      id,
      movedChildCount: childCategories.length,
      targetParent: targetParentId,
    };
  } catch (error) {
    logger.error("Service: Error deleting category", error);
    throw error;
  }
};
