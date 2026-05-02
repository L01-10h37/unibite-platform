import express from "express";
import * as categoryController from "../controllers/categoryController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: get all categories
router.get("/", categoryController.getAllCategories);

// Admin: create category
router.post("/", authenticate, authorize("admin"), categoryController.createCategory);

// Admin: update category
router.put("/:id", authenticate, authorize("admin"), categoryController.updateCategory);

// Admin: delete category
router.delete("/:id", authenticate, authorize("admin"), categoryController.deleteCategory);

export default router;
