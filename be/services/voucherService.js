import mongoose from "mongoose";

import Voucher from "../models/Voucher.js";
import { logger } from "../utils/logger.js";

const DEFAULT_VOUCHERS = [
  {
    code: "UNIBITE0",
    title: "Giảm 5.000đ",
    description: "Áp dụng cho mọi đơn từ 50.000đ trở lên.",
    type: "FIXED",
    value: 5000,
    minOrderValue: 50000,
    expiresAt: new Date("2026-06-30T23:59:59.999Z"),
    status: "ACTIVE",
  },
  {
    code: "SHIPFREE",
    title: "Miễn phí vận chuyển",
    description: "Trừ 100% phí ship cho đơn hàng đủ điều kiện.",
    type: "FREE_SHIPPING",
    value: 100,
    minOrderValue: 0,
    expiresAt: new Date("2026-06-30T23:59:59.999Z"),
    status: "ACTIVE",
  },
  {
    code: "SAVE10P",
    title: "Giảm 10%",
    description: "Giảm 10% tổng giá trị đơn, tối đa 20.000đ.",
    type: "PERCENT",
    value: 10,
    minOrderValue: 100000,
    expiresAt: new Date("2026-06-30T23:59:59.999Z"),
    status: "ACTIVE",
  },
  {
    code: "OLD2025",
    title: "Voucher cũ",
    description: "Voucher đã hết hạn để hiển thị trong nhóm không hiệu lực.",
    type: "FIXED",
    value: 10000,
    minOrderValue: 50000,
    expiresAt: new Date("2025-12-31T23:59:59.999Z"),
    status: "EXPIRED",
    usedAt: new Date("2025-12-31T23:00:00.000Z"),
  },
  {
    code: "USEDONE",
    title: "Voucher đã dùng",
    description: "Mẫu voucher đã được tiêu thụ sau một đơn hàng.",
    type: "FIXED",
    value: 15000,
    minOrderValue: 75000,
    expiresAt: new Date("2026-06-30T23:59:59.999Z"),
    status: "USED",
    usedAt: new Date("2026-05-20T10:00:00.000Z"),
  },
];

const VALID_STATUSES = ["ACTIVE", "RESERVED", "USED", "EXPIRED", "DISABLED"];

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

async function seedDefaultVouchers() {
  const count = await Voucher.countDocuments();

  if (count > 0) {
    return;
  }

  await Voucher.insertMany(DEFAULT_VOUCHERS);
}

async function syncExpiredVouchers() {
  const now = new Date();

  await Voucher.updateMany(
    { status: "ACTIVE", expiresAt: { $lt: now } },
    { $set: { status: "EXPIRED" } },
  );
}

function clampMoney(value) {
  return Math.max(0, Math.round(value));
}

export function calculateVoucherBenefit(voucher, subtotal = 0, shippingFee = 0) {
  const subtotalValue = Number(subtotal) || 0;
  const shippingValue = Number(shippingFee) || 0;

  if (subtotalValue < (voucher.minOrderValue || 0)) {
    const error = new Error(
      `Đơn tối thiểu để áp dụng voucher này là ${voucher.minOrderValue.toLocaleString("vi-VN")}đ`,
    );
    error.statusCode = 400;
    throw error;
  }

  let discountAmount = 0;
  let shippingDiscount = 0;

  if (voucher.type === "PERCENT") {
    discountAmount = clampMoney((subtotalValue * voucher.value) / 100);
  } else if (voucher.type === "FIXED") {
    discountAmount = clampMoney(voucher.value);
  } else if (voucher.type === "FREE_SHIPPING") {
    shippingDiscount = clampMoney(shippingValue);
  }

  const finalAmount = clampMoney(subtotalValue + shippingValue - discountAmount - shippingDiscount);

  return {
    discountAmount,
    shippingDiscount,
    finalAmount,
  };
}

export async function listVouchers({ status = "all" } = {}) {
  await seedDefaultVouchers();
  await syncExpiredVouchers();

  const query = {};
  const normalizedStatus = String(status || "all").trim().toUpperCase();

  if (normalizedStatus !== "ALL") {
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      const error = new Error("Invalid voucher status");
      error.statusCode = 400;
      throw error;
    }

    query.status = normalizedStatus;
  }

  const vouchers = await Voucher.find(query).sort({ expiresAt: 1, createdAt: -1 });

  return vouchers.map((voucher) => voucher.getFormattedData?.() || voucher);
}

export async function getVoucherByCode(code) {
  await seedDefaultVouchers();
  await syncExpiredVouchers();

  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    const error = new Error("Voucher code is required");
    error.statusCode = 400;
    throw error;
  }

  const voucher = await Voucher.findOne({ code: normalizedCode });

  if (!voucher) {
    const error = new Error("Voucher not found");
    error.statusCode = 404;
    throw error;
  }

  if (voucher.status !== "ACTIVE") {
    const error = new Error("Voucher is not available");
    error.statusCode = 400;
    throw error;
  }

  if (voucher.expiresAt.getTime() < Date.now()) {
    voucher.status = "EXPIRED";
    await voucher.save();

    const error = new Error("Voucher has expired");
    error.statusCode = 400;
    throw error;
  }

  return voucher;
}

export async function validateVoucherForCheckout(code, subtotal = 0, shippingFee = 0) {
  const voucher = await getVoucherByCode(code);
  const benefit = calculateVoucherBenefit(voucher, subtotal, shippingFee);

  return {
    voucher: voucher.getFormattedData?.() || voucher,
    ...benefit,
  };
}

export async function reserveVoucherForPayment(voucherId, paymentId, options = {}) {
  if (!mongoose.Types.ObjectId.isValid(voucherId)) {
    const error = new Error("Invalid voucherId format");
    error.statusCode = 400;
    throw error;
  }

  const voucher = await Voucher.findOneAndUpdate(
    {
      _id: voucherId,
      status: "ACTIVE",
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        status: "RESERVED",
        reservedByPayment: paymentId,
        reservedAt: new Date(),
      },
    },
    { new: true, session: options.session },
  );

  if (!voucher) {
    const error = new Error("Voucher is not available");
    error.statusCode = 400;
    throw error;
  }

  return voucher;
}

export async function consumeVoucherForPayment(voucherId, paymentId, orderId, options = {}) {
  if (!mongoose.Types.ObjectId.isValid(voucherId)) {
    return null;
  }

  const voucher = await Voucher.findOneAndUpdate(
    {
      _id: voucherId,
      $or: [
        { status: "RESERVED", reservedByPayment: paymentId },
        { status: "ACTIVE" },
      ],
    },
    {
      $set: {
        status: "USED",
        usedByPayment: paymentId,
        usedByOrder: orderId,
        usedAt: new Date(),
      },
      $unset: {
        reservedByPayment: "",
        reservedAt: "",
      },
    },
    { new: true, session: options.session },
  );

  return voucher;
}

export async function releaseVoucherReservation(paymentId, options = {}) {
  const query = Voucher.findOneAndUpdate(
    {
      reservedByPayment: paymentId,
      status: "RESERVED",
    },
    {
      $set: {
        status: "ACTIVE",
      },
      $unset: {
        reservedByPayment: "",
        reservedAt: "",
      },
    },
  );

  if (options.session) {
    query.session(options.session);
  }

  await query;
}

export function normalizeVoucherCode(code) {
  return normalizeCode(code);
}

export async function debugListVoucherDocuments() {
  logger.info("Listing voucher documents");
  return Voucher.find({}).sort({ createdAt: -1 });
}
