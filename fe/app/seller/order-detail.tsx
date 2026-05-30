/**
 * order-detail.tsx – Màn hình Trạng thái chi tiết đơn hàng
 */

import {
  ALLOWED_NEXT_STATUSES,
  cancelOrder,
  formatOrderTime,
  getFoodPreview,
  getOrderById,
  getProgressStep,
  getStatusColor,
  getStatusLabel,
  updateOrderStatus,
  type FoodPreview,
  type OrderDetail,
  type OrderStatus,
} from "@/services/seller-api";
import { readAuthTokens } from "@/services/auth-session";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
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
const NAVY = "#2B4162";
const SOFT_BLUE = "#EBF1FA";
const SOFT_GREEN = "#EAF6EE";
const TEXT_DARK = "#2A3E2F";
const TEXT_MUTED = "#7C9A82";
type SellerOrderDetail = OrderDetail & { foodPreviews: Record<string, FoodPreview | null> };

const STEPS: { status: OrderStatus; icon: string; label: string }[] = [
  { status: "CONFIRMED", icon: "check", label: "Đã xác nhận" },
  { status: "PREPARING", icon: "food-fork-drink", label: "Chuẩn bị" },
  { status: "DELIVERING", icon: "motorcycle", label: "Đang giao" },
  { status: "COMPLETED", icon: "archive-check-outline", label: "Đã giao" },
];

function ProgressTracker({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.progressWrapper}>
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep || currentStep === 4;
        const isActive = stepNum === currentStep && currentStep !== 4;
        const isLast = i === STEPS.length - 1;
        
        return (
          <View key={step.status} style={styles.stepGroup}>
            <View
              style={[
                styles.stepNode,
                isDone && styles.nodeDone,
                isActive && styles.nodeActive,
              ]}
            >
              <MaterialCommunityIcons
                name={step.icon as any}
                size={isActive ? 18 : 16}
                color={isDone || isActive ? "#fff" : "#B0C4B8"}
              />
            </View>
            <Text
              style={[
                styles.stepLabel,
                isDone && styles.labelDone,
                isActive && styles.labelActive,
              ]}
            >
              {step.label}
            </Text>
            {!isLast && (
              <View
                style={[
                  styles.connector,
                  (isDone || (currentStep > stepNum)) && styles.connectorDone,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

function Skeleton({ w, h, radius = 8 }: { w: string | number; h: number; radius?: number }) {
  return (
    <View
      style={{
        width: w as any,
        height: h,
        borderRadius: radius,
        backgroundColor: "#E8F0EA",
      }}
    />
  );
}

async function enrichOrderFoodPreviews(order: OrderDetail): Promise<SellerOrderDetail> {
  const foodIds = [...new Set((order.items ?? []).map((item) => item.food).filter(Boolean))];
  const previewEntries = await Promise.all(
    foodIds.map(async (foodId) => [foodId, await getFoodPreview(foodId)] as const)
  );

  return {
    ...order,
    foodPreviews: Object.fromEntries(previewEntries),
  };
}

function getFoodImage(order: SellerOrderDetail, item: OrderDetail["items"][number]) {
  const image = item.image || order.foodPreviews[item.food]?.listUrlImg?.find(Boolean);
  return image ? { uri: image } : require("@/assets/images/bun-bo-hue-detail-1.png");
}

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: orderId } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<SellerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const tokens = await readAuthTokens("sellerTokens");
        if (!tokens?.accessToken || !orderId) {
          setError("Không tìm thấy thông tin đơn hàng.");
          setLoading(false);
          return;
        }
        const data = await getOrderById(orderId, tokens.accessToken);
        setOrder(await enrichOrderFoodPreviews(data));
      } catch (e: any) {
        if (e.statusCode === 401 || e.message?.includes("401")) {
          router.replace("/seller/signin" as any);
          return;
        }
        setError(e.message ?? "Không thể tải đơn hàng.");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const handleStatusUpdate = async (next: OrderStatus) => {
    if (!order) return;
    Alert.alert(
      "Cập nhật trạng thái",
      `Chuyển sang "${getStatusLabel(next)}"?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            setUpdating(true);
            try {
              const tokens = await readAuthTokens("sellerTokens");

              if (!tokens?.accessToken) {
                throw new Error("missing token");
              }

              const updated = await updateOrderStatus(order.id, next, tokens.accessToken);
              setOrder({ ...updated, foodPreviews: order.foodPreviews });
            } catch {
              Alert.alert("Lỗi", "Không thể cập nhật. Thử lại sau.");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    if (!order) return;
    Alert.alert("Hủy đơn hàng", "Bạn có chắc muốn hủy đơn này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy đơn",
        style: "destructive",
        onPress: async () => {
          setUpdating(true);
          try {
            const tokens = await readAuthTokens("sellerTokens");

            if (!tokens?.accessToken) {
              throw new Error("missing token");
            }

            const updated = await cancelOrder(order.id, tokens.accessToken);
            setOrder({ ...updated, foodPreviews: order.foodPreviews });
          } catch {
            Alert.alert("Lỗi", "Không thể hủy đơn.");
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trạng thái đơn hàng</Text>
          <View style={{ width: 38 }} />
        </View>
        <ScrollView contentContainerStyle={[styles.scrollContent, { gap: 14 }]}>
          <View style={{ alignItems: "center", paddingVertical: 20, gap: 12 }}>
            <Skeleton w={76} h={76} radius={38} />
            <Skeleton w="60%" h={20} />
            <Skeleton w="80%" h={14} />
          </View>
          <View style={styles.card}><Skeleton w="100%" h={80} /></View>
          <View style={styles.card}><Skeleton w="100%" h={120} /></View>
        </ScrollView>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <MaterialCommunityIcons name="alert-circle-outline" size={52} color="#C0D4C4" />
        <Text style={[styles.headerTitle, { color: "#7A9E82", marginTop: 12, marginBottom: 12 }]}>
          {error ?? "Không tìm thấy đơn hàng"}
        </Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const step = getProgressStep(order.status);
  const isCancelled = order.status === "CANCELLED";
  const isCompleted = order.status === "COMPLETED";

  // Dynamic texts for circle status hero to match the screenshots
  let statusHeroTitle = "Đơn hàng đang chuẩn bị";
  let statusHeroSubText = "Vui lòng chuyển trạng thái đang giao nếu đã chuẩn bị xong";

  if (order.status === "PENDING") {
    statusHeroTitle = "Đơn hàng đang chờ";
    statusHeroSubText = "Vui lòng xác nhận đơn hàng để bắt đầu chuẩn bị";
  } else if (order.status === "CONFIRMED") {
    statusHeroTitle = "Đơn hàng đã xác nhận";
    statusHeroSubText = "Vui lòng chuẩn bị món ăn cho khách hàng";
  } else if (order.status === "PREPARING") {
    statusHeroTitle = "Đơn hàng đang chuẩn bị";
    statusHeroSubText = "Vui lòng chuyển trạng thái đang giao nếu đã chuẩn bị xong";
  } else if (order.status === "DELIVERING") {
    statusHeroTitle = "Đơn hàng đang giao";
    statusHeroSubText = "Đơn hàng đang được shipper giao đến khách";
  } else if (order.status === "COMPLETED") {
    statusHeroTitle = "Đơn hàng đã hoàn thành";
    statusHeroSubText = "Đơn hàng đã được giao thành công!";
  } else if (order.status === "CANCELLED") {
    statusHeroTitle = "Đơn hàng đã hủy";
    statusHeroSubText = "Đơn hàng này đã bị hủy bỏ";
  }

  // Calculate delivery estimate times dynamically
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const startEst = new Date(orderDate.getTime() + 20 * 60000);
  const endEst = new Date(orderDate.getTime() + 35 * 60000);
  const formatTimeOnly = (d: Date) =>
    d.getHours().toString().padStart(2, "0") +
    ":" +
    d.getMinutes().toString().padStart(2, "0");
  const deliveryEstimate = `${formatTimeOnly(startEst)} - ${formatTimeOnly(endEst)}`;

  // Determine button configuration
  let buttonLabel = "";
  let buttonStatus: OrderStatus | null = null;

  if (order.status === "PENDING") {
    buttonLabel = "Xác nhận đơn hàng";
    buttonStatus = "CONFIRMED";
  } else if (order.status === "CONFIRMED") {
    buttonLabel = "Chuẩn bị xong";
    buttonStatus = "PREPARING";
  } else if (order.status === "PREPARING") {
    buttonLabel = "Giao hàng";
    buttonStatus = "DELIVERING";
  } else if (order.status === "DELIVERING") {
    buttonLabel = "Hoàn thành";
    buttonStatus = "COMPLETED";
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trạng thái đơn hàng</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Status Hero Circle */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrapper}>
            <View style={styles.heroIconCircle}>
              <MaterialCommunityIcons
                name={
                  isCancelled
                    ? "close-circle"
                    : isCompleted
                    ? "check-all"
                    : "food-fork-drink"
                }
                size={38}
                color="#6C8EBF"
              />
            </View>
          </View>
          <Text style={styles.heroTitle}>{statusHeroTitle}</Text>
          <Text style={styles.heroSubtitle}>{statusHeroSubText}</Text>
        </View>

        {/* Progress Tracker Card */}
        {!isCancelled && (
          <View style={styles.card}>
            <ProgressTracker currentStep={step} />

            <View style={styles.infoDivider} />

            <View style={{ gap: 16 }}>
              {/* Delivery Estimate */}
              <View style={styles.infoItem}>
                <View style={[styles.infoIconBox, { backgroundColor: SOFT_BLUE }]}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#4A90E2" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>DỰ KIẾN GIAO</Text>
                  <Text style={styles.infoValue}>{deliveryEstimate}</Text>
                </View>
              </View>

              {/* Total Payment */}
              <View style={styles.infoItem}>
                <View style={[styles.infoIconBox, { backgroundColor: SOFT_BLUE }]}>
                  <MaterialCommunityIcons name="cash-multiple" size={20} color="#4A90E2" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>TỔNG THANH TOÁN</Text>
                  <Text style={styles.infoValue}>
                    {order.totalPrice.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Order Summary Card */}
        <View style={styles.card}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Tóm tắt đơn hàng</Text>
            <Text style={styles.orderCode}>
              #ORD-{order.id.slice(-4).toUpperCase()}
            </Text>
          </View>

          {/* Items */}
          {order.items?.map((item, idx) => (
            <View key={idx} style={[styles.itemRow, idx > 0 && { marginTop: 14 }]}>
              <Image
                source={getFoodImage(order, item)}
                style={styles.foodImage}
              />
              <View style={styles.itemInfo}>
                <View style={styles.itemNameRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.quantity}x {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {item.price.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
                <Text style={styles.itemNote}>
                  {item.note || order.note || "Không có ghi chú"}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.feeDivider} />
          
          {/* Fees */}
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Phí giao hàng</Text>
            <Text style={styles.feeValue}>15.000đ</Text>
          </View>
          
          <View style={[styles.feeRow, { marginTop: 8 }]}>
            <Text style={styles.feeLabel}>Giảm giá voucher</Text>
            <Text style={[styles.feeValue, { color: "#EB5757" }]}>-15.000đ</Text>
          </View>
        </View>

        {/* Delivery Info Card */}
        <View style={styles.card}>
          <View style={styles.deliveryRow}>
            <View style={[styles.infoIconBox, { backgroundColor: SOFT_GREEN }]}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={PRIMARY} />
            </View>
            <View style={styles.deliveryText}>
              <Text style={styles.deliveryLabel}>ĐỊA CHỈ NHẬN HÀNG</Text>
              <Text style={styles.deliveryValue}>{order.deliveryAddress}</Text>
            </View>
          </View>

          <View style={[styles.deliveryRow, { marginTop: 16 }]}>
            <View style={[styles.infoIconBox, { backgroundColor: SOFT_GREEN }]}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={PRIMARY} />
            </View>
            <View style={styles.deliveryText}>
              <Text style={styles.deliveryValue}>{order.phone}</Text>
            </View>
          </View>
        </View>

        {/* Payment Status Card */}
        <View style={styles.card}>
          <View style={styles.deliveryRow}>
            <View style={[styles.infoIconBox, { backgroundColor: order.isPaid ? SOFT_GREEN : SOFT_BLUE }]}>
              <MaterialCommunityIcons 
                name={order.isPaid ? "check-circle" : "clock-outline"} 
                size={20} 
                color={order.isPaid ? PRIMARY : "#4A90E2"} 
              />
            </View>
            <View style={styles.deliveryText}>
              <Text style={styles.deliveryLabel}>TRẠNG THÁI THANH TOÁN</Text>
              <Text style={[styles.deliveryValue, { color: order.isPaid ? PRIMARY : "#4A90E2" }]}>
                {order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Solid Dark Navy Button at bottom */}
      {!isCompleted && !isCancelled && buttonStatus && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => handleStatusUpdate(buttonStatus!)}
            activeOpacity={0.85}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>{buttonLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
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

  scrollContent: { padding: 16, gap: 14 },

  // Status Hero Circle
  heroSection: {
    alignItems: "center",
    paddingVertical: 14,
  },
  heroIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DCE5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#6C8EBF",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#B3C8EC",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: NAVY,
    marginBottom: 6,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 18,
  },

  // Card Design
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Progress Tracker
  progressWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stepGroup: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
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
  nodeActive: {
    backgroundColor: NAVY,
    shadowColor: NAVY,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#B0C4B8",
    textAlign: "center",
  },
  labelDone: { color: PRIMARY, fontWeight: "600" },
  labelActive: { color: NAVY, fontWeight: "bold" },
  connector: {
    position: "absolute",
    top: 19,
    left: "50%",
    right: "-50%",
    height: 2.5,
    backgroundColor: "#E0EBE3",
    zIndex: 1,
  },
  connectorDone: { backgroundColor: PRIMARY },

  infoDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 16,
  },

  // Info items
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: NAVY,
  },

  // Summary
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: TEXT_DARK,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A90E2",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  foodImage: {
    width: 60,
    height: 60,
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
    fontSize: 14,
    fontWeight: "bold",
    color: TEXT_DARK,
    flex: 1,
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: TEXT_DARK,
  },
  itemNote: {
    fontSize: 12,
    color: TEXT_MUTED,
  },

  feeDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 14,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  feeLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  feeValue: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_DARK,
  },

  // Delivery
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deliveryText: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  deliveryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_DARK,
    lineHeight: 18,
  },

  // Bottom CTA Button
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
  ctaButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NAVY,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff",
  },
});
