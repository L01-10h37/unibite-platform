import express from "express";
import * as shopController from "../controllers/shopController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { uploadSingleFile, handleUploadError } from "../middleware/uploadMiddleware.js";
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
 * POST sync any shop profit by shopId (admin only)
 */
router.post(
    '/sync/profit/:shopId([0-9a-fA-F]{24})',
    authenticate,
    authorize('admin'),
    shopController.syncShopProfitById
);

/**
 * POST sync current seller shop rating
 */
router.post(
    '/sync/rating/my-shop',
    authenticate,
    authorize('seller'),
    shopController.syncMyShopRating
);

/**
 * POST sync any shop rating by shopId (admin only)
 */
router.post(
    '/sync/rating/:shopId([0-9a-fA-F]{24})',
    authenticate,
    authorize('admin'),
    shopController.syncShopRatingById
);

/**
 * POST sync any shop average rating by shopId (admin only)
 */
router.post(
    '/sync/average-rating/:shopId([0-9a-fA-F]{24})',
    authenticate,
    authorize('admin'),
    shopController.syncShopAverageRatingById
);

/**
 * POST sync any shop rating count by shopId (admin only)
 */
router.post(
    '/sync/rating-count/:shopId([0-9a-fA-F]{24})',
    authenticate,
    authorize('admin'),
    shopController.syncShopRatingCountById
);

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

/**
 * PATCH upload shop avatar
 */
router.patch(
    '/:id([0-9a-fA-F]{24})/avatar',
    authenticate,
    authorize('seller'),
    uploadSingleFile,
    handleUploadError,
    shopController.updateShopAvatar
);

export default router;
