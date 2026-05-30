import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import { readAuthTokens } from "@/services/auth-session";
import {
  FoodPreview,
  OrderHistoryDetail,
  OrderStatus,
  cancelBuyerOrder,
  getFoodPreview,
  getMyOrderHistory,
  getOrderHistoryDetail,
  getOrderStatusColor,
  getOrderStatusLabel,
} from "@/services/order-history";

const PRIMARY = "#1EA64A";
const BG = "#EBF5F0";
const CARD_BG = "#FFFFFF";
const BORDER = "#E2EDE5";
const TEXT_DARK = "#2A3E2F";
const TEXT_MUTED = "#7C9A82";
const LIMIT = 20;

type OrderTab = "all" | "pending" | "preparing" | "delivering" | "completed" | "failed";
type BuyerOrder = OrderHistoryDetail & { primaryFood: FoodPreview | null };

const TABS: { key: OrderTab; label: string; statuses: OrderStatus[] }[] = [
  { key: "all", label: "Tất cả", statuses: [] },
  { key: "pending", label: "Chờ xác nhận", statuses: ["PENDING"] },
  { key: "preparing", label: "Chuẩn bị", statuses: ["CONFIRMED", "PREPARING"] },
  { key: "delivering", label: "Đang giao", statuses: ["DELIVERING"] },
  { key: "completed", label: "Thành công", statuses: ["COMPLETED"] },
  { key: "failed", label: "Thất bại", statuses: ["CANCELLED"] },
];

function formatOrderTime(isoString?: string) {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;

  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");

  if (diffMins < 1440) return `${hh}:${mm}`;

  const dd = date.getDate().toString().padStart(2, "0");
  const mo = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${dd}/${mo}/${date.getFullYear()}, ${hh}:${mm}`;
}

function formatMoney(value: number) {
  return `${value.toLocaleString("vi-VN")} VND`;
}

function getDisplayStatus(status: OrderStatus) {
  if (status === "PENDING") return "Chờ xác nhận";
  if (status === "CONFIRMED" || status === "PREPARING") return "Đang chuẩn bị";
  if (status === "DELIVERING") return "Đang giao";
  if (status === "COMPLETED") return "Hoàn thành";
  if (status === "CANCELLED") return "Thất bại";
  return getOrderStatusLabel(status);
}

function getFoodImage(order: BuyerOrder) {
  const image = order.primaryFood?.listUrlImg?.find(Boolean) || order.items?.[0]?.image;
  return image ? { uri: image } : require("@/assets/images/bun-bo-hue-detail-1.png");
}

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
      <View style={[styles.skeleton, { width: "100%", height: 36, borderRadius: 18 }]} />
    </View>
  );
}

function OrderCard({
  order,
  cancelling,
  onCancel,
  onPress,
  onRepeat,
  onReview,
}: {
  order: BuyerOrder;
  cancelling: boolean;
  onCancel: () => void;
  onPress: () => void;
  onRepeat: () => void;
  onReview: () => void;
}) {
  const statusColor = getOrderStatusColor(order.status);
  const firstItem = order.items?.[0];

  return (
    <TouchableOpacity style={styles.orderCard} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>
          #{order.id.slice(-6).toUpperCase()}:{" "}
          <Text style={styles.orderTime}>{formatOrderTime(order.createdAt)}</Text>
        </Text>
        <Text style={[styles.statusText, { color: statusColor }]}>{getDisplayStatus(order.status)}</Text>
      </View>

      <View style={styles.itemsList}>
        {order.items?.map((item, index) => (
          <View key={`${item.food}-${index}`} style={[styles.itemRow, index > 0 && { marginTop: 14 }]}>
            <Image source={index === 0 ? getFoodImage(order) : require("@/assets/images/bun-bo-hue-detail-1.png")} style={styles.foodImage} />
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

              <Text style={styles.itemPrice}>{formatMoney(item.price)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardFooter}>
        <Text style={styles.addressText} numberOfLines={1}>
          {order.deliveryAddress || "Chưa có địa chỉ"}
        </Text>
        <Text style={styles.totalText}>
          Tổng số tiền: <Text style={styles.totalBold}>{formatMoney(order.totalPrice)}</Text>
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          activeOpacity={0.85}
          onPress={order.status === "COMPLETED" ? onReview : onRepeat}
        >
          <Text style={styles.secondaryButtonText}>{order.status === "COMPLETED" ? "Đánh giá" : "Mua lại"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} activeOpacity={0.85} onPress={onPress}>
          <Text style={styles.primaryButtonText}>Xem trạng thái</Text>
        </TouchableOpacity>
      </View>

      {order.status === "PENDING" ? (
        <TouchableOpacity
          style={styles.cancelButton}
          activeOpacity={0.85}
          disabled={cancelling}
          onPress={onCancel}
        >
          {cancelling ? (
            <ActivityIndicator color="#B42318" />
          ) : (
            <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
          )}
        </TouchableOpacity>
      ) : null}

      {firstItem?.food ? null : null}
    </TouchableOpacity>
  );
}

export default function OrderHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  const { fromCheckout } = useLocalSearchParams();

  const enrichOrders = useCallback(async (token: string, orderIds: string[]) => {
    const details = await Promise.allSettled(
      orderIds.map(async (orderId) => {
        const detail = await getOrderHistoryDetail(token, orderId);
        const firstFoodId = detail.items?.[0]?.food;
        const primaryFood = firstFoodId ? await getFoodPreview(firstFoodId) : null;
        return { ...detail, primaryFood } satisfies BuyerOrder;
      }),
    );

    return details
      .filter((result): result is PromiseFulfilledResult<BuyerOrder> => result.status === "fulfilled")
      .map((result) => result.value);
  }, []);

  const fetchOrders = useCallback(
    async (reset = false) => {
      if (reset) {
        pageRef.current = 1;
        hasMoreRef.current = true;
      }
      if (!hasMoreRef.current && !reset) return;

      try {
        const tokens = await readAuthTokens("tokens");

        if (!tokens?.accessToken) {
          router.replace("/signin");
          return;
        }

        const { orders: summaries, pagination } = await getMyOrderHistory(tokens.accessToken, pageRef.current, LIMIT);
        const fetched = await enrichOrders(tokens.accessToken, summaries.map((item) => item.id));

        setOrders((current) => (reset ? fetched : [...current, ...fetched]));

        const totalLoaded = (pageRef.current - 1) * LIMIT + fetched.length;
        hasMoreRef.current = totalLoaded < (pagination.total ?? 0);
        pageRef.current += 1;
        setError(null);
      } catch (issue: any) {
        setError(issue.message ?? "Không thể tải đơn hàng.");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [enrichOrders],
  );

  useEffect(() => {
    void fetchOrders(true);
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    const tab = TABS.find((item) => item.key === activeTab);
    return tab ? orders.filter((order) => tab.statuses.includes(order.status)) : orders;
  }, [activeTab, orders]);

  const countFor = (tabKey: OrderTab) => {
    if (tabKey === "all") return orders.length;
    const tab = TABS.find((item) => item.key === tabKey);
    return tab ? orders.filter((order) => tab.statuses.includes(order.status)).length : 0;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setError(null);
    void fetchOrders(true);
  };

  const onLoadMore = () => {
    if (loadingMore || !hasMoreRef.current) return;
    setLoadingMore(true);
    void fetchOrders(false);
  };

  const handleCancelOrder = (order: BuyerOrder) => {
    Alert.alert(
      "Hủy đơn hàng",
      "Bạn chỉ có thể hủy khi người bán chưa xác nhận. Bạn muốn hủy đơn này?",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Hủy đơn",
          style: "destructive",
          onPress: async () => {
            try {
              const tokens = await readAuthTokens("tokens");
              if (!tokens?.accessToken) {
                router.replace("/signin");
                return;
              }

              setCancellingOrderId(order.id);
              const updated = await cancelBuyerOrder(tokens.accessToken, order.id);
              setOrders((current) =>
                current.map((item) =>
                  item.id === order.id ? { ...item, ...updated, primaryFood: item.primaryFood } : item,
                ),
              );
            } catch (issue) {
              const message = issue instanceof Error ? issue.message : "Không thể hủy đơn hàng.";
              Alert.alert("Không thể hủy", message);
            } finally {
              setCancellingOrderId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => {
          if (fromCheckout === 'true') {
            router.replace('/');
          } else {
            router.back();
          }
        }}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng</Text>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <Ionicons name="search-outline" size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map((tab) => {
            const count = countFor(tab.key);
            const selected = activeTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
                  {count > 0 ? (
                    <View style={[styles.tabCountBadge, selected ? { backgroundColor: PRIMARY } : { backgroundColor: "#D0E8D8" }]}>
                      <Text style={[styles.tabCountText, selected ? { color: "#fff" } : { color: "#5A7E62" }]}>{count}</Text>
                    </View>
                  ) : null}
                </View>
                {selected ? <View style={styles.tabIndicator} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.sortBtn}>
          <Text style={styles.sortText}>Sắp xếp đơn mới nhất</Text>
          <Ionicons name="chevron-down" size={14} color={TEXT_MUTED} />
        </View>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="filter-variant" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#E84040" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} activeOpacity={0.8}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={{ padding: 14, gap: 12 }}>
          {[1, 2, 3].map((item) => <OrderSkeleton key={item} />)}
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              cancelling={cancellingOrderId === item.id}
              onCancel={() => handleCancelOrder(item)}
              onPress={() => router.push({ pathname: "/order-detail", params: { id: item.id } })}
              onRepeat={() => {
                const firstItem = item.items?.[0];
                if (firstItem?.food) router.push({ pathname: "/food-detail", params: { id: firstItem.food } });
              }}
              onReview={() => router.push("/review")}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={PRIMARY} /> : null}
          ListEmptyComponent={
            !error ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="receipt-text-outline" size={52} color="#C0D4C4" />
                <Text style={styles.emptyTitle}>Không có đơn hàng nào</Text>
                <Text style={styles.emptySubtitle}>Đơn hàng trong danh mục này sẽ xuất hiện tại đây.</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

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
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#000000" },
  tabsWrapper: { backgroundColor: CARD_BG, borderBottomWidth: 1, borderBottomColor: BORDER },
  tabsContainer: { paddingHorizontal: 16, paddingTop: 4 },
  tab: { marginRight: 20, paddingBottom: 10, paddingTop: 6, position: "relative" },
  tabText: { fontSize: 14, fontWeight: "600", color: TEXT_MUTED },
  tabTextActive: { color: PRIMARY, fontWeight: "bold" },
  tabIndicator: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2.5, backgroundColor: PRIMARY, borderRadius: 2 },
  tabCountBadge: { borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: "center" },
  tabCountText: { fontSize: 9, fontWeight: "bold" },
  filterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { fontSize: 13, color: TEXT_DARK, fontWeight: "600" },
  filterBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
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
  errorText: { flex: 1, fontSize: 12, color: "#9A3030" },
  retryText: { fontSize: 12, fontWeight: "bold", color: "#E84040" },
  listContent: { padding: 12, paddingTop: 2 },
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
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10 },
  customerName: { flex: 1, fontSize: 14, fontWeight: "bold", color: TEXT_DARK },
  orderTime: { fontSize: 13, fontWeight: "normal", color: TEXT_MUTED },
  statusText: { fontSize: 14, fontWeight: "bold" },
  itemsList: { marginBottom: 12 },
  itemRow: { flexDirection: "row", alignItems: "flex-start" },
  foodImage: { width: 70, height: 70, borderRadius: 12, backgroundColor: "#F2F7F3" },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemNameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  itemName: { fontSize: 15, fontWeight: "bold", color: TEXT_DARK, flex: 1, marginRight: 8 },
  itemQty: { fontSize: 13, color: TEXT_MUTED, fontWeight: "500" },
  itemNote: { fontSize: 11, color: TEXT_MUTED, lineHeight: 15, marginBottom: 4 },
  itemPrice: { fontSize: 13, fontWeight: "600", color: TEXT_DARK, textAlign: "right" },
  cardDivider: { height: 1, backgroundColor: BORDER, marginBottom: 10 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  addressText: { fontSize: 12, color: TEXT_MUTED, flex: 1 },
  totalText: { fontSize: 13, color: TEXT_DARK, fontWeight: "500" },
  totalBold: { fontSize: 13, fontWeight: "bold", color: TEXT_DARK },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionButton: { flex: 1, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  secondaryButton: { backgroundColor: "#DFF3E8" },
  secondaryButtonText: { color: PRIMARY, fontSize: 13, fontWeight: "bold" },
  primaryButton: { backgroundColor: PRIMARY },
  primaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "bold" },
  cancelButton: {
    height: 40,
    borderRadius: 20,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE4E2",
    borderWidth: 1,
    borderColor: "#FDA29B",
  },
  cancelButtonText: { color: "#B42318", fontSize: 13, fontWeight: "bold" },
  skeleton: { backgroundColor: "#E8F0EA", borderRadius: 6 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, color: TEXT_MUTED, fontWeight: "600", marginTop: 4 },
  emptySubtitle: { fontSize: 13, color: TEXT_MUTED, textAlign: "center", lineHeight: 20 },
});
