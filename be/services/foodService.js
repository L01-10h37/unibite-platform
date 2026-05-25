import { logger } from "../utils/logger.js";
import mongoose from "mongoose";
import Food from "../models/Food.js";
import Shop from "../models/Shop.js";
import Category from "../models/Category.js";
import * as categoryService from "./categoryService.js";
import * as foodSearchService from "./foodSearchService.js";
import * as shopService from "./shopService.js";
import { uploadAvatarToS3, deleteAvatarFromS3, validateImageFile, validateFileSize } from '../utils/s3Upload.js';

const buildFoodQuery = async ({
  search = "",
  categoryId = null,
  shopId = null,
  minRating = 0,
  minPrice = null,
  maxPrice = null,
  area = "",
}) => {
  const query = { isDraft: false };

  if (search && search.trim()) {
    query.name = { $regex: search.trim(), $options: "i" };
  }

  if (minRating > 0) {
    query.average_rating = { $gte: minRating };
  }

  if (minPrice != null || maxPrice != null) {
    query.price = {};

    if (minPrice != null && !Number.isNaN(minPrice)) {
      query.price.$gte = minPrice;
    }

    if (maxPrice != null && !Number.isNaN(maxPrice)) {
      query.price.$lte = maxPrice;
    }

    if (Object.keys(query.price).length === 0) {
      delete query.price;
    }
  }

  if (categoryId) {
    try {
      const deepChildren = await categoryService.getDeepChild(categoryId);
      const categoryIds = [categoryId, ...deepChildren.map((cat) => cat.id)];
      query.category = { $in: categoryIds };
    } catch (error) {
      logger.warn(`Service: Error getting deep children for category ${categoryId}`, error);
      query.category = categoryId;
    }
  }

  const shopFilters = [];

  if (shopId) {
    shopFilters.push(shopId);
  }

  if (area && area.trim()) {
    const matchedShops = await Shop.find({
      $or: [
        { address: { $regex: area.trim(), $options: "i" } },
        { name: { $regex: area.trim(), $options: "i" } },
      ],
    }).select("_id");

    const areaShopIds = matchedShops.map((shop) => shop._id.toString());

    if (shopFilters.length > 0) {
      const matched = shopFilters.filter((id) => areaShopIds.includes(id.toString()));
      query.shop = matched.length === 1 ? matched[0] : { $in: matched };
      if (!matched.length) {
        query.shop = { $in: [] };
      }
    } else {
      query.shop = { $in: areaShopIds.length ? areaShopIds : [] };
    }
  } else if (shopFilters.length === 1) {
    query.shop = shopFilters[0];
  } else if (shopFilters.length > 1) {
    query.shop = { $in: shopFilters };
  }

  return query;
};

const buildFoodSort = (order = "relevant") => {
  switch (order) {
    case "price_low":
    case "price_asc":
      return { price: 1, createdAt: -1 };
    case "price_high":
    case "price_desc":
      return { price: -1, createdAt: -1 };
    case "rating_asc":
      return { average_rating: 1, createdAt: -1 };
    case "rating_desc":
    case "rating":
      return { average_rating: -1, createdAt: -1 };
    case "created_asc":
    case "oldest":
      return { createdAt: 1 };
    case "created_desc":
    case "newest":
    case "recent":
    case "relevant":
    default:
      return { createdAt: -1 };
  }
};

/**
 * Get all foods with search, category filter, shop filter, rating filter, and sorting
 */
export const getAllFood = async (
  page = 1,
  limit = 10,
  search = "",
  categoryId = null,
  shopId = null,
  minRating = 0,
  order = "relevant",
  minPrice = null,
  maxPrice = null,
  area = ""
) => {
  try {
    logger.info(
      `Service: Getting all foods - search: ${search}, categoryId: ${categoryId}, shopId: ${shopId}, minRating: ${minRating}, minPrice: ${minPrice}, maxPrice: ${maxPrice}, area: ${area}, order: ${order}`
    );
    const skip = (page - 1) * limit;

    const query = await buildFoodQuery({
      search,
      categoryId,
      shopId,
      minRating,
      minPrice,
      maxPrice,
      area,
    });
    const sortOrder = buildFoodSort(order);

    const foods = await Food.find(query)
      .populate("category")
      .populate("shop")
      .skip(skip)
      .limit(limit)
      .sort(sortOrder);

    const total = await Food.countDocuments(query);

    return {
      foods: foods.map((food) => food.getFormattedData?.() || food),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Service: Error getting all foods", error);
    throw error;
  }
};

export const syncFoodSearchIndex = async () => {
  try {
    logger.info("Service: Syncing food search index");
    return await foodSearchService.syncFoodSearchIndex();
  } catch (error) {
    logger.error("Service: Error syncing food search index", error);
    throw error;
  }
};

export const searchFoods = async (
  page = 1,
  limit = 10,
  search = "",
  minRating = 0,
  order = "relevant",
  minPrice = null,
  maxPrice = null,
  area = ""
) => {
  try {
    logger.info(
      `Service: Searching foods - search: ${search}, minRating: ${minRating}, minPrice: ${minPrice}, maxPrice: ${maxPrice}, area: ${area}, order: ${order}`
    );

    let result;

    try {
      result = await foodSearchService.searchFoodDocuments({
        page,
        search,
        limit,
        minRating,
        minPrice,
        maxPrice,
        order,
      });
    } catch (error) {
      const isMissingSearchIndex =
        error.type === "index_not_found_exception" ||
        error.message?.includes("no such index");

      if (!isMissingSearchIndex) {
        throw error;
      }

      logger.info("Service: Food search index missing, syncing before retry");
      await foodSearchService.syncFoodSearchIndex();
      result = await foodSearchService.searchFoodDocuments({
        page,
        search,
        limit,
        minRating,
        minPrice,
        maxPrice,
        order,
      });
    }

    const foodIds = result.foods.map((food) => food.id).filter(Boolean);

    if (!foodIds.length) {
      return {
        foods: [],
        pagination: result.pagination,
      };
    }

    const mongoQuery = { _id: { $in: foodIds }, isDraft: false };

    if (minRating > 0) {
      mongoQuery.average_rating = { $gte: minRating };
    }

    if (minPrice != null || maxPrice != null) {
      mongoQuery.price = {};

      if (minPrice != null && !Number.isNaN(minPrice)) {
        mongoQuery.price.$gte = minPrice;
      }

      if (maxPrice != null && !Number.isNaN(maxPrice)) {
        mongoQuery.price.$lte = maxPrice;
      }

      if (Object.keys(mongoQuery.price).length === 0) {
        delete mongoQuery.price;
      }
    }

    const foods = await Food.find(mongoQuery)
      .populate("category")
      .populate("shop");

    const foodById = new Map(
      foods.map((food) => [food._id.toString(), food.getFormattedData?.() || food])
    );

    return {
      foods: foodIds.map((foodId) => foodById.get(foodId)).filter(Boolean),
      pagination: result.pagination,
    };
  } catch (error) {
    logger.error("Service: Error searching foods", error);
    throw error;
  }
};

/**
 * Get food by ID
 */
export const getFood = async (foodId) => {
  try {
    logger.info(`Service: Getting food by id: ${foodId}`);

    const food = await Food.findById(foodId)
      .populate("category")
      .populate("shop");

    if (!food) {
      const error = new Error("Food not found");
      error.statusCode = 404;
      throw error;
    }

    return food.getFormattedData?.() || food;
  } catch (error) {
    logger.error("Service: Error getting food by id", error);
    throw error;
  }
};

/**
 * Get current seller's menu
 */
export const getMyMenu = async (userId, page = 1, limit = 10) => {
  try {
    logger.info(`Service: Getting my menu for user ${userId}`);

    const shop = await Shop.findOne({ userId });
    if (!shop) {
      const error = new Error("Shop not found");
      error.statusCode = 404;
      throw error;
    }

    const skip = (page - 1) * limit;

    const foods = await Food.find({ shop: shop._id })
      .populate("category")
      .populate("shop")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Food.countDocuments({ shop: shop._id });

    return {
      foods: foods.map((food) => food.getFormattedData?.() || food),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Service: Error getting my menu", error);
    throw error;
  }
};

/**
 * Create new food (shop owner)
 */
export const createFood = async (userId, foodData) => {
  try {
    logger.info("Service: Creating new food", foodData);

    const category = await Category.findById(foodData.category);
    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    // Find shop owned by this user
    const shop = await Shop.findOne({ userId });
    if (!shop) {
      const error = new Error("You do not have a shop. Please create a shop first");
      error.statusCode = 400;
      throw error;
    }

    // Add shop to food data
    const newFoodData = {
      ...foodData,
      shop: shop._id,
    };

    const newFood = await Food.create(newFoodData);
    await newFood.populate(["category", "shop"]);
    await foodSearchService.safeIndexFoodSearchDocument(newFood, logger);

    return newFood.getFormattedData?.() || newFood;
  } catch (error) {
    logger.error("Service: Error creating food", error);
    throw error;
  }
};

/**
 * Update food (shop owner only)
 */
export const updateFood = async (foodId, userId, updateData) => {
  try {
    logger.info(`Service: Updating food ${foodId}`);

    if (updateData.category) {
      const category = await Category.findById(updateData.category);
      if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
      }
    }

    const food = await Food.findById(foodId).populate("shop");

    if (!food) {
      const error = new Error("Food not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if user owns the shop
    if (food.shop.userId.toString() !== userId.toString()) {
      const error = new Error("You do not have permission to update this food");
      error.statusCode = 403;
      throw error;
    }

    // Prevent immutable fields from being updated
    if (updateData.shop) {
      const error = new Error("Cannot change the shop for this food");
      error.statusCode = 400;
      throw error;
    }
    if (updateData.average_rating || updateData.rating_count) {
      const error = new Error("Cannot change rating fields");
      error.statusCode = 400;
      throw error;
    }
    if (updateData.sold_count) {
      const error = new Error("Cannot change sold count");
      error.statusCode = 400;
      throw error;
    }

    const updatedFood = await Food.findByIdAndUpdate(
      foodId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate(["category", "shop"]);
    await foodSearchService.safeIndexFoodSearchDocument(updatedFood, logger);

    return updatedFood.getFormattedData?.() || updatedFood;
  } catch (error) {
    logger.error("Service: Error updating food", error);
    throw error;
  }
};

/**
 * Increment sold count for a food item.
 */
export const incrementFoodSoldCount = async (foodId, amount = 1) => {
  try {
    logger.info(`Service: Incrementing sold count for food ${foodId} by ${amount}`);

    const increment = Number(amount);

    if (!Number.isFinite(increment) || increment <= 0) {
      const error = new Error("Increment amount must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    const updatedFood = await Food.findByIdAndUpdate(
      foodId,
      { $inc: { sold_count: increment } },
      { new: true, runValidators: true }
    ).populate(["category", "shop"]);

    if (!updatedFood) {
      const error = new Error("Food not found");
      error.statusCode = 404;
      throw error;
    }

    await foodSearchService.safeIndexFoodSearchDocument(updatedFood, logger);

    return updatedFood.getFormattedData?.() || updatedFood;
  } catch (error) {
    logger.error("Service: Error incrementing food sold count", error);
    throw error;
  }
};

/**
 * Update food rating and its shop rating when a new comment is added.
 */
export const updateFoodRatingFromComment = async (foodId, rating, session = null) => {
  if (!session) {
    const localSession = await mongoose.startSession();
    let updatedFood;

    try {
      await localSession.withTransaction(async () => {
        updatedFood = await updateFoodRatingFromComment(foodId, rating, localSession);
      });

      await foodSearchService.safeIndexFoodSearchDocument(updatedFood, logger);

      return updatedFood;
    } catch (error) {
      logger.error("Service: Error updating food rating", error);
      throw error;
    } finally {
      localSession.endSession();
    }
  }

  try {
    logger.info(`Service: Updating food ${foodId} rating with ${rating}`);

    const ratingValue = Number(rating);

    if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      const error = new Error("Rating must be a number from 1 to 5");
      error.statusCode = 400;
      throw error;
    }

    const food = await Food.findById(foodId).select("shop").session(session);

    if (!food) {
      const error = new Error("Food not found");
      error.statusCode = 404;
      throw error;
    }

    const updatedFood = await Food.findByIdAndUpdate(
      foodId,
      [
        {
          $set: {
            average_rating: {
              $divide: [
                {
                  $add: [
                    { $multiply: ["$average_rating", "$rating_count"] },
                    ratingValue,
                  ],
                },
                { $add: ["$rating_count", 1] },
              ],
            },
            rating_count: { $add: ["$rating_count", 1] },
          },
        },
      ],
      { new: true, session }
    ).populate(["category", "shop"]);

    await shopService.updateShopRatingFromComment(food.shop, ratingValue, session);

    if (!session) {
      await foodSearchService.safeIndexFoodSearchDocument(updatedFood, logger);
    }

    return updatedFood.getFormattedData?.() || updatedFood;
  } catch (error) {
    logger.error("Service: Error updating food rating", error);
    throw error;
  }
};

/**
 * Delete food (auth required)
 */
export const deleteFood = async (foodId, userId) => {
  try {
    logger.info(`Service: Deleting food ${foodId}`);

    const food = await Food.findById(foodId).populate("shop");

    if (!food) {
      const error = new Error("Food not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if user owns the shop
    if (food.shop.userId.toString() !== userId.toString()) {
      const error = new Error("You do not have permission to delete this food");
      error.statusCode = 403;
      throw error;
    }

    await Food.findByIdAndDelete(foodId);
    await foodSearchService.safeDeleteFoodSearchDocument(foodId, logger);
    return { id: foodId };
  } catch (error) {
    logger.error("Service: Error deleting food", error);
    throw error;
  }
};

/**
 * Upload food images (shop owner only)
 */
export const uploadFoodImages = async (foodId, userId, files) => {
  try {
    logger.info(`Service: Uploading images for food ${foodId}`);

    // Validate files
    for (const file of files) {
      if (!validateImageFile(file.mimetype)) {
        const error = new Error("Invalid file type. Only image files are allowed.");
        error.statusCode = 400;
        throw error;
      }
      if (!validateFileSize(file.size)) {
        const error = new Error("File size exceeds the limit of 5MB.");
        error.statusCode = 400;
        throw error;
      }
    }

    // Kiểm tra xem food có tồn tại không và lấy thông tin shop
    const food = await Food.findById(foodId).populate("shop");
    if (!food) {
      const error = new Error("Food not found");
      error.statusCode = 404;
      throw error;
    }

    // Kiểm tra xem user có phải là chủ shop không
    if (food.shop.userId.toString() !== userId.toString()) {
      const error = new Error("You do not have permission to upload images for this food");
      error.statusCode = 403;
      throw error;
    }

    // Tải tất cả ảnh lên S3 và lấy URL của chúng
    const uploadPromises = files.map((file) => uploadAvatarToS3(file.buffer, file.originalname));
    const imageUrls = await Promise.all(uploadPromises);

    // Thêm URL của các ảnh mới vào mảng listUrlImg của food
    food.listUrlImg = [...(food.listUrlImg || []), ...imageUrls];
    await food.save();
    await food.populate(["category", "shop"]);
    await foodSearchService.safeIndexFoodSearchDocument(food, logger);

    return imageUrls;
  } catch (error) {
    logger.error("Service: Error uploading food images", error);
    throw error;
  }
};

/**
 * Delete food image (shop owner only)
 */
export const deleteFoodImage = async (foodId, userId, imageUrl) => {
  try {
    logger.info(`Service: Deleting image for food ${foodId} - Image URL: ${imageUrl}`);
    
    // Kiểm tra xem food có tồn tại không và lấy thông tin shop
    const food = await Food.findById(foodId).populate("shop");
    if (!food) {
      const error = new Error("Food not found");
      error.statusCode = 404;
      throw error;
    }

    // Kiểm tra xem user có phải là chủ shop không
    if (food.shop.userId.toString() !== userId.toString()) {
      const error = new Error("You do not have permission to delete images for this food");
      error.statusCode = 403;
      throw error;
    }

    // Xóa URL của ảnh khỏi mảng listUrlImg của food
    food.listUrlImg = (food.listUrlImg || []).filter((url) => url !== imageUrl);
    await food.save();
    await food.populate(["category", "shop"]);
    await foodSearchService.safeIndexFoodSearchDocument(food, logger);

    // Xóa ảnh khỏi S3
    await deleteAvatarFromS3(imageUrl);
  } catch (error) {
    logger.error("Service: Error deleting food image", error);
    throw error;
  }
};
