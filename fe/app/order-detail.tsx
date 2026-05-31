import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
  getOrderHistoryDetail,
  getOrderProgressStep,
  getOrderStatusColor,
  getOrderStatusLabel,
} from "@/services/order-history";

const BG = "#EBF5F0";
const CARD_BG = "#FFFFFF";
const BORDER = "#E2EDE5";
const PRIMARY = "#1EA64A";
const NAVY = "#2B4162";
const TEXT_DARK = "#2A3E2F";
const TEXT_MUTED = "#7C9A82";
type BuyerOrderDetail = OrderHistoryDetail & { foodPreviews: Record<string, FoodPreview | null> };

const STEPS: { status: Exclude<OrderStatus, "PENDING" | "CANCELLED">; icon: string; label: string }[] = [
  { status: "CONFIRMED", icon: "check", label: "Xác nhận" },
  { status: "PREPARING", icon: "food-fork-drink", label: "Chuẩn bị" },
  { status: "DELIVERING", icon: "motorcycle", label: "Đang giao" },
  { status: "COMPLETED", icon: "archive-check-outline", label: "Đã giao" },
];

function formatMoney(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatTime(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
}

function ProgressTracker({ status }: { status: OrderStatus }) {
  const currentStep = getOrderProgressStep(status);
  const isCancelled = status === "CANCELLED";

  if (status === "PENDING" || isCancelled) {
    return (
      <View style={styles.pendingBox}>
        <MaterialCommunityIcons
          name={isCancelled ? "close-circle-outline" : "timer-sand"}
          size={22}
          color={getOrderStatusColor(status)}
        />
        <Text style={[styles.pendingText, { color: getOrderStatusColor(status) }]}>
          {isCancelled
            ? "Đơn hàng đã bị hủy"
            : "Đơn hàng đang chờ người bán xác nhận"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.progressWrapper}>
      {STEPS.map((step, index) => {
        const stepNum = index + 1;
        const done = currentStep >= stepNum;
        const active = currentStep === stepNum;
        const last = index === STEPS.length - 1;

        return (
          <View key={step.status} style={styles.stepGroup}>
            <View style={[styles.stepNode, done && styles.nodeDone, active && styles.nodeActive]}>
              <MaterialCommunityIcons
                name={step.icon as any}
                size={16}
                color={done ? "#FFFFFF" : "#B0C4B8"}
              />
            </View>
            <Text style={[styles.stepLabel, done && styles.labelDone]}>{step.label}</Text>
            {!last ? <View style={[styles.connector, done && styles.connectorDone]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

async function enrichOrderFoodPreviews(order: OrderHistoryDetail): Promise<BuyerOrderDetail> {
  const foodIds = [...new Set((order.items ?? []).map((item) => item.food).filter(Boolean))];
  const previewEntries = await Promise.all(
    foodIds.map(async (foodId) => [foodId, await getFoodPreview(foodId)] as const),
  );

  return {
    ...order,
    foodPreviews: Object.fromEntries(previewEntries),
  };
}

function getFoodImage(order: BuyerOrderDetail, item: OrderHistoryDetail["items"][number]) {
  const image = item.image || order.foodPreviews[item.food]?.listUrlImg?.find(Boolean);
  return image ? { uri: image } : require("@/assets/images/bun-bo-hue-detail-1.png");
}

export default function BuyerOrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<BuyerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const loadOrder = useCallback(async () => {
    try {
      const tokens = await readAuthTokens("tokens");

      if (!tokens?.accessToken || !id) {
        router.replace("/signin");
        return;
      }

      setError("");
      const data = await getOrderHistoryDetail(tokens.accessToken, id);
      setOrder(await enrichOrderFoodPreviews(data));
    } catch (issue) {
      const message = issue instanceof Error ? issue.message : "Không thể tải đơn hàng.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const handleCancel = () => {
    if (!order) {
      return;
    }

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

              setUpdating(true);
              const updated = await cancelBuyerOrder(tokens.accessToken, order.id);
              setOrder({ ...updated, foodPreviews: order.foodPreviews });
            } catch (issue) {
              const message = issue instanceof Error ? issue.message : "Không thể hủy đơn hàng.";
              Alert.alert("Không thể hủy", message);
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={52} color="#9BB6A2" />
        <Text style={styles.errorText}>{error || "Không tìm thấy đơn hàng."}</Text>
        <TouchableOpacity style={styles.primaryButtonFull} onPress={() => router.back()}>
          <Text style={styles.primaryButtonFullText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = getOrderStatusColor(order.status);
  const canCancel = order.status === "PENDING";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={22} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trạng thái đơn hàng</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        <View style={styles.heroSection}>
          <View style={[styles.heroIconCircle, { backgroundColor: `${statusColor}22` }]}>
            <MaterialCommunityIcons
              name={order.status === "CANCELLED" ? "close" : order.status === "COMPLETED" ? "check-all" : "receipt-text-clock-outline"}
              size={36}
              color={statusColor}
            />
          </View>
          <Text style={styles.heroTitle}>{getOrderStatusLabel(order.status)}</Text>
          <Text style={styles.heroSubtitle}>Mã đơn #{order.id.slice(-6).toUpperCase()}</Text>
        </View>

        <View style={styles.card}>
          <ProgressTracker status={order.status} />
        </View>

        <View style={styles.card}>
          <View style={styles.paymentStatusRow}>
            <MaterialCommunityIcons
              name={order.isPaid ? "check-circle" : "clock-outline"}
              size={20}
              color={order.isPaid ? PRIMARY : TEXT_MUTED}
            />
            <View style={styles.paymentStatusTextWrap}>
              <Text style={styles.paymentStatusLabel}>Trạng thái thanh toán</Text>
              <Text style={[styles.paymentStatusValue, { color: order.isPaid ? PRIMARY : TEXT_MUTED }]}>
                {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Tóm tắt đơn hàng</Text>
            <Text style={styles.totalText}>{formatMoney(order.totalPrice)}</Text>
          </View>

          {order.items?.map((item, index) => (
            <View key={`${item.food}-${index}`} style={[styles.itemRow, index > 0 && { marginTop: 14 }]}>
              <Image
                source={getFoodImage(order, item)}
                style={styles.foodImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.itemMeta}>{formatMoney(item.price)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={PRIMARY} />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Địa chỉ nhận hàng</Text>
              <Text style={styles.infoValue}>{order.deliveryAddress}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: 16 }]}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={PRIMARY} />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{order.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.summaryTitle}>Lịch sử trạng thái</Text>
          <View style={{ marginTop: 12, gap: 12 }}>
            {(order.statusHistory ?? []).map((entry, index) => (
              <View key={`${entry.status}-${entry.updatedAt}-${index}`} style={styles.historyRow}>
                <View style={[styles.historyDot, { backgroundColor: getOrderStatusColor(entry.status) }]} />
                <View>
                  <Text style={styles.historyStatus}>{getOrderStatusLabel(entry.status)}</Text>
                  <Text style={styles.historyTime}>{formatTime(entry.updatedAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {canCancel ? (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.85}
            disabled={updating}
            onPress={handleCancel}
          >
            {updating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: BG },
  loadingText: { marginTop: 10, color: TEXT_MUTED, fontFamily: "Montserrat-Medium" },
  errorText: { marginTop: 12, marginBottom: 16, color: TEXT_DARK, textAlign: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: TEXT_DARK },
  scrollContent: { padding: 16, gap: 14 },
  heroSection: { alignItems: "center", paddingVertical: 12 },
  heroIconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: NAVY, textAlign: "center" },
  heroSubtitle: { marginTop: 4, fontSize: 13, color: TEXT_MUTED },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pendingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  pendingText: { flex: 1, fontSize: 14, fontWeight: "700" },
  progressWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  stepGroup: { alignItems: "center", flex: 1, position: "relative" },
  stepNode: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E8EFE9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    zIndex: 2,
  },
  nodeDone: { backgroundColor: PRIMARY },
  nodeActive: { backgroundColor: NAVY },
  stepLabel: { fontSize: 10, fontWeight: "600", color: "#8EA898", textAlign: "center" },
  labelDone: { color: PRIMARY, fontWeight: "800" },
  connector: {
    position: "absolute",
    top: 19,
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: "#E0EBE3",
    zIndex: 1,
  },
  connectorDone: { backgroundColor: PRIMARY },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  summaryTitle: { fontSize: 16, fontWeight: "800", color: TEXT_DARK },
  totalText: { fontSize: 17, fontWeight: "900", color: PRIMARY },
  itemRow: { flexDirection: "row", alignItems: "center" },
  foodImage: { width: 58, height: 58, borderRadius: 12, backgroundColor: "#F2F7F3" },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: "800", color: TEXT_DARK },
  itemMeta: { marginTop: 4, fontSize: 13, color: TEXT_MUTED },
  infoRow: { flexDirection: "row", gap: 12 },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: "800", color: TEXT_MUTED, textTransform: "uppercase" },
  infoValue: { marginTop: 3, fontSize: 14, fontWeight: "600", color: TEXT_DARK, lineHeight: 19 },
  paymentStatusRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  paymentStatusTextWrap: { flex: 1 },
  paymentStatusLabel: { fontSize: 11, fontWeight: "800", color: TEXT_MUTED, textTransform: "uppercase" },
  paymentStatusValue: { marginTop: 3, fontSize: 14, fontWeight: "700", lineHeight: 19 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyStatus: { fontSize: 14, fontWeight: "700", color: TEXT_DARK },
  historyTime: { marginTop: 2, fontSize: 12, color: TEXT_MUTED },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  cancelButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D92D20",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  primaryButtonFull: {
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 22,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonFullText: { color: "#FFFFFF", fontWeight: "800" },
});
