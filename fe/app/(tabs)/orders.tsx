import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { readAuthTokens } from "@/services/auth-session";
import {
  FoodPreview,
  OrderHistoryDetail,
  OrderHistorySummary,
  getFoodPreview,
  getMyOrderHistory,
  getOrderHistoryDetail,
} from "@/services/order-history";

const PRIMARY = "#1E7A2E";
const PRIMARY_SOFT = "#E1F0E3";
const BG = "#D8EAD9";
const CARD_BG = "#FFFFFF";
const TEXT_DARK = "#1F2C27";
const TEXT_MUTED = "#708178";
const BORDER = "#E4EEE7";

type EnrichedOrder = OrderHistoryDetail & {
  createdAtValue: Date | null;
  primaryFood: FoodPreview | null;
};

const PAGE_SIZE = 6;

function formatMoney(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatHistoryDate(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatHistoryTime(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function objectIdToDate(id: string) {
  if (!id || id.length < 8) {
    return null;
  }

  const seconds = Number.parseInt(id.slice(0, 8), 16);

  if (Number.isNaN(seconds)) {
    return null;
  }

  return new Date(seconds * 1000);
}

function getStatusLabel(status: OrderHistorySummary["status"]) {
  switch (status) {
    case "PENDING":
    case "CONFIRMED":
    case "PREPARING":
    case "DELIVERING":
      return "GIAO HÀNG";
    case "COMPLETED":
      return "GIAO XONG";
    case "CANCELLED":
      return "ĐÃ HỦY";
    default:
      return status;
  }
}

function getStatusBadgeStyle(status: OrderHistorySummary["status"]) {
  if (status === "COMPLETED") {
    return { backgroundColor: "#8DF0A3", color: "#0D5D24" };
  }

  if (status === "CANCELLED") {
    return { backgroundColor: "#FFD8D8", color: "#B03A3A" };
  }

  return { backgroundColor: "#D5F4D7", color: PRIMARY };
}

function getFoodImage(food?: FoodPreview | null) {
  const image = food?.listUrlImg?.find(Boolean);

  return image ? { uri: image } : require("@/assets/images/bun-bo-hue-detail-2.png");
}

function OrderSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.skeletonThumb} />
        <View style={{ flex: 1, gap: 10 }}>
          <View style={[styles.skeletonLine, { width: "70%" }]} />
          <View style={[styles.skeletonLine, { width: "45%" }]} />
          <View style={[styles.skeletonLine, { width: "55%", height: 24 }]} />
        </View>
      </View>
      <View style={styles.divider} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={[styles.skeletonButton, { flex: 1 }]} />
        <View style={[styles.skeletonButton, { flex: 1 }]} />
      </View>
    </View>
  );
}

function OrderCard({
  order,
  onRepeat,
  onReview,
}: {
  order: EnrichedOrder;
  onRepeat: () => void;
  onReview: () => void;
}) {
  const firstItem = order.items?.[0];
  const itemCount = order.items?.length ?? 0;
  const dateLabel = formatHistoryDate(order.createdAtValue);
  const timeLabel = formatHistoryTime(order.createdAtValue);
  const badge = getStatusBadgeStyle(order.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.thumbWrap}>
          <Image source={getFoodImage(order.primaryFood)} style={styles.thumb} />
          <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
            <Text style={[styles.statusBadgeText, { color: badge.color }]}>{getStatusLabel(order.status)}</Text>
          </View>
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.foodName} numberOfLines={1}>
            {firstItem?.name || "Món đã đặt"}
          </Text>
          <Text style={styles.metaText} numberOfLines={1}>
            {dateLabel || ""}{dateLabel && timeLabel ? " • " : ""}{timeLabel || ""}
          </Text>
          <Text style={styles.priceText}>{formatMoney(order.totalPrice)}</Text>
          <Text style={styles.smallNote} numberOfLines={1}>
            {itemCount > 1 ? `${itemCount} món trong đơn` : firstItem?.quantity ? `${firstItem.quantity} món` : "Đơn hàng đã được xác nhận"}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} activeOpacity={0.85} onPress={onRepeat}>
          <Text style={styles.secondaryButtonText}>Mua lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            order.status === "COMPLETED" ? styles.primaryButton : styles.mutedButton,
          ]}
          activeOpacity={0.85}
          onPress={order.status === "COMPLETED" ? onReview : onRepeat}
        >
          <Text style={order.status === "COMPLETED" ? styles.primaryButtonText : styles.mutedButtonText}>
            {order.status === "COMPLETED" ? "Đánh giá" : "Xem chi tiết"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function OrderHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<EnrichedOrder[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const hasMore = orders.length < total;

  const completedOrders = orders.filter((order) => order.status === "COMPLETED");

  const loadPage = useCallback(
    async (pageToLoad: number, append: boolean) => {
      const tokens = await readAuthTokens("tokens");

      if (!tokens?.accessToken) {
        router.replace("/signin");
        return;
      }

      const response = await getMyOrderHistory(tokens.accessToken, pageToLoad, PAGE_SIZE);
      setTotal(response.pagination.total ?? 0);
      setPage(response.pagination.page ?? pageToLoad);

      const completedSummaries = response.orders.filter((summary) => summary.status === "COMPLETED");

      const details = await Promise.allSettled(
        completedSummaries.map(async (summary) => {
          const detail = await getOrderHistoryDetail(tokens.accessToken, summary.id);
          const primaryFoodId = detail.items?.[0]?.food;
          const primaryFood = primaryFoodId ? await getFoodPreview(primaryFoodId) : null;

          return {
            ...detail,
            createdAtValue: objectIdToDate(detail.id) ?? objectIdToDate(summary.id),
            primaryFood,
          } satisfies EnrichedOrder;
        }),
      );

      const nextOrders = details
        .filter((result): result is PromiseFulfilledResult<EnrichedOrder> => result.status === "fulfilled")
        .map((result) => result.value);

      setOrders((current) => (append ? [...current, ...nextOrders] : nextOrders));
    },
    [],
  );

  const loadInitial = useCallback(async () => {
    try {
      setError("");
      await loadPage(1, false);
    } catch (issue) {
      const message = issue instanceof Error ? issue.message : "Không thể tải lịch sử đơn hàng.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [loadPage]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadInitial();
  };

  const onLoadMore = () => {
    if (loadingMore || loading || !hasMore) {
      return;
    }

    setLoadingMore(true);
    void loadPage(page + 1, true)
      .catch((issue) => {
        const message = issue instanceof Error ? issue.message : "Không thể tải thêm đơn hàng.";
        setError(message);
      })
      .finally(() => setLoadingMore(false));
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ gap: 16 }}>
          <OrderSkeleton />
          <OrderSkeleton />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="alert-circle-outline" size={54} color="#88A091" />
          <Text style={styles.emptyTitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadInitial} activeOpacity={0.85}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!completedOrders.length) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="receipt-text-outline" size={58} color="#94A99C" />
          <Text style={styles.emptyTitle}>Chưa có đơn hàng hoàn thành</Text>
          <Text style={styles.emptySubtitle}>Những đơn hàng đã giao xong sẽ xuất hiện tại đây.</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>Lịch sử đơn hàng</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.subtitle}>Chào mừng trở lại! Xem lại những hương vị tuyệt vời bạn đã thưởng thức.</Text>

      <View style={styles.listWrap}>
        <View style={{ paddingHorizontal: 16, flex: 1 }}>
          {loading || error || !completedOrders.length ? (
            renderContent()
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={PRIMARY}
                  colors={[PRIMARY]}
                />
              }
              contentContainerStyle={{ paddingBottom: 112, gap: 16 }}
            >
              {completedOrders.map((item, index) => (
                <View key={item.id} style={{ gap: 16 }}>
                  {index > 0 ? <View style={{ height: 0 }} /> : null}
                  <OrderCard
                    order={item}
                    onRepeat={() => {
                      const firstItem = item.items?.[0];
                      if (firstItem?.food) {
                        router.push({ pathname: "/food-detail", params: { id: firstItem.food } });
                      }
                    }}
                    onReview={() => router.push("/review")}
                  />
                </View>
              ))}

              {hasMore ? (
                <TouchableOpacity style={styles.loadMoreButton} onPress={onLoadMore} activeOpacity={0.85}>
                  {loadingMore ? (
                    <ActivityIndicator color={PRIMARY} />
                  ) : (
                    <>
                      <Text style={styles.loadMoreText}>Xem thêm đơn hàng cũ</Text>
                      <Ionicons name="chevron-down" size={16} color={PRIMARY} />
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontFamily: "Montserrat-Bold",
    color: TEXT_DARK,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  subtitle: {
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 10,
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Montserrat-Medium",
  },
  listWrap: {
    flex: 1,
    paddingBottom: 0,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 30,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#24422A",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  thumbWrap: {
    width: 92,
    height: 92,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: PRIMARY_SOFT,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  statusBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: "center",
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: "Montserrat-Bold",
    letterSpacing: 0.4,
  },
  infoColumn: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 8,
  },
  foodName: {
    color: TEXT_DARK,
    fontSize: 18,
    fontFamily: "Montserrat-Bold",
  },
  metaText: {
    marginTop: 4,
    color: TEXT_MUTED,
    fontSize: 12,
    fontFamily: "Montserrat-Medium",
  },
  priceText: {
    marginTop: 10,
    color: PRIMARY,
    fontSize: 22,
    fontFamily: "Montserrat-ExtraBold",
  },
  smallNote: {
    marginTop: 4,
    color: TEXT_MUTED,
    fontSize: 11,
    fontFamily: "Montserrat-Medium",
  },
  divider: {
    height: 1,
    backgroundColor: "#E1ECE3",
    marginVertical: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    backgroundColor: "#86F0A1",
  },
  secondaryButtonText: {
    color: "#165D2A",
    fontSize: 14,
    fontFamily: "Montserrat-Bold",
  },
  primaryButton: {
    backgroundColor: PRIMARY,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Montserrat-Bold",
  },
  mutedButton: {
    backgroundColor: "#FFD44C",
  },
  mutedButtonText: {
    color: "#715100",
    fontSize: 14,
    fontFamily: "Montserrat-Bold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    color: TEXT_DARK,
    fontSize: 16,
    fontFamily: "Montserrat-SemiBold",
    textAlign: "center",
  },
  emptySubtitle: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontFamily: "Montserrat-Medium",
    textAlign: "center",
    lineHeight: 19,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
  },
  loadMoreButton: {
    alignSelf: "center",
    marginTop: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  loadMoreText: {
    color: PRIMARY,
    fontSize: 14,
    fontFamily: "Montserrat-Bold",
  },
  skeletonThumb: {
    width: 92,
    height: 92,
    borderRadius: 26,
    backgroundColor: "#D8E6DB",
  },
  skeletonLine: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#D8E6DB",
  },
  skeletonButton: {
    height: 44,
    borderRadius: 999,
    backgroundColor: "#D8E6DB",
  },
});
