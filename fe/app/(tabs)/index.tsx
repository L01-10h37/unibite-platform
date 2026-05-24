import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 52) / 2;
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

const CATEGORIES = [
  { id: "all", label: "Tất cả", icon: "🍽️" },
  { id: "rice", label: "Cơm", icon: "🍚" },
  { id: "pho", label: "Phở", icon: "🍜" },
  { id: "bun", label: "Bánh", icon: "🥟" },
  { id: "drink", label: "Giải khát", icon: "🥤" },
];

type HomeFood = {
  id: string;
  name: string;
  shopName?: string | null;
  categoryName?: string | null;
  listUrlImg?: string[] | null;
  price?: number | null;
  specialPrice?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  average_rating?: number | null;
  sold_count?: number | null;
};

type FoodsResponse = {
  success: boolean;
  message: string;
  data: HomeFood[];
};

function formatPrice(value?: number | null) {
  if (value == null) {
    return "Liên hệ";
  }

  return `${value.toLocaleString("vi-VN")}đ`;
}

function isCurrentTimeInRange(startTime?: string | null, endTime?: string | null) {
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

  return start <= end ? current >= start && current <= end : current >= start || current <= end;
}

function getDisplayPrice(food: HomeFood) {
  if (food.specialPrice != null && isCurrentTimeInRange(food.startTime, food.endTime)) {
    return food.specialPrice;
  }

  return food.price;
}

function getEstimatedDeliveryTime(food: HomeFood) {
  const hasImages = (food.listUrlImg?.length ?? 0) > 0;
  const baseMinutes = hasImages ? 20 : 25;
  const maxMinutes = baseMinutes + 15;

  return `${baseMinutes} - ${maxMinutes}p`;
}

function getFoodImageSource(food: HomeFood) {
  const firstImage = food.listUrlImg?.find(Boolean);

  return firstImage
    ? { uri: firstImage }
    : require("@/assets/images/bun-bo-hue-detail-2.png");
}

export default function HomeScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [foods, setFoods] = useState<HomeFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadFoods = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(`${API_URL}/api/foods?page=1&limit=8&order=recent`, {
          headers: { accept: "application/json" },
        });
        const payload = (await response.json()) as FoodsResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Không lấy được món ăn");
        }

        if (isMounted) {
          setFoods(payload.data ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setFoods([]);
          setErrorMessage(error instanceof Error ? error.message : "Không lấy được món ăn");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFoods();

    return () => {
      isMounted = false;
    };
  }, []);

  const openSearch = () => {
    const query = searchText.trim();

    if (!query) {
      return;
    }

    router.push({
      pathname: "/search",
      params: { query },
    });
  };

  const openAllFoods = () => {
    router.push("/search");
  };

  const openQuickSearch = (categoryId: string, label: string) => {
    if (categoryId === "all") {
      openAllFoods();
      return;
    }

    router.push({
      pathname: "/search",
      params: {
        query: label,
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={openSearch} activeOpacity={0.8} hitSlop={10} style={styles.searchIconButton}>
            <Ionicons name="search" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Tìm kiếm món ăn"
            placeholderTextColor="#7A7A7A"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={openSearch}
            blurOnSubmit={false}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {CATEGORIES.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              activeOpacity={0.8}
              style={[
                styles.categoryChip,
                index === 0 ? styles.categoryChipActive : null,
              ]}
              onPress={() => openQuickSearch(category.id, category.label)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  index === 0 ? styles.categoryLabelActive : null,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.discountCard}>
          <View>
            <Text style={styles.discountTitle}>Giảm giá 50%</Text>
            <Text style={styles.discountSub}>
              Cho đơn hàng đầu tiên của bạn
            </Text>
          </View>
          <TouchableOpacity style={styles.orderNowButton} activeOpacity={0.9}>
            <Text style={styles.orderNowText}>Đặt ngay</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Món ăn phổ biến</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={openAllFoods}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color="#1EA64A" />
            <Text style={styles.stateText}>Đang tải món ăn...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{errorMessage}</Text>
          </View>
        ) : foods.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Chưa có món ăn nào trong database.</Text>
          </View>
        ) : null}

        <View style={styles.grid}>
          {foods.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/food-detail",
                  params: { id: food.id },
                })
              }
            >
              <Image source={getFoodImageSource(food)} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {food.name}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {food.shopName || food.categoryName || "Quán ăn"}
                </Text>

                <View style={styles.metaRow}>
                  <MaterialCommunityIcons
                    name="star"
                    size={16}
                    color="#F7B500"
                  />
                  <Text style={styles.metaText}>{(food.average_rating ?? 0).toFixed(1)}</Text>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={16}
                    color="#555"
                    style={styles.clockIcon}
                  />
                  <Text style={styles.metaText}>{getEstimatedDeliveryTime(food)}</Text>
                </View>

                <Text style={styles.price}>{formatPrice(getDisplayPrice(food))}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#CFE9D7",
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingTop: 54,
    paddingBottom: 28,
  },
  searchBar: {
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F6F6F6",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: "#1A1A1A",
    fontFamily: "Montserrat-Medium",
  },
  searchIconButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryList: {
    paddingTop: 14,
    paddingBottom: 8,
    paddingRight: 10,
  },
  categoryChip: {
    backgroundColor: "#F4F6F1",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDE3DB",
  },
  categoryChipActive: {
    backgroundColor: "#EDEDE8",
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  categoryLabel: {
    color: "#4D4D4D",
    fontSize: 15,
    fontFamily: "Montserrat-SemiBold",
  },
  categoryLabelActive: {
    color: "#444",
  },
  discountCard: {
    marginTop: 4,
    backgroundColor: "#1FAE3C",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  discountTitle: {
    color: "#FFFFFF",
    fontSize: 40 / 2,
    fontFamily: "Montserrat-Bold",
  },
  discountSub: {
    color: "#E8FFE8",
    marginTop: 4,
    fontSize: 10,
    fontFamily: "Montserrat-Medium",
  },
  orderNowButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  orderNowText: {
    color: "#16A937",
    fontSize: 17,
    fontFamily: "Montserrat-Bold",
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 12,
    paddingHorizontal: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: "#0F0F0F",
    fontSize: 17,
    fontFamily: "Montserrat-Bold",
  },
  seeAll: {
    color: "#3B9051",
    fontSize: 17,
    fontFamily: "Montserrat-Bold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F4F4F2",
  },
  cardImage: {
    width: "100%",
    height: 100,
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  cardTitle: {
    color: "#121212",
    fontSize: 15,
    fontFamily: "Montserrat-Bold",
  },
  cardSubtitle: {
    color: "#7A7A7A",
    marginTop: 3,
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
  },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    marginLeft: 3,
    color: "#4E4E4E",
    fontSize: 14,
    fontFamily: "Montserrat-Medium",
  },
  clockIcon: {
    marginLeft: 10,
  },
  price: {
    marginTop: 6,
    color: "#0BAF29",
    fontSize: 15,
    fontFamily: "Montserrat-Bold",
  },
  stateBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  stateText: {
    marginTop: 10,
    color: "#4D4D4D",
    fontSize: 14,
    fontFamily: "Montserrat-Medium",
    textAlign: "center",
  },
});
