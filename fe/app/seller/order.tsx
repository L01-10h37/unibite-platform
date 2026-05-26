/**
 * order.tsx – Màn hình Danh sách Đơn hàng (người bán)
 */

import {
  formatOrderTime,
  getMyOrders,
  getStatusColor,
  getStatusLabel,
  type OrderBasic,
  type OrderStatus,
} from "@/services/seller-api";
import { readAuthTokens } from "@/services/auth-session";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Design tokens ───────────────────────────
const PRIMARY = "#1EA64A";
const BG = "#EBF5F0";
const CARD_BG = "#FFFFFF";
const BORDER = "#E2EDE5";
const TEXT_DARK = "#2A3E2F";
const TEXT_MUTED = "#7C9A82";

type OrderTab = "all" | "pending" | "preparing" | "delivering" | "completed" | "failed";

const TABS: { key: OrderTab; label: string; statuses: OrderStatus[] }[] = [
  { key: "all", label: "Tất cả", statuses: [] },
  { key: "pending", label: "Chờ xác nhận", statuses: ["PENDING"] },
  { key: "preparing", label: "Chuẩn bị", statuses: ["CONFIRMED", "PREPARING"] },
  { key: "delivering", label: "Đang giao", statuses: ["DELIVERING"] },
  { key: "completed", label: "Thành công", statuses: ["COMPLETED"] },
  { key: "failed", label: "Thất bại", statuses: ["CANCELLED"] },
];

function OrderSkeleton() {
  return (
    <View style={[styles.orderCard, { gap: 10 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={[styles.skeleton, { width: "40%", height: 12 }]} />
        <View style={[styles.skeleton, { width: 80, height: 20, borderRadius: 10 }]} />
      </View>
      <View style={[styles.skeleton, { width: "100%", height: 1 }]} />
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <View style={[styles.skeleton, { width: 70, height: 70, borderRadius: 12 }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[styles.skeleton, { width: "60%", height: 12 }]} />
          <View style={[styles.skeleton, { width: "80%", height: 10 }]} />
          <View style={[styles.skeleton, { width: "30%", height: 11 }]} />
        </View>
      </View>
      <View style={[styles.skeleton, { width: "100%", height: 1 }]} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={[styles.skeleton, { width: "30%", height: 10 }]} />
        <View style={[styles.skeleton, { width: "40%", height: 12 }]} />
      </View>
    </View>
  );
}

function OrderCard({
  order,
  onPress,
}: {
  order: OrderBasic;
  onPress: () => void;
}) {
  const statusColor = getStatusColor(order.status);
  
  // Custom display status labels to match the screenshots
  let statusText = getStatusLabel(order.status);
  if (order.status === "PENDING") {
    statusText = "Chờ xác nhận";
  } else if (order.status === "CONFIRMED" || order.status === "PREPARING") {
    statusText = "Đang chuẩn bị";
  } else if (order.status === "DELIVERING") {
    statusText = "Đang giao";
  } else if (order.status === "COMPLETED") {
    statusText = "Hoàn thành";
  } else if (order.status === "CANCELLED") {
    statusText = "Thất bại";
  }

  const customerName = order.user?.name ?? order.user?.username ?? "Khách hàng";
  const formattedTime = order.createdAt ? formatOrderTime(order.createdAt) : "";

  return (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>
          {customerName}: <Text style={styles.orderTime}>{formattedTime}</Text>
        </Text>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusText}
        </Text>
      </View>

      {/* Items list */}
      <View style={styles.itemsList}>
        {order.items?.map((item, idx) => (
          <View key={idx} style={[styles.itemRow, idx > 0 && { marginTop: 14 }]}>
            <Image
              source={
                item.image
                  ? { uri: item.image }
                  : require("@/assets/images/bun-bo-hue-detail-1.png")
              }
              style={styles.foodImage}
            />
            <View style={styles.itemInfo}>
              <View style={styles.itemNameRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
              </View>

              <Text style={styles.itemNote} numberOfLines={2}>
                Ghi chú:{"\n"}- {item.note || order.note || "Không có ghi chú"}
              </Text>

              <Text style={styles.itemPrice}>
                {item.price.toLocaleString("vi-VN")} VND
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Bottom section */}
      <View style={styles.cardDivider} />
      
      <View style={styles.cardFooter}>
        <Text style={styles.addressText} numberOfLines={1}>
          {order.deliveryAddress || "Chưa có địa chỉ"}
        </Text>
        <Text style={styles.totalText}>
          Tổng số tiền: <Text style={styles.totalBold}>{order.totalPrice.toLocaleString("vi-VN")} VND</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function OrderListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [orders, setOrders] = useState<OrderBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const LIMIT = 20;

  const fetchOrders = useCallback(async (reset = false) => {
    if (reset) {
      pageRef.current = 1;
      hasMoreRef.current = true;
    }
    if (!hasMoreRef.current && !reset) return;

    try {
      const tokens = await readAuthTokens("sellerTokens");

      if (!tokens?.accessToken) {
        router.replace("/seller/signin" as any);
        return;
      }

      const { orders: fetched, pagination } = await getMyOrders(
        tokens.accessToken,
        pageRef.current,
        LIMIT
      );

      setOrders((prev) => (reset ? fetched : [...prev, ...fetched]));

      const totalLoaded = (pageRef.current - 1) * LIMIT + fetched.length;
      hasMoreRef.current = totalLoaded < (pagination.total ?? 0);
      pageRef.current += 1;
    } catch (e: any) {
      if (e.statusCode === 401 || e.message?.includes("401")) {
        router.replace("/seller/signin" as any);
        return;
      }
      setError(e.message ?? "Không thể tải đơn hàng.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [router]);

  // ── Auth ──
  useEffect(() => {
    (async () => {
      const tokens = await readAuthTokens("sellerTokens");
      if (!tokens?.accessToken) {
        setError("Bạn cần đăng nhập để xem đơn hàng.");
        setLoading(false);
        return;
      }
      await fetchOrders(true);
    })();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    setError(null);
    fetchOrders(true);
  };

  const onLoadMore = () => {
    if (loadingMore || !hasMoreRef.current) return;
    setLoadingMore(true);
    fetchOrders(false);
  };

  // Filter by active tab
  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((o) => {
          const tabObj = TABS.find((t) => t.key === activeTab);
          return tabObj ? tabObj.statuses.includes(o.status) : true;
        });

  // Count per tab
  const countFor = (tabKey: OrderTab) => {
    if (tabKey === "all") return orders.length;
    const tabObj = TABS.find((t) => t.key === tabKey);
    return tabObj
      ? orders.filter((o) => tabObj.statuses.includes(o.status)).length
      : 0;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng</Text>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <Ionicons name="search-outline" size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((tab) => {
            const count = countFor(tab.key);
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tab}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Text
                    style={[
                      styles.tabText,
                      isSelected && styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {count > 0 && (
                    <View
                      style={[
                        styles.tabCountBadge,
                        isSelected
                          ? { backgroundColor: PRIMARY }
                          : { backgroundColor: "#D0E8D8" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabCountText,
                          isSelected
                            ? { color: "#fff" }
                            : { color: "#5A7E62" },
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </View>
                {isSelected && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Filter/Sort Sub-row */}
      <View style={styles.filterRow}>
        <View style={styles.sortBtn}>
          <Text style={styles.sortText}>Sắp xếp đơn mới nhất</Text>
          <Ionicons name="chevron-down" size={14} color={TEXT_MUTED} />
        </View>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="filter-variant" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#E84040" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} activeOpacity={0.8}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main List */}
      {loading ? (
        <View style={{ padding: 14, gap: 12 }}>
          {[1, 2, 3].map((k) => <OrderSkeleton key={k} />)}
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() =>
                router.push(`/seller/order-detail?id=${item.id}` as any)
              }
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PRIMARY}
              colors={[PRIMARY]}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={PRIMARY} />
            ) : null
          }
          ListEmptyComponent={
            !loading && !error ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="receipt-text-outline"
                  size={52}
                  color="#C0D4C4"
                />
                <Text style={styles.emptyTitle}>Không có đơn hàng nào</Text>
                <Text style={styles.emptySubtitle}>
                  Đơn hàng trong danh mục này sẽ xuất hiện tại đây.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },

  tabsWrapper: {
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 0,
  },
  tab: {
    marginRight: 20,
    paddingBottom: 10,
    paddingTop: 6,
    position: "relative",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_MUTED,
  },
  tabTextActive: {
    color: PRIMARY,
    fontWeight: "bold",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: PRIMARY,
    borderRadius: 2,
  },
  tabCountBadge: {
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  tabCountText: {
    fontSize: 9,
    fontWeight: "bold",
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortText: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: "600",
  },
  filterBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF0F0",
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFD0D0",
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: "#9A3030",
  },
  retryText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#E84040",
  },

  listContent: { padding: 12, paddingTop: 2 },

  // Order Card Design
  orderCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: TEXT_DARK,
  },
  orderTime: {
    fontSize: 13,
    fontWeight: "normal",
    color: TEXT_MUTED,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
  },

  itemsList: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  foodImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#F2F7F3",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "bold",
    color: TEXT_DARK,
    flex: 1,
    marginRight: 8,
  },
  itemQty: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: "500",
  },
  itemNote: {
    fontSize: 11,
    color: TEXT_MUTED,
    lineHeight: 15,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_DARK,
    textAlign: "right",
  },

  cardDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressText: {
    fontSize: 12,
    color: TEXT_MUTED,
    flex: 1,
    marginRight: 10,
  },
  totalText: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: "500",
  },
  totalBold: {
    fontSize: 13,
    fontWeight: "bold",
    color: TEXT_DARK,
  },

  // Skeleton
  skeleton: {
    backgroundColor: "#E8F0EA",
    borderRadius: 6,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 15,
    color: TEXT_MUTED,
    fontWeight: "600",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: "center",
    lineHeight: 20,
  },
});
