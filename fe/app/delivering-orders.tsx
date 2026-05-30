import React, { useCallback, useEffect, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { readAuthTokens } from "@/services/auth-session";
import {
  getMyOrderHistory,
  getOrderHistoryDetail,
  getFoodPreview,
  OrderHistoryDetail,
  FoodPreview,
} from "@/services/order-history";

const BG = "#DFF3E8";
const CARD_BG = "#FFFFFF";
const PRIMARY = "#27A34A";

function formatTime(date: Date | null) {
  if (!date) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function objectIdToDate(id: string) {
  if (!id || id.length < 8) return null;
  const seconds = Number.parseInt(id.slice(0, 8), 16);
  if (Number.isNaN(seconds)) return null;
  return new Date(seconds * 1000);
}

export default function DeliveringOrdersScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderHistoryDetail[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tokens = await readAuthTokens("tokens");
      if (!tokens?.accessToken) {
        router.replace("/signin");
        return;
      }

      const { orders: summaries } = await getMyOrderHistory(tokens.accessToken, 1, 20);

      const deliveringSummaries = summaries.filter((o) => o.status === "PREPARING" || o.status === "DELIVERING");

      const details = await Promise.all(
        deliveringSummaries.map(async (s) => {
          const detail = await getOrderHistoryDetail(tokens.accessToken, s.id);

          // enrich first food image
          const firstItem = detail.items?.[0];
          if (firstItem?.food) {
            const preview = await getFoodPreview(firstItem.food as string);
            if (preview) {
              (detail as any)._primaryFood = preview;
            }
          }

          return detail;
        }),
      );

      setOrders(details);
      setError(null);
    } catch (e: any) {
      setOrders([]);
      setError(e?.message ?? "Không thể tải đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}> 
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Đang tải đơn hàng đang giao...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]} edges={["top"]}>
      <View style={[styles.header, { paddingTop: insets.top }]}> 
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color="#1F2C27" />
        </TouchableOpacity>
        <Text style={styles.title}>Đơn hàng đang giao</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {orders.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Bạn hiện không có đơn hàng đang giao.</Text>
          </View>
        )}

        {orders.map((order) => {
          const createdAt = order.createdAt ? new Date(order.createdAt) : objectIdToDate(order.id);
          const eta = createdAt ? new Date(createdAt.getTime() + 15 * 60 * 1000) : null;
          const primaryFood = (order as any)._primaryFood as FoodPreview | undefined | null;

          return (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.thumbWrap}>
                  <Image
                    source={primaryFood?.listUrlImg?.[0] ? { uri: primaryFood.listUrlImg[0] } : require("@/assets/images/bun-bo-hue-detail-2.png")}
                    style={styles.thumb}
                  />
                  <View style={[styles.statusBadge, { backgroundColor: "#D5F4D7" }]}>
                    <Text style={[styles.statusBadgeText, { color: PRIMARY }]}>ĐANG GIAO</Text>
                  </View>
                </View>

                <View style={styles.infoColumn}>
                  <Text style={styles.foodName} numberOfLines={1}>{order.items?.[0]?.name || "Đơn hàng"}</Text>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={PRIMARY} />
                    <Text style={styles.metaText}>Dự kiến: {formatTime(eta)} ({Math.max(1, Math.round((eta ? (eta.getTime() - Date.now()) / 60000 : 0)))} phút)</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.bottomRow}> 
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Image source={require("@/assets/images/review-avatar.png")} style={styles.smallAvatar} />
                  <Text style={styles.shipperText}>Shipper: Đang cập nhật</Text>
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => router.push({ pathname: "/order-detail", params: { id: order.id } })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Xem chi tiết</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>Mời bạn bè. Nhận ưu đãi 50%</Text>
          <TouchableOpacity style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>CHIA SẺ NGAY</Text>
          </TouchableOpacity>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  screen: { flex: 1, backgroundColor: BG },
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
    color: "#1F2C27",
  },
  headerSpacer: { width: 36, height: 36 },
  subtitle: {
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 10,
    color: "#708178",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Montserrat-Medium",
  },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120, gap: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: "#496F57" },
  errorText: { color: "#AF3E3E", fontFamily: "Montserrat-Medium", fontSize: 12 },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 30,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E4EEE7",
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
    backgroundColor: "#E1F0E3",
  },
  thumb: { width: "100%", height: "100%" },
  statusBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: "center",
  },
  statusBadgeText: { fontSize: 10, fontFamily: "Montserrat-Bold", letterSpacing: 0.4 },
  infoColumn: { flex: 1, justifyContent: "center", paddingTop: 8 },
  foodName: { color: "#1F2C27", fontSize: 18, fontFamily: "Montserrat-Bold" },
  metaText: { marginTop: 4, color: "#708178", fontSize: 12, fontFamily: "Montserrat-Medium" },
  priceText: { marginTop: 10, color: PRIMARY, fontSize: 22, fontFamily: "Montserrat-ExtraBold" },
  smallNote: { marginTop: 4, color: "#708178", fontSize: 11, fontFamily: "Montserrat-Medium" },
  divider: { height: 1, backgroundColor: "#E1ECE3", marginVertical: 12 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smallAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#D8E6DB" },
  shipperText: { color: "#5E6B60" },

  actionRow: { flexDirection: "row", gap: 12 },
  actionButton: { height: 44, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  primaryButton: { backgroundColor: PRIMARY },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontFamily: "Montserrat-Bold" },

  promoCard: { backgroundColor: "#196B2F", borderRadius: 14, padding: 20, marginTop: 10 },
  promoTitle: { color: "#DFF7DE", fontSize: 16, fontWeight: "700", marginBottom: 10 },
  shareBtn: { backgroundColor: "#0F4F24", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: "flex-start" },
  shareBtnText: { color: "#DFF7DE", fontWeight: "700" },
  emptyBox: { padding: 36, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#6D7D6E" },
});
