import express from "express";
import * as categoryController from "../controllers/categoryController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: get root categories
router.get("/", categoryController.getRoot);

// Public: get all categories in hierarchy (tree structure)
router.get("/hierarchy", categoryController.getAllCategoriesHierarchy);

// Public: get child categories
router.get("/:id/children", categoryController.getChildCategories);

// Admin: create category
router.post("/", authenticate, authorize("admin"), categoryController.createCategory);

// Admin: update category
router.put("/:id", authenticate, authorize("admin"), categoryController.updateCategory);

// Admin: delete category
router.delete("/:id", authenticate, authorize("admin"), categoryController.deleteCategory);

export default router;
