/**
 * seller-api.ts
 * Service layer cho 3 màn hình người bán:
 *   - Đánh giá  → /api/comment/:shopId
 *   - Đơn hàng  → /api/orders/:orderId
 *   - Trạng thái đơn hàng → /api/orders/:orderId
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://20.255.57.186:8080";

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function authHeaders(token: string) {
    return {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        const err: Error & { statusCode?: number } = new Error(
            `HTTP ${res.status}: ${text}`
        );
        err.statusCode = res.status;
        throw err;
    }
    const json = await res.json().catch(() => null);
    // Backend trả: { success, message, data } hoặc { success, message, data, pagination }
    return (json?.data ?? json) as T;
}

// ─────────────────────────────────────────────
//  Types – khớp với BE models
// ─────────────────────────────────────────────

/** User populated vào comment */
export interface CommentUser {
    _id: string;
    username?: string;
    name?: string;
    avatar?: string | null;
}

/** Comment từ BE (getFormattedData) */
export interface SellerReview {
    id: string;
    postId: string;
    userId: CommentUser | string;
    content: string;
    rating: number;
    reply: string | null;
    image?: string | null;
    likeCount: number;
    likes: string[];
    createdAt: string;
    updatedAt: string;
    // FE-only fields (enrichment)
    userLiked?: boolean;
}

/** Pagination metadata */
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages?: number;
}

export interface PaginatedResult<T> {
    items: T[];
    pagination: Pagination;
}

// ─────────────────── Order types ───────────────────

export type OrderStatus =
    | "PENDING"
    | "CONFIRMED"
    | "PREPARING"
    | "DELIVERING"
    | "COMPLETED"
    | "CANCELLED";

export interface OrderItem {
    food: string;
    name: string;
    price: number;
    quantity: number;
    note?: string;
    image?: string; // FE enrichment
}

export interface StatusHistoryEntry {
    status: OrderStatus;
    updatedAt: string;
}

/** Order "basic" (danh sách) */
export interface OrderBasic {
    id: string;
    totalPrice: number;
    status: OrderStatus;
    isPaid: boolean;
    user?: {
        id?: string;
        _id?: string;
        username?: string;
        name?: string;
        phone?: string;
    };
    items?: OrderItem[];
    phone?: string;
    deliveryAddress?: string;
    createdAt?: string;
    note?: string;
}

/** Order "detail" (màn trạng thái) */
export interface OrderDetail {
    id: string;
    items: OrderItem[];
    totalPrice: number;
    status: OrderStatus;
    isPaid: boolean;
    phone: string;
    deliveryAddress: string;
    statusHistory: StatusHistoryEntry[];
    createdAt?: string;
    note?: string;
    user?: {
        id?: string;
        _id?: string;
        username?: string;
        name?: string;
        phone?: string;
    };
}

// ─────────────────────────────────────────────
//  REVIEW / COMMENT APIs
// ─────────────────────────────────────────────

/**
 * Lấy danh sách comment của một shop/food/entity.
 * GET /api/comment/:postId?page=&limit=
 */
export async function getReviews(
    postId: string,
    token: string,
    page = 1,
    limit = 20
): Promise<{ reviews: SellerReview[]; pagination: Pagination }> {
    const res = await fetch(
        `${API_BASE}/api/comment/${postId}?page=${page}&limit=${limit}`,
        { method: "GET", headers: authHeaders(token) }
    );

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`getReviews failed: ${res.status} ${text}`);
    }

    const json = await res.json().catch(() => null);
    // BE trả paginatedResponse: { success, message, data: [...], page, limit, total }
    const reviews: SellerReview[] = json?.data ?? [];
    const pagination: Pagination = {
        page: json?.page ?? page,
        limit: json?.limit ?? limit,
        total: json?.total ?? reviews.length,
        pages: json?.pages,
    };

    return { reviews, pagination };
}

/**
 * Like / Unlike một comment.
 * PUT /api/comment/:postId/like
 * Body: { cmtId, type: 'inc' | 'dec' }
 */
export async function likeReview(
    postId: string,
    cmtId: string,
    type: "inc" | "dec",
    token: string
): Promise<SellerReview> {
    const res = await fetch(`${API_BASE}/api/comment/${postId}/like`, {
        method: "PUT",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ cmtId, type }),
    });
    return handleResponse<SellerReview>(res);
}

export async function addReview(
    postId: string,
    content: string,
    token: string
): Promise<SellerReview> {
    const res = await fetch(`${API_BASE}/api/comment/${postId}`, {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });
    return handleResponse<SellerReview>(res);
}

/**
 * Phản hồi một review từ phía seller.
 * PUT /api/comment/:postId/reply
 * Body: { cmtId, reply }
 */
export async function replyToReview(
    postId: string,
    cmtId: string,
    reply: string,
    token: string
): Promise<SellerReview> {
    const res = await fetch(`${API_BASE}/api/comment/${postId}/reply`, {
        method: "PUT",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ cmtId, reply }),
    });
    return handleResponse<SellerReview>(res);
}

/**
 * Xóa comment (soft delete).
 * DELETE /api/comment/:postId/remove
 * Body: { cmtId }
 */
export async function removeReview(
    postId: string,
    cmtId: string,
    token: string
): Promise<void> {
    const res = await fetch(`${API_BASE}/api/comment/${postId}/remove`, {
        method: "DELETE",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ cmtId }),
    });
    await handleResponse<unknown>(res);
}

// ─────────────────────────────────────────────
//  ORDER APIs
// ─────────────────────────────────────────────

/**
 * Lấy danh sách đơn hàng của cửa hàng hiện tại.
 * GET /api/orders/seller/my?page=&limit=
 */
export async function getMyOrders(
    token: string,
    page = 1,
    limit = 20
): Promise<{ orders: OrderBasic[]; pagination: Pagination }> {
    const res = await fetch(
        `${API_BASE}/api/orders/seller/my?page=${page}&limit=${limit}`,
        { method: "GET", headers: authHeaders(token) }
    );

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`getMyOrders failed: ${res.status} ${text}`);
    }

    const json = await res.json().catch(() => null);
    const orders: OrderBasic[] = json?.data ?? [];
    const pagination: Pagination = {
        page: json?.page ?? page,
        limit: json?.limit ?? limit,
        total: json?.total ?? orders.length,
    };

    return { orders, pagination };
}

/**
 * Lấy chi tiết một đơn hàng.
 * GET /api/orders/:orderId
 */
export async function getOrderById(
    orderId: string,
    token: string
): Promise<OrderDetail> {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: "GET",
        headers: authHeaders(token),
    });
    return handleResponse<OrderDetail>(res);
}

/**
 * Cập nhật trạng thái đơn hàng (seller).
 * PATCH /api/orders/:orderId/seller-status
 * Body: { status }
 */
export async function updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    token: string
): Promise<OrderDetail> {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/seller-status`, {
        method: "PATCH",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    return handleResponse<OrderDetail>(res);
}

/**
 * Hủy đơn hàng.
 * POST /api/orders/:orderId/cancel
 */
export async function cancelOrder(
    orderId: string,
    token: string
): Promise<OrderDetail> {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: authHeaders(token),
    });
    return handleResponse<OrderDetail>(res);
}

// ─────────────────────────────────────────────
//  Utility helpers (FE-side)
// ─────────────────────────────────────────────

/** Map OrderStatus → label tiếng Việt */
export function getStatusLabel(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
        PENDING: "Chờ xác nhận",
        CONFIRMED: "Đang chuẩn bị",
        PREPARING: "Đang chuẩn bị",
        DELIVERING: "Đang giao",
        COMPLETED: "Hoàn thành",
        CANCELLED: "Đã hủy",
    };
    return map[status] ?? status;
}

/** Map OrderStatus → màu badge */
export function getStatusColor(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
        PENDING: "#FF9500",
        CONFIRMED: "#5856D6",
        PREPARING: "#5856D6",
        DELIVERING: "#34AADC",
        COMPLETED: "#1EA64A",
        CANCELLED: "#E84040",
    };
    return map[status] ?? "#8C96A4";
}

/** Bước tiến theo status (dùng cho progress tracker) */
export function getProgressStep(status: OrderStatus): number {
    const steps: Record<OrderStatus, number> = {
        PENDING: 1,
        CONFIRMED: 1,
        PREPARING: 2,
        DELIVERING: 3,
        COMPLETED: 4,
        CANCELLED: 0,
    };
    return steps[status] ?? 1;
}

/** Các chuyển trạng thái được phép (FE validation) */
export const ALLOWED_NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PREPARING", "CANCELLED"],
    PREPARING: ["DELIVERING"],
    DELIVERING: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
};

/** Format thời gian từ ISO string */
export function formatOrderTime(isoString?: string): string {
    if (!isoString) return "";
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;

    const diffHours = Math.floor(diffMins / 60);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");

    if (diffHours < 24) {
        return `${hh}:${mm}`;
    }

    const dd = d.getDate().toString().padStart(2, "0");
    const mo = (d.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mo}/${yyyy}, ${hh}:${mm}`;
}

/** Format tên user từ populated userId */
export function getReviewerName(userId: CommentUser | string): string {
    if (typeof userId === "string") return "Người dùng";
    return userId.name ?? userId.username ?? "Người dùng";
}

/** Lấy avatar URL từ populated userId */
export function getReviewerAvatar(
    userId: CommentUser | string
): string | null {
    if (typeof userId === "string") return null;
    return userId.avatar ?? null;
}
