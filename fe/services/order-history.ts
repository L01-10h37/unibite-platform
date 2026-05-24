const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

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
