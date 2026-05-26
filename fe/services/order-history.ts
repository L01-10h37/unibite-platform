const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://20.255.57.186:8080";

function authHeaders(token: string) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    const error = new Error(message) as Error & { statusCode?: number };
    error.statusCode = response.status;
    throw error;
  }

  return (payload?.data ?? payload) as T;
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "DELIVERING" | "COMPLETED" | "CANCELLED";

export type OrderHistorySummary = {
  id: string;
  totalPrice: number;
  status: OrderStatus;
  seller?: string;
};

export type OrderHistoryItem = {
  food: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  image?: string;
};

export type OrderHistoryDetail = {
  id: string;
  items: OrderHistoryItem[];
  totalPrice: number;
  status: OrderStatus;
  phone?: string;
  deliveryAddress?: string;
  statusHistory?: Array<{ status: OrderStatus; updatedAt: string }>;
  createdAt?: string;
  note?: string;
};

export type FoodPreview = {
  id: string;
  name: string;
  listUrlImg?: string[];
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages?: number;
};

export async function getMyOrderHistory(
  token: string,
  page = 1,
  limit = 6,
): Promise<{ orders: OrderHistorySummary[]; pagination: Pagination }> {
  const response = await fetch(`${API_BASE}/api/orders/my?page=${page}&limit=${limit}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    const error = new Error(message) as Error & { statusCode?: number };
    error.statusCode = response.status;
    throw error;
  }

  const orders = (payload?.data ?? []) as OrderHistorySummary[];

  return {
    orders,
    pagination: {
      page: payload?.page ?? page,
      limit: payload?.limit ?? limit,
      total: payload?.total ?? orders.length,
      pages: payload?.pages,
    },
  };
}

export async function getOrderHistoryDetail(token: string, orderId: string): Promise<OrderHistoryDetail> {
  const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  return parseJson<OrderHistoryDetail>(response);
}

export async function cancelBuyerOrder(token: string, orderId: string): Promise<OrderHistoryDetail> {
  const response = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
    method: "POST",
    headers: authHeaders(token),
  });

  return parseJson<OrderHistoryDetail>(response);
}

export async function getFoodPreview(foodId: string): Promise<FoodPreview | null> {
  const response = await fetch(`${API_BASE}/api/foods/${foodId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  return parseJson<FoodPreview>(response);
}

export function getOrderStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đang chuẩn bị",
    PREPARING: "Đang chuẩn bị",
    DELIVERING: "Đang giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };

  return labels[status] ?? status;
}

export function getOrderStatusColor(status: OrderStatus) {
  const colors: Record<OrderStatus, string> = {
    PENDING: "#F59E0B",
    CONFIRMED: "#7C3AED",
    PREPARING: "#7C3AED",
    DELIVERING: "#0891B2",
    COMPLETED: "#1E7A2E",
    CANCELLED: "#DC2626",
  };

  return colors[status] ?? "#64748B";
}

export function getOrderProgressStep(status: OrderStatus) {
  const steps: Record<OrderStatus, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    PREPARING: 2,
    DELIVERING: 3,
    COMPLETED: 4,
    CANCELLED: 0,
  };

  return steps[status] ?? 0;
}
