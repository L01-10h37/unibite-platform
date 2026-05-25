import { logger } from "../utils/logger.js";
import Food from "../models/Food.js"
import Shop from "../models/Shop.js";
import Cart from "../models/Cart.js";

export const getCartByUserId = async (userId) => {
    try {
        const cart = await Cart.findOne({ user: userId }).populate({
            path: "items.food",
            select: "name description price listUrlImg isAvailable isDraft",
            populate: {
                path: "shop",
                select: "name avatar address openingHours average_rating"
            }
        });

        if (!cart) {
            return {
                success: true,
                message: "Cart is empty",
                data: {
                    items: [],
                    totalPrice: 0,
                    totalQuantity: 0
                }
            };
        }

        return {
            success: true,
            message: "Cart fetched successfully",
            data: cart.getFormattedData()
        };
    } catch (error) {
        logger.error("Error fetching cart", error);
        throw error;
    }
};

export const addItemToCart = async (userId, foodId, quantity) => {
    try {
        const food = await Food.findById(foodId).populate("shop");
        if (!food) {
            const error = new Error('Food item not found');
            error.statusCode = 404;
            throw error;
        }

        if (quantity < 1) {
            const error = new Error('Quantity must be at least 1');
            error.statusCode = 400;
            throw error;
        }

        if (!food.isAvailable || food.isDraft) {
            const error = new Error('Food item is not available');
            error.statusCode = 400;
            throw error;
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item => item.food.toString() === foodId);

        if (existingItemIndex >= 0) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({ 
                food: food._id, 
                shop: food.shop._id || food.shop,
                name: food.name,
                image: food.listUrlImg?.[0] || null,
                price: food.price,
                specialPrice: food.specialPrice,
                quantity
            });
        }

        await cart.save();

        return {
            success: true,
            message: "Item added to cart successfully",
            data: cart.getFormattedData()
        }
    } catch (error) {
        logger.error("Error adding item to cart", error);
        throw error;
    }
};