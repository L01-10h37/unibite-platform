import { AppBottomTabBar } from "@/components/app-bottom-tab-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";
const DEFAULT_SHOP_ID = "69f628db4e1b85b5b8730673";
const FALLBACK_IMAGE = require("@/assets/images/bun-bo-hue-detail-2.png");
const SHOP_HERO_FALLBACK = require("@/assets/images/shop-hero-fallback.png");

type Shop = {
  id: string;
  name: string;
  avatar?: string | null;
  address?: string;
  about?: string;
  average_rating?: number;
  rating_count?: number;
};

type Food = {
  id: string;
  name: string;
  categoryName?: string;
  listUrlImg?: string[];
  price: number;
  specialPrice?: number | null;
  startTime?: string;
  endTime?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};
      <AppBottomTabBar />


function formatPrice(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function isCurrentTimeInRange(startTime?: string, endTime?: string) {
  if (!startTime || !endTime) {
    return false;
  }

  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }

  return start <= end
    ? current >= start && current <= end
    : current >= start || current <= end;
}

function getDisplayPrice(food: Food) {
  if (
    food.specialPrice != null &&
    isCurrentTimeInRange(food.startTime, food.endTime)
  ) {
    return food.specialPrice;
  }

  return food.price;
}

export default function ShopDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const shopId = id ?? DEFAULT_SHOP_ID;
  const [shop, setShop] = useState<Shop | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [activeTab, setActiveTab] = useState<"foods" | "reviews">("foods");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadShop = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [shopResponse, foodsResponse] = await Promise.all([
          fetch(`${API_URL}/api/shops/${shopId}`, {
            headers: { accept: "application/json" },
          }),
          fetch(`${API_URL}/api/foods?shopId=${shopId}&page=1&limit=10`, {
            headers: { accept: "application/json" },
          }),
        ]);

        const shopPayload = (await shopResponse.json()) as ApiResponse<Shop>;
        const foodsPayload = (await foodsResponse.json()) as ApiResponse<
          Food[]
        >;

        if (!shopResponse.ok || !shopPayload.success) {
          throw new Error(
            shopPayload.message || "Không lấy được thông tin quán",
          );
        }

        if (!foodsResponse.ok || !foodsPayload.success) {
          throw new Error(
            foodsPayload.message || "Không lấy được món của quán",
          );
        }

        if (isMounted) {
          setShop(shopPayload.data);
          setFoods(foodsPayload.data ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Không lấy được thông tin quán",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadShop();

    return () => {
      isMounted = false;
    };
  }, [shopId]);

  const heroImage: ImageSourcePropType = useMemo(() => {
    if (shop?.avatar) {
      return { uri: shop.avatar };
    }

    return SHOP_HERO_FALLBACK;
  }, [shop?.avatar]);

  const rating = shop?.average_rating ? shop.average_rating.toFixed(1) : "0.0";

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <Image source={heroImage} style={styles.heroImage} />
          <SafeAreaView edges={["top"]} style={styles.heroOverlay}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.85}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.card}>
          {isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color="#43A560" />
              <Text style={styles.stateText}>Đang tải quán...</Text>
            </View>
          ) : errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.shopHeader}>
            <View style={styles.shopNameRow}>
              <Text style={styles.shopTitle}>
                {shop?.name ?? "Bún bò Huế Duy Bảo"}
              </Text>
              <MaterialCommunityIcons
                name="check-decagram"
                size={15}
                color="#43A560"
              />
            </View>
            <MaterialCommunityIcons name="heart" size={18} color="#43A560" />
          </View>

          <View style={styles.addressRow}>
            <View style={styles.openDot} />
            <Text style={styles.openText}>Đang mở</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {shop?.address || "Khu phố Tân Lập, Phường Đông Hòa, TP. HCM"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.ratingPill}>
              <MaterialCommunityIcons name="star" size={13} color="#FFFFFF" />
              <Text style={styles.ratingPillText}>{rating}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock" size={14} color="#B8BFCC" />
              <Text style={styles.metaText}>15 Phút</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="currency-usd"
                size={14}
                color="#B8BFCC"
              />
              <Text style={styles.metaText}>Miễn phí giao hàng</Text>
            </View>
          </View>

          <View style={styles.discountBox}>
            <MaterialCommunityIcons name="percent" size={18} color="#43A560" />
            <Text style={styles.discountText}>
              Tiết kiệm 5.000đ với mã giảm “UNIBITEO”
            </Text>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "foods" ? styles.tabActive : null,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveTab("foods")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "foods" ? styles.tabTextActive : null,
                ]}
              >
                Món ăn
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "reviews" ? styles.tabActive : null,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveTab("reviews")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "reviews" ? styles.tabTextActive : null,
                ]}
              >
                Đánh giá
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "foods" ? (
            <View style={styles.foodSection}>
              <Text style={styles.sectionTitle}>Món ăn phổ biến</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.foodList}
              >
                {(foods.length ? foods : []).map((food) => {
                  const foodImage = food.listUrlImg?.[0]
                    ? { uri: food.listUrlImg[0] }
                    : FALLBACK_IMAGE;
                  const price = getDisplayPrice(food);

                  return (
                    <TouchableOpacity
                      key={food.id}
                      style={styles.foodCard}
                      activeOpacity={0.9}
                      onPress={() =>
                        router.push({
                          pathname: "/food-detail",
                          params: { id: food.id },
                        })
                      }
                    >
                      <Image source={foodImage} style={styles.foodImage} />
                      <Text style={styles.foodName} numberOfLines={2}>
                        {food.name}
                      </Text>
                      <View style={styles.foodMeta}>
                        <Text style={styles.foodPrice}>
                          {formatPrice(price)}
                        </Text>
                        <Text style={styles.foodCategory} numberOfLines={1}>
                          • {food.categoryName ?? "Món nước"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.reviewEmpty}>
              <Text style={styles.reviewEmptyText}>Chưa có đánh giá mới.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AppBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 104,
    backgroundColor: "#FFFFFF",
  },
  hero: {
    height: 215,
    overflow: "hidden",
    backgroundColor: "#E7EFE8",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    width: 42,
    height: 42,
    marginLeft: 24,
    marginTop: 32,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#43A560",
  },
  card: {
    minHeight: 560,
    marginTop: -18,
    paddingTop: 26,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  stateBox: {
    alignItems: "center",
    paddingVertical: 16,
  },
  stateText: {
    marginTop: 8,
    color: "#8A94AA",
    fontSize: 12,
    fontFamily: "Montserrat-Medium",
  },
  errorText: {
    paddingHorizontal: 32,
    color: "#C54040",
    fontSize: 13,
    textAlign: "center",
    fontFamily: "Montserrat-SemiBold",
  },
  shopHeader: {
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  shopNameRow: {
    maxWidth: width - 96,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shopTitle: {
    color: "#1B2B52",
    fontSize: 20,
    lineHeight: 24,
    fontFamily: "Montserrat-Bold",
  },
  addressRow: {
    marginTop: 16,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  openDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#0CA85A",
  },
  openText: {
    marginLeft: 7,
    color: "#0CA85A",
    fontSize: 11,
    fontFamily: "Montserrat-Bold",
  },
  addressText: {
    flex: 1,
    marginLeft: 38,
    color: "#9AA2B3",
    fontSize: 10,
    fontFamily: "Montserrat-Medium",
  },
  metaRow: {
    marginTop: 15,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ratingPill: {
    height: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#43A560",
    gap: 4,
  },
  ratingPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Montserrat-Bold",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#536078",
    fontSize: 11,
    fontFamily: "Montserrat-SemiBold",
  },
  discountBox: {
    alignSelf: "flex-start",
    marginTop: 21,
    marginLeft: 44,
    height: 37,
    maxWidth: width - 88,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 11,
    backgroundColor: "#F4F5F7",
    gap: 10,
  },
  discountText: {
    color: "#536078",
    fontSize: 12,
    fontFamily: "Montserrat-SemiBold",
  },
  tabs: {
    marginTop: 25,
    height: 56,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF0F2",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#43A560",
  },
  tabText: {
    color: "#1B2B52",
    fontSize: 13,
    fontFamily: "Montserrat-Bold",
  },
  tabTextActive: {
    color: "#43A560",
  },
  foodSection: {
    paddingTop: 24,
  },
  sectionTitle: {
    paddingHorizontal: 32,
    color: "#1B2B52",
    fontSize: 15,
    fontFamily: "Montserrat-Bold",
  },
  foodList: {
    paddingTop: 20,
    paddingLeft: 32,
    paddingRight: 18,
    gap: 10,
  },
  foodCard: {
    width: 136,
  },
  foodImage: {
    width: 136,
    height: 146,
    borderRadius: 9,
    backgroundColor: "#E7EFE8",
  },
  foodName: {
    marginTop: 8,
    color: "#1B2B52",
    fontSize: 13,
    lineHeight: 17,
    fontFamily: "Montserrat-Bold",
  },
  foodMeta: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  foodPrice: {
    color: "#0CA85A",
    fontSize: 11,
    fontFamily: "Montserrat-Bold",
  },
  foodCategory: {
    flex: 1,
    marginLeft: 5,
    color: "#9AA2B3",
    fontSize: 10,
    fontFamily: "Montserrat-SemiBold",
  },
  reviewEmpty: {
    paddingVertical: 44,
    alignItems: "center",
  },
  reviewEmptyText: {
    color: "#8A94AA",
    fontSize: 13,
    fontFamily: "Montserrat-Medium",
  },
});
