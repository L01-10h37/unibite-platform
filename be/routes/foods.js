import express from "express";
import * as foodController from "../controllers/foodController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { uploadMultipleFiles } from "../middleware/uploadMiddleware.js";
const router = express.Router();

router.post("/search-index/sync", authenticate, authorize("admin"), foodController.syncFoodSearchIndex);
router.get("/search", foodController.searchFoods);

/**
 * GET /foods
 * #swagger.tags = ['Foods']
 * #swagger.path = '/api/foods'
 * #swagger.method = 'get'
 * #swagger.summary = 'Get all foods'
 * #swagger.description = 'Retrieve all foods with pagination. No authentication required.'
 * #swagger.parameters['page'] = { in: 'query', type: 'integer', description: 'Page number (default: 1)' }
 * #swagger.parameters['limit'] = { in: 'query', type: 'integer', description: 'Items per page (default: 10)' }
 * #swagger.responses[200] = {
 *   description: 'Foods retrieved successfully',
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       data: {
 *         type: 'array',
 *         items: {
 *           type: 'object',
 *           properties: {
 *             id: { type: 'string' },
 *             name: { type: 'string' },
 *             description: { type: 'string' },
 *             price: { type: 'number' },
 *             specialPrice: { type: 'number' },
 *             category: { type: 'string' },
 *             shop: { type: 'string' },
 *             listUrlImg: { type: 'array', items: { type: 'string' } },
 *             isAvailable: { type: 'boolean' },
 *             isDraft: { type: 'boolean' },
 *             startTime: { type: 'string' },
 *             endTime: { type: 'string' },
 *             createdAt: { type: 'string', format: 'date-time' },
 *             updatedAt: { type: 'string', format: 'date-time' }
 *           }
 *         }
 *       },
 *       pagination: {
 *         type: 'object',
 *         properties: {
 *           page: { type: 'integer' },
 *           limit: { type: 'integer' },
 *           total: { type: 'integer' }
 *         }
 *       }
 *     }
 *   }
 * }
 */
router.get("/", foodController.getAllFood);

/**
 * GET /foods/my-menu
 * #swagger.tags = ['Foods']
 * #swagger.summary = 'Get my menu'
 * #swagger.description = "Get foods from the authenticated seller's shop. Requires seller authentication."
 * #swagger.security = [{ bearerAuth: [] }]
 * #swagger.parameters['authorization'] = { in: 'header', type: 'string', required: true, description: 'Bearer token' }
 * #swagger.parameters['page'] = { in: 'query', type: 'integer', description: 'Page number (default: 1)' }
 * #swagger.parameters['limit'] = { in: 'query', type: 'integer', description: 'Items per page (default: 10)' }
 * #swagger.responses[200] = {
 *   description: 'My menu retrieved successfully',
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       data: {
 *         type: 'array',
 *         items: {
 *           type: 'object',
 *           properties: {
 *             id: { type: 'string' },
 *             name: { type: 'string' },
 *             description: { type: 'string' },
 *             price: { type: 'number' },
 *             specialPrice: { type: 'number' },
 *             categoryId: { type: 'string' },
 *             categoryName: { type: 'string' },
 *             shopId: { type: 'string' },
 *             shopName: { type: 'string' },
 *             listUrlImg: { type: 'array', items: { type: 'string' } },
 *             isAvailable: { type: 'boolean' },
 *             isDraft: { type: 'boolean' },
 *             startTime: { type: 'string' },
 *             endTime: { type: 'string' },
 *             createdAt: { type: 'string', format: 'date-time' },
 *             updatedAt: { type: 'string', format: 'date-time' }
 *           }
 *         }
 *       },
 *       pagination: {
 *         type: 'object',
 *         properties: {
 *           page: { type: 'integer' },
 *           limit: { type: 'integer' },
 *           total: { type: 'integer' }
 *         }
 *       }
 *     }
 *   }
 * }
 */
router.get("/my-menu", authenticate, authorize("seller"), foodController.getMyMenu);

router.get("/:id", foodController.getFood);

/**
 * POST /foods
 * #swagger.tags = ['Foods']
 * #swagger.summary = 'Create food'
 * #swagger.description = 'Create a new food item. Requires authentication as seller.'
 * #swagger.security = [{ bearerAuth: [] }]
 * #swagger.parameters['authorization'] = { in: 'header', type: 'string', required: true, description: 'Bearer token' }
 * #swagger.requestBody = {
 *   required: true,
 *   content: {
 *     'application/json': {
 *       schema: {
 *         type: 'object',
 *         required: ['name', 'price', 'category'],
 *         properties: {
 *           name: { type: 'string', description: 'Food name' },
 *           description: { type: 'string', description: 'Food description' },
 *           price: { type: 'number', description: 'Food price' },
 *           specialPrice: { type: 'number', description: 'Special discounted price' },
 *           startTime: { type: 'string', description: 'Start time for special price' },
 *           endTime: { type: 'string', description: 'End time for special price' },
 *           category: { type: 'string', description: 'Category ID' },
 *           listUrlImg: { type: 'array', items: { type: 'string' }, description: 'List of image URLs' },
 *           isAvailable: { type: 'boolean', description: 'Availability status' },
 *           isDraft: { type: 'boolean', description: 'Draft status' }
 *         }
 *       }
 *     }
 *   }
 * }
 * #swagger.responses[201] = {
 *   description: 'Food created successfully',
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       data: { type: 'object' },
 *       message: { type: 'string' }
 *     }
 *   }
 * }
 * #swagger.responses[401] = { description: 'Unauthorized' }
 * #swagger.responses[403] = { description: 'Forbidden - seller role required' }
 */
router.post(
  "/",
  authenticate,
  authorize("seller"),
  foodController.createFood
);

/**
 * PUT /foods/:id
 * #swagger.tags = ['Foods']
 * #swagger.summary = 'Update food'
 * #swagger.description = 'Update a food item. Requires authentication as seller.'
 * #swagger.security = [{ bearerAuth: [] }]
 * #swagger.parameters['id'] = { in: 'path', type: 'string', required: true, description: 'Food ID' }
 * #swagger.parameters['authorization'] = { in: 'header', type: 'string', required: true, description: 'Bearer token' }
 * #swagger.requestBody = {
 *   required: true,
 *   content: {
 *     'application/json': {
 *       schema: {
 *         type: 'object',
 *         properties: {
 *           name: { type: 'string', description: 'Food name' },
 *           description: { type: 'string', description: 'Food description' },
 *           price: { type: 'number', description: 'Food price' },
 *           specialPrice: { type: 'number', description: 'Special discounted price' },
 *           startTime: { type: 'string', description: 'Start time for special price' },
 *           endTime: { type: 'string', description: 'End time for special price' },
 *           category: { type: 'string', description: 'Category ID' },
 *           listUrlImg: { type: 'array', items: { type: 'string' }, description: 'List of image URLs' },
 *           isAvailable: { type: 'boolean', description: 'Availability status' },
 *           isDraft: { type: 'boolean', description: 'Draft status' }
 *         }
 *       }
 *     }
 *   }
 * }
 * #swagger.responses[200] = {
 *   description: 'Food updated successfully',
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       data: { type: 'object' },
 *       message: { type: 'string' }
 *     }
 *   }
 * }
 * #swagger.responses[401] = { description: 'Unauthorized' }
 * #swagger.responses[403] = { description: 'Forbidden - seller role required' }
 * #swagger.responses[404] = { description: 'Food not found' }
 */
router.put(
  "/:id",
  authenticate,
  authorize("seller"),
  foodController.updateFood
);

/**
 * DELETE /foods/:id
 * #swagger.tags = ['Foods']
 * #swagger.summary = 'Delete food'
 * #swagger.description = 'Delete a food item. Requires authentication.'
 * #swagger.security = [{ bearerAuth: [] }]
 * #swagger.parameters['id'] = { in: 'path', type: 'string', required: true, description: 'Food ID' }
 * #swagger.parameters['authorization'] = { in: 'header', type: 'string', required: true, description: 'Bearer token' }
 * #swagger.responses[200] = {
 *   description: 'Food deleted successfully',
 *   schema: {
 *     type: 'object',
 *     properties: {
 *       message: { type: 'string' }
 *     }
 *   }
 * }
 * #swagger.responses[401] = { description: 'Unauthorized' }
 * #swagger.responses[404] = { description: 'Food not found' }
 */
router.delete(
  "/:id",
  authenticate,
  foodController.deleteFood
);

/**
 * PATCH /foods/:id/images
 * Upload 1 or more images for a food item.
 * Requires authentication as seller.
 */
router.patch(
  "/:id/images",
  authenticate,
  authorize("seller"),
  uploadMultipleFiles,
  foodController.uploadFoodImages
);

/**
 * DELETE /foods/:id/images/:imageId
 * Delete an image from a food item.
 * Requires authentication as seller.
 */
router.delete(
  "/:id/images",
  authenticate,
  authorize("seller"),
  foodController.deleteFoodImage
);

export default router;
