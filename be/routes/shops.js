import express from "express";
import * as shopController from "../controllers/shopController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET all shops (with optional search and filter)
 */
router.get('/', shopController.getAllShops);

/**
 * GET shop by id
 */
router.get('/my-shop', authenticate, authorize('seller'), shopController.getMyShop);

/**
 * GET shop by id
 */
router.get('/:id([0-9a-fA-F]{24})', shopController.getShopById);

/**
 * POST create shop
 */
router.post(
    '/', 
    authenticate,
    authorize('seller'),
    shopController.createShop
);

/**
 * PUT update shop
 */
router.put(
    '/:id([0-9a-fA-F]{24})',
    authenticate,
    authorize('seller'),
    shopController.updateShop
);

export default router;