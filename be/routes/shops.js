import express from "express";
import * as shopController from "../controllers/shopController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET all shops
 */
router.get('/', shopController.getAllShops);

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
    '/:id',
    authenticate,
    authorize('seller'),
    shopController.updateShop
);

export default router;