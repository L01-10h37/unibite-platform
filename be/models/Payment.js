import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
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

paymentSchema.index({ status: 1 });
paymentSchema.index({ order: 1 });
paymentSchema.index(
    { order: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "PENDING" }
    }
);
paymentSchema.index(
    { order: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "SUCCESS" }
    }
);

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