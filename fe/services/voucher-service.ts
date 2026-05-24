import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";
const SELECTED_VOUCHER_STORAGE_KEY = "voucher-selection-v1";

export type VoucherType = "PERCENT" | "FIXED" | "FREE_SHIPPING";
export type VoucherStatus = "ACTIVE" | "RESERVED" | "USED" | "EXPIRED" | "DISABLED";

export type VoucherDto = {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: VoucherType;
  value: number;
  minOrderValue: number;
  expiresAt: string;
  status: VoucherStatus;
  isActive?: boolean;
  reservedAt?: string | null;
  usedAt?: string | null;
};

export type VoucherValidationResult = {
  voucher: VoucherDto;
  discountAmount: number;
  shippingDiscount: number;
  finalAmount: number;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    const error = new Error(message) as Error & { statusCode?: number };
    error.statusCode = response.status;
    throw error;
  }

  return (payload?.data ?? payload) as T;
}

export async function getVouchers(status = "all") {
  const response = await fetch(`${API_BASE}/api/vouchers?status=${encodeURIComponent(status)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  return parseResponse<VoucherDto[]>(response);
}

export async function lookupVoucherByCode(code: string) {
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    const error = new Error("Voucher code is required") as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  const response = await fetch(`${API_BASE}/api/vouchers/${encodeURIComponent(normalized)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  return parseResponse<VoucherDto>(response);
}

export async function validateVoucherForCheckout(
  code: string,
  subtotal: number,
  shippingFee = 0,
) {
  const response = await fetch(`${API_BASE}/api/vouchers/validate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, subtotal, shippingFee }),
  });

  return parseResponse<VoucherValidationResult>(response);
}

export async function getSelectedVoucherCode() {
  return AsyncStorage.getItem(SELECTED_VOUCHER_STORAGE_KEY);
}

export async function saveSelectedVoucherCode(code: string) {
  await AsyncStorage.setItem(SELECTED_VOUCHER_STORAGE_KEY, code.trim().toUpperCase());
}

export async function clearSelectedVoucherCode() {
  await AsyncStorage.removeItem(SELECTED_VOUCHER_STORAGE_KEY);
}
