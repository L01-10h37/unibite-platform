import { logger } from "../utils/logger.js";
import Food from "../models/Food.js"
import Shop from "../models/Shop.js";
import Cart from "../models/Cart.js";
import mongoose from "mongoose";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getCartByUserId = async (userId) => {
    try {
        const cart = await Cart.findOne({ user: userId }).populate({
            path: "items.shop",
            select: "name avatar"
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
                shop: food.shop,
                name: food.name,
                image: food.listUrlImg?.[0] || null,
                price: food.price,
                // specialPrice: food.specialPrice,
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

export const removeItemFromCart = async (userId, itemId, options = {}) => {
    const { session } = options;

    console.log(itemId);

    try {
        if (!isValidObjectId(itemId)) {
            const error = new Error("Invalid item ID");
            error.statusCode = 400;
            throw error;
        }

        const cart = await Cart.findOne({ user: userId }).session(session || null);

        if (!cart) {
            const error = new Error("Cart not found");
            error.statusCode = 404;
            throw error;
        }

        const itemIndex = cart.items.findIndex(
            (item) => item._id.toString() === itemId.toString()
        );

        if (itemIndex === -1) {
            const error = new Error("Cart item not found");
            error.statusCode = 404;
            throw error;
        }

        cart.items.splice(itemIndex, 1);

        await cart.save({ session });

        return {
            success: true,
            message: "Item removed from cart successfully",
            data: cart.getFormattedData(),
        };
    } catch (error) {
        logger.error("Error removing item from cart", error);
        throw error;
    }
};

export const updateCart = async (cartId, items) => {
    try {
        if (!isValidObjectId(cartId)) {
            const error = new Error('Invalid cart ID');
            error.statusCode = 400;
            throw error;
        }

        const cart = await Cart.findOne({ _id: cartId });
        if (!cart) {
            const error = new Error('Cart not found');
            error.statusCode = 404;
            throw error;
        }

        // Validate items
        for (const item of items) {
            if (!isValidObjectId(item.id)) {
                const error = new Error(`Invalid item ID: ${item.id}`);
                error.statusCode = 400;
                throw error;
            }   
            if (item.quantity < 1) {
                const error = new Error(`Quantity must be at least 1 for item ID: ${item.id}`);
                error.statusCode = 400;
                throw error;
            }
        }

        // Update quantities
        for (const item of items) {
            const existingItem = cart.items.find(i => i._id.toString() === item.id);
            if (existingItem) {
                existingItem.quantity = item.quantity;
            } else {
                const error = new Error(`Cart item not found for ID: ${item.id}`);
                error.statusCode = 404;
                throw error;
            }
        }

        await cart.save();
        return {
            success: true,
            message: "Cart updated successfully",
            data: cart.getFormattedData()
        };
    } catch (error) {
        logger.error("Error updating cart", error);
        throw error;
    }
};