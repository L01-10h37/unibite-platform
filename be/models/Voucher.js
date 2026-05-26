import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["PERCENT", "FIXED", "FREE_SHIPPING"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "RESERVED", "USED", "EXPIRED", "DISABLED"],
      default: "ACTIVE",
      index: true,
    },
    reservedByPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    reservedAt: {
      type: Date,
    },
    usedByPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    usedByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

voucherSchema.index({ status: 1, expiresAt: 1 });

voucherSchema.methods.getFormattedData = function () {
  return {
    id: this._id,
    code: this.code,
    title: this.title,
    description: this.description,
    type: this.type,
    value: this.value,
    minOrderValue: this.minOrderValue,
    expiresAt: this.expiresAt,
    status: this.status,
    isActive: this.status === "ACTIVE",
    reservedAt: this.reservedAt,
    usedAt: this.usedAt,
  };
};

const Voucher = mongoose.model("Voucher", voucherSchema);

export default Voucher;
