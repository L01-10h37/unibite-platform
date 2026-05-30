import mongoose from "mongoose";
import crypto from 'crypto';

const paymentSchema = new mongoose.Schema(
    {
        orders: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Order",
                    required: true,
                },
            ],
            validate: {
                validator: (arr) => arr.length > 0,
                message: "Payment must contain at least one order",
            },
        },

        ordersHash: {
            type: String,
            required: true,
            unique: false  // Sẽ tạo compound unique với status
        },

        amount: {
            type: Number,
            required: true,
        },

        baseAmount: {
            type: Number,
            default: 0,
        },

        shippingFee: {
            type: Number,
            default: 0,
        },

        discountAmount: {
            type: Number,
            default: 0,
        },

        shippingDiscount: {
            type: Number,
            default: 0,
        },

        finalAmount: {
            type: Number,
            default: 0,
        },

        voucherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Voucher",
        },

        voucherCode: {
            type: String,
            trim: true,
        },

        voucherType: {
            type: String,
            enum: ["PERCENT", "FIXED", "FREE_SHIPPING"],
        },

        method: {
            type: String,
            enum: ["COD", "VNPAY", "MOMO"],
            required: true,
        },

        status: {
            type: String,
            enum: ["PENDING", "SUCCESS", "FAILED"],
            default: "PENDING",
            index: true,
        },

        transactionId: {
            type: String,
        },

        paidAt: {
            type: Date,
        },
    }, 
    { 
        timestamps: true, 
    }
);

paymentSchema.index({ orders: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index(
    { ordersHash: 1, status: 1 },
    { 
        unique: true,
        partialFilterExpression: { 
            status: { $in: ["PENDING", "SUCCESS"] } 
        }
    }
);

paymentSchema.pre('save', function(next) {
    if (this.isModified('orders')) {
        const sortedOrders = [...this.orders].sort().map(id => id.toString());
        this.ordersHash = crypto
            .createHash('sha256')
            .update(sortedOrders.join(','))
            .digest('hex');
    }
    next();
});

paymentSchema.methods.getFormattedData = function () {
    return {
        id: this._id,
        amount: this.amount,
        baseAmount: this.baseAmount,
        shippingFee: this.shippingFee,
        discountAmount: this.discountAmount,
        shippingDiscount: this.shippingDiscount,
        finalAmount: this.finalAmount,
        voucherCode: this.voucherCode,
        voucherType: this.voucherType,
        method: this.method,
        status: this.status,
    }
}

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;