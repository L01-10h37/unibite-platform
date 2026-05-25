import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
    {
        food: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Food",
            required: [true, "Food is required"],
        },

        shop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            required: [true, "Shop is required"],
        },

        name: {
            type: String,
            trim: true,
            required: [true, "Food name is required"],
        },

        image: {
            type: String,
            default: null,
        },

        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price must be at least 0"],
        },

        specialPrice: {
            type: Number,
            default: null,
            min: [0, "Special price must be at least 0"],
        },

        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1"],
            default: 1,
        },
    },
    { _id: true }
);

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            unique: true,
            index: true,
        },

        items: {
            type: [cartItemSchema],
            default: [],
        },

        totalQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalPrice: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

cartSchema.index({ user: 1 });
cartSchema.index({ user: 1, "items.food": 1 });

cartSchema.pre("save", function (next) {
    this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);

    this.totalPrice = this.items.reduce((sum, item) => {
        const finalPrice = item.specialPrice ?? item.price;
        return sum + finalPrice * item.quantity;
    }, 0);

    next();
});

cartSchema.methods.getFormattedData = function () {
    return {
        id: this._id,
        user: this.user,
        items: this.items.map((item) => ({
            id: item._id,
            food: item.food,
            shop: item.shop,
            name: item.name,
            image: item.image,
            price: item.price,
            specialPrice: item.specialPrice,
            finalPrice: item.specialPrice ?? item.price,
            quantity: item.quantity,
            note: item.note,
            subtotal: (item.specialPrice ?? item.price) * item.quantity,
        })),
        totalQuantity: this.totalQuantity,
        totalPrice: this.totalPrice,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;