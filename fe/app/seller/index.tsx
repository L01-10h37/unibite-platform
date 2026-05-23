import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, Plus } from "lucide-react-native";

import {
  getMySellerShop,
  getSellerMenu,
  parseSellerTokens,
  updateSellerFood,
  type SellerFood,
  type SellerShop,
} from "@/services/seller-shop";

const SHOP_AVATAR_FALLBACK = require("@/assets/images/seller/shop-avatar.png");
const FOOD_IMAGE_FALLBACK = require("@/assets/images/seller/milk-tea.png");

const BLUE = "#2478FF";
const BORDER = "#9FAFC0";
const BG = "#EAF9F8";

export default function SellerHomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [shop, setShop] = useState<SellerShop | null>(null);
  const [menu, setMenu] = useState<SellerFood[]>([]);

  const handleToggleAvailability = async (food: SellerFood) => {
    try {
      const tokens = parseSellerTokens(await SecureStore.getItemAsync("sellerTokens"));

      if (!tokens) {
        router.replace("/seller/signin" as any);
        return;
      }

      const updated = await updateSellerFood(tokens.accessToken, food.id, {
        isAvailble: !food.isAvailble,
      });

      setMenu((current) =>
        current.map((item) => (item.id === food.id ? { ...item, ...updated } : item)),
      );
    } catch (error) {
      console.error("Failed to update food availability:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadHome = async () => {
      try {
        const tokens = parseSellerTokens(
          await SecureStore.getItemAsync("sellerTokens"),
        );

        if (!tokens) {
          router.replace("/seller/signin" as any);
          return;
        }

        const currentShop = await getMySellerShop(tokens.accessToken);

        if (!currentShop) {
          router.replace("/seller/create-shop" as any);
          return;
        }

        const foods = await getSellerMenu(tokens.accessToken, 10).catch((error) => {
          console.error("Failed to load seller menu:", error);
          return [];
        });

        if (isMounted) {
          setShop(currentShop);
          setMenu(foods);
        }
      } catch (error) {
        console.error("Error loading seller home:", error);
        router.replace("/seller/signin" as any);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHome();

    return () => {
      isMounted = false;
    };
  }, []);

  const avatarSource = useMemo<ImageSourcePropType>(() => {
    if (shop?.avatar) {
      return { uri: shop.avatar };
    }

    return SHOP_AVATAR_FALLBACK;
  }, [shop?.avatar]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BLUE} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Gian hàng của tôi</Text>

        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => router.push("/seller/profile" as any)}
          style={styles.shopCard}
        >
          <Image source={avatarSource} style={styles.shopAvatar} />
          <View style={styles.shopInfo}>
            <Text style={styles.shopName} numberOfLines={1}>
              {shop?.name || "Gian hàng của tôi"}
            </Text>
            <Text style={styles.shopTime} numberOfLines={1}>
              {shop?.openingHours || "Chưa cập nhật giờ mở cửa"}
            </Text>
            <Text style={styles.rankText} numberOfLines={1}>
              {shop?.address || "Chưa cập nhật địa chỉ"}
            </Text>
          </View>
          <ChevronRight size={18} color="#8EA0B4" />

          <View style={styles.shopMetrics}>
            <Metric value="-" label="Lợi nhuận" />
            <Metric value="-" label="Khách" />
            <Metric value="-" label="Tỷ lệ chuyển đổi" />
          </View>
        </TouchableOpacity>

        <View style={styles.orderCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Đơn hàng</Text>
            <Text style={styles.cardDate}>12/04/2026</Text>
            <ChevronRight size={17} color="#8EA0B4" />
          </View>
          <View style={styles.orderStats}>
            <OrderStat active value="0" label="Đang chờ" />
            <OrderStat value="0" label="Thành công" />
            <OrderStat value="0" label="Thất bại" />
            <OrderStat value="0" label="Đánh giá" />
          </View>
        </View>

        <View style={styles.menuCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Thực đơn</Text>
            <ChevronRight size={17} color="#8EA0B4" />
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/seller/create-food" as any)}
            style={styles.addButton}
          >
            <Plus size={26} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Thêm món mới</Text>
          </TouchableOpacity>

          {menu.length > 0 ? (
            menu.map((food) => (
              <FoodRow
                key={food.id}
                food={food}
                onToggleAvailability={handleToggleAvailability}
              />
            ))
          ) : (
            <View style={styles.emptyMenu}>
              <Text style={styles.emptyTitle}>Chưa có món nào</Text>
              <Text style={styles.emptyText}>Thêm món mới để bắt đầu bán hàng.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function OrderStat({
  active,
  value,
  label,
}: {
  active?: boolean;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.orderStat}>
      <Text style={[styles.orderValue, active && styles.orderValueActive]}>{value}</Text>
      <Text style={styles.orderLabel}>{label}</Text>
    </View>
  );
}

function FoodRow({
  food,
  onToggleAvailability,
}: {
  food: SellerFood;
  onToggleAvailability: (food: SellerFood) => void;
}) {
  const imageSource: ImageSourcePropType = food.listUrlImg?.[0]
    ? { uri: food.listUrlImg[0] }
    : FOOD_IMAGE_FALLBACK;
  const price = food.specialPrice ?? food.price;
  const rating =
    food.rating_count && food.rating_count > 0
      ? `${Number(food.average_rating || 0).toFixed(1)}/5`
      : "-/5";
  const openEdit = (focus?: string) => {
    router.push({
      pathname: "/seller/edit-food",
      params: { food: JSON.stringify(food), focus },
    } as any);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => openEdit()}
      style={styles.foodRow}
    >
      <Image source={imageSource} style={styles.foodImage} />
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={1}>
          {food.name}
        </Text>
        <Text style={styles.foodTime}>29 Nov, 01:20 pm</Text>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => onToggleAvailability(food)}
          style={[
            styles.statusPill,
            !food.isAvailble && styles.statusPillUnavailable,
          ]}
        >
          <Text style={styles.statusText}>
            {food.isAvailble ? "Hiện có" : "Hết món"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.foodRight}>
        <Text style={styles.foodPrice}>{formatPrice(price)}</Text>
        <Text style={styles.soldText}>Đã bán: {food.sold_count || 0}</Text>
        <View style={styles.ratingPill}>
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatPrice(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
  screenTitle: {
    color: "#111111",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 21,
    marginBottom: 14,
    marginLeft: 7,
  },
  shopCard: {
    minHeight: 139,
    backgroundColor: "#FFFFFF",
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 10,
  },
  shopAvatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    marginRight: 16,
  },
  shopInfo: {
    flex: 1,
    paddingRight: 8,
  },
  shopName: {
    color: "#171717",
    fontFamily: "Montserrat-Bold",
    fontSize: 16,
    marginBottom: 7,
  },
  shopTime: {
    color: "#94A0B4",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    marginBottom: 7,
  },
  rankText: {
    color: "#94A0B4",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
  },
  shopMetrics: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 9,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  metric: {
    width: "32%",
    alignItems: "center",
    gap: 8,
  },
  metricValue: {
    color: "#000000",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 22,
    lineHeight: 22,
  },
  metricLabel: {
    color: "#9AA6B9",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 12,
    marginBottom: 11,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 19,
  },
  cardTitle: {
    color: "#000000",
    fontFamily: "Montserrat-Bold",
    fontSize: 16,
    flex: 1,
  },
  cardDate: {
    color: "#9AA6B9",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    marginRight: 128,
  },
  orderStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 14,
  },
  orderStat: {
    width: "24%",
    alignItems: "center",
    gap: 8,
  },
  orderValue: {
    color: "#000000",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 16,
  },
  orderValueActive: {
    color: BLUE,
  },
  orderLabel: {
    color: "#98A3B6",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    textAlign: "center",
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 17,
    paddingTop: 12,
    paddingBottom: 12,
  },
  addButton: {
    height: 57,
    borderRadius: 9,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    marginBottom: 19,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 16,
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  foodImage: {
    width: 72,
    height: 66,
    borderRadius: 17,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
    minWidth: 0,
  },
  foodName: {
    color: "#3A221A",
    fontFamily: "Montserrat-Medium",
    fontSize: 20,
    marginBottom: 2,
  },
  foodTime: {
    color: "#3A221A",
    fontFamily: "Montserrat-Regular",
    fontSize: 12,
    marginBottom: 6,
  },
  statusPill: {
    width: 121,
    height: 27,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BLUE,
  },
  statusPillUnavailable: {
    backgroundColor: "#9BA5B1",
  },
  statusText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-Bold",
    fontSize: 13,
  },
  foodRight: {
    width: 118,
    alignItems: "flex-end",
  },
  foodPrice: {
    color: BLUE,
    fontFamily: "Montserrat-Bold",
    fontSize: 18,
    marginBottom: 3,
  },
  soldText: {
    color: "#3A221A",
    fontFamily: "Montserrat-Regular",
    fontSize: 12,
    marginBottom: 7,
  },
  ratingPill: {
    width: 100,
    height: 27,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A9C9F7",
  },
  ratingText: {
    color: "#000000",
    fontFamily: "Montserrat-Medium",
    fontSize: 13,
  },
  emptyMenu: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyTitle: {
    color: "#111111",
    fontFamily: "Montserrat-Bold",
    fontSize: 16,
    marginBottom: 6,
  },
  emptyText: {
    color: "#7A8795",
    fontFamily: "Montserrat-Medium",
    fontSize: 13,
  },
});
