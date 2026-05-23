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
        method: this.method,
        status: this.status,
    }
}

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;