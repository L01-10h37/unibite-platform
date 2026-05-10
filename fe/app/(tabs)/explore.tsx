import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#1EA64A";
const BG = "#F7F9F7";
const CARD_BG = "#FFFFFF";
const BORDER = "#E8EFE9";
const HERO_HEIGHT = 240;

// --- Data ---
const MENU_ITEMS = [
  { id: "1", name: "Bún bò Huế đặc biệt", price: "55.000đ", image: "https://file.hstatic.net/200000700229/article/bun-bo-hue-1_da318989e7c2493f9e2c3e010e722466.jpg" },
  { id: "2", name: "Bún bò chả", price: "50.000đ", image: "https://file.hstatic.net/200000700229/article/bun-bo-hue-1_da318989e7c2493f9e2c3e010e722466.jpg" },
  { id: "3", name: "Bún bò gân", price: "48.000đ", image: "https://file.hstatic.net/200000700229/article/bun-bo-hue-1_da318989e7c2493f9e2c3e010e722466.jpg" },
];

const REVIEWS = [
  {
    id: "1",
    name: "Lương Ngọc Trung",
    avatar: "https://i.pravatar.cc/100?img=1",
    time: "Hôm nay, 08:40",
    rating: 5,
    text: "Quán bán bún bò ngon nhất làng đại học.",
    likes: 68,
    liked: true,
    image: null,
  },
  {
    id: "2",
    name: "Lư Chấn Vũ",
    avatar: "https://i.pravatar.cc/100?img=2",
    time: "Hôm nay, 09:12",
    rating: 5,
    text: "Làng đại học đệ nhất bún bò quán.",
    likes: 132,
    liked: true,
    image: null,
  },
  {
    id: "3",
    name: "Lê Minh Trí",
    avatar: "https://i.pravatar.cc/100?img=3",
    time: "Hôm qua, 16:40",
    rating: 3,
    text: "Bún bò ngon, có thêm trứng ruột nên nhiều đạm.",
    likes: 32,
    liked: true,
    image: "https://file.hstatic.net/200000700229/article/bun-bo-hue-1_da318989e7c2493f9e2c3e010e722466.jpg",
  },
  {
    id: "4",
    name: "Nguyễn Minh Tuấn",
    avatar: "https://i.pravatar.cc/100?img=4",
    time: "01/04/2026, 12:58",
    rating: 1,
    text: "Thà ăn bún bò ăn liền còn ngon hơn. Phí tiền!",
    likes: 99,
    liked: true,
    image: "https://file.hstatic.net/200000700229/article/bun-bo-hue-1_da318989e7c2493f9e2c3e010e722466.jpg",
  },
  {
    id: "5",
    name: "Huỳnh Xuân Quốc Việt",
    avatar: "https://i.pravatar.cc/100?img=5",
    time: "01/04/2026, 13:27",
    rating: 5,
    text: "Cmt chỉ mang tính chất nhận xu. Tôi xin phép đếm từ 1 đến 100...",
    likes: 45,
    liked: false,
    image: null,
  },
];

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <MaterialCommunityIcons
          key={s}
          name={s <= rating ? "star" : "star-outline"}
          size={size}
          color={s <= rating ? "#F7B500" : "#D0D5D2"}
        />
      ))}
    </View>
  );
}

function ReviewCard({ item }: { item: (typeof REVIEWS)[0] }) {
  const [liked, setLiked] = useState(item.liked);
  const [likes, setLikes] = useState(item.likes);

  const handleLike = () => {
    setLiked((p) => !p);
    setLikes((p) => (liked ? p - 1 : p + 1));
  };

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.reviewerName}>{item.name}</Text>
          <StarRow rating={item.rating} />
        </View>
        <Text style={styles.reviewTime}>{item.time}</Text>
      </View>
      <Text style={styles.reviewText}>{item.text}</Text>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.reviewImage} />
      )}
      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={handleLike}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={liked ? "heart" : "heart-outline"}
            size={16}
            color={liked ? PRIMARY : "#9EB09F"}
          />
          <Text style={[styles.likeCount, liked && { color: PRIMARY }]}>
            {likes} lượt thích
          </Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8}>
          <MaterialCommunityIcons name="reply-outline" size={20} color="#C0CCC2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MenuCard({ item }: { item: (typeof MENU_ITEMS)[0] }) {
  return (
    <View style={styles.menuCard}>
      <Image source={{ uri: item.image }} style={styles.menuImage} />
      <View style={styles.menuBody}>
        <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.menuFooter}>
          <Text style={styles.menuPrice}>{item.price}</Text>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function RestaurantDetailScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"menu" | "review">("review");
  const [wishlisted, setWishlisted] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 80, HERO_HEIGHT - 40],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Floating transparent header */}
      <Animated.View
        style={[
          styles.floatingHeader,
          { paddingTop: insets.top + 4, opacity: headerOpacity },
        ]}
      >
        <Text style={styles.floatingTitle}>Bún bò Huế Duy Bảo</Text>
      </Animated.View>

      {/* Fixed top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.8}
          onPress={() => setWishlisted((p) => !p)}
        >
          <MaterialCommunityIcons
            name={wishlisted ? "heart" : "heart-outline"}
            size={22}
            color={wishlisted ? "#FF6B6B" : "#fff"}
          />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Image */}
        <View style={styles.hero}>
          <Image
            source={{ uri: "https://file.hstatic.net/200000700229/article/bun-bo-hue-1_da318989e7c2493f9e2c3e010e722466.jpg" }}
            style={styles.heroImage}
          />
          <View style={styles.heroGradient} />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.restaurantName}>Bún bò Huế</Text>
                <MaterialCommunityIcons name="check-decagram" size={18} color={PRIMARY} />
              </View>
              <Text style={styles.restaurantSub}>Duy Bảo</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color={PRIMARY} />
            <Text style={styles.locationText}>
              Khu phố Tân Lập, Phường Đông Hoà, TP. HCM
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <MaterialCommunityIcons name="star" size={14} color="#F7B500" />
              <Text style={styles.metaChipText}>4.5</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaChip}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#6B9E82" />
              <Text style={styles.metaChipText}>15 Phút</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaChip}>
              <MaterialCommunityIcons name="currency-usd" size={14} color="#6B9E82" />
              <Text style={styles.metaChipText}>Miễn phí giao hàng</Text>
            </View>
          </View>

          {/* Voucher Banner */}
          <TouchableOpacity style={styles.voucherBanner} activeOpacity={0.85}>
            <MaterialCommunityIcons name="sale" size={18} color={PRIMARY} />
            <Text style={styles.voucherText}>
              Tiết kiệm 5.000đ với mã giảm{" "}
              <Text style={styles.voucherCode}>"UNIBITEO"</Text>
            </Text>
            <Ionicons name="chevron-forward" size={16} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {(["menu", "review"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === "menu" ? "Món ăn" : "Đánh giá"}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}>
          {activeTab === "menu" ? (
            <View style={{ gap: 12, paddingTop: 12 }}>
              {MENU_ITEMS.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <View style={{ gap: 12, paddingTop: 12 }}>
              {/* Summary Row */}
              <View style={styles.ratingSummary}>
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.bigRating}>4.5</Text>
                  <StarRow rating={5} size={16} />
                  <Text style={styles.ratingCount}>128 đánh giá</Text>
                </View>
                <View style={styles.ratingBars}>
                  {[5, 4, 3, 2, 1].map((s) => (
                    <View key={s} style={styles.ratingBarRow}>
                      <Text style={styles.ratingBarLabel}>{s}</Text>
                      <MaterialCommunityIcons name="star" size={11} color="#F7B500" />
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${s === 5 ? "70%" : s === 4 ? "20%" : s === 3 ? "5%" : s === 2 ? "3%" : "2%"}` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {REVIEWS.map((item) => (
                <ReviewCard key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: CARD_BG,
    paddingBottom: 10,
    paddingHorizontal: 60,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  floatingTitle: {
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
    color: "#1A1A1A",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    height: HERO_HEIGHT,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    // background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.2) 100%)", // Not supported in React Native
    backgroundColor: "transparent",
  },
  infoCard: {
    backgroundColor: CARD_BG,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  restaurantName: {
    fontSize: 20,
    fontFamily: "Montserrat-Bold",
    color: "#1A1A1A",
  },
  restaurantSub: {
    fontSize: 14,
    fontFamily: "Montserrat-Medium",
    color: "#7A9E82",
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    color: "#5A6E60",
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaChipText: {
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
    color: "#3A3A3A",
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: BORDER,
  },
  voucherBanner: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9F3",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#C8E8D1",
  },
  voucherText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Montserrat-Medium",
    color: "#2D6E40",
  },
  voucherCode: {
    fontFamily: "Montserrat-Bold",
    color: PRIMARY,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    position: "relative",
  },
  tabActive: {
    backgroundColor: "#F0FAF3",
  },
  tabText: {
    fontSize: 15,
    fontFamily: "Montserrat-SemiBold",
    color: "#8C96A4",
  },
  tabTextActive: {
    color: PRIMARY,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "20%",
    right: "20%",
    height: 3,
    borderRadius: 3,
    backgroundColor: PRIMARY,
  },
  ratingSummary: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  bigRating: {
    fontSize: 40,
    fontFamily: "Montserrat-Bold",
    color: "#1A1A1A",
  },
  ratingCount: {
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    color: "#9EB09F",
    marginTop: 4,
  },
  ratingBars: {
    flex: 1,
    gap: 5,
  },
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingBarLabel: {
    fontSize: 11,
    fontFamily: "Montserrat-Medium",
    color: "#7A9E82",
    width: 10,
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#EEF3EF",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: PRIMARY,
    borderRadius: 3,
  },
  reviewCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#D0EAD9",
  },
  reviewerName: {
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
    color: "#1A1A1A",
    marginBottom: 3,
  },
  reviewTime: {
    fontSize: 11,
    fontFamily: "Montserrat-Regular",
    color: "#A0B4A4",
  },
  reviewText: {
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
    color: "#3A3A3A",
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewImage: {
    width: 80,
    height: 60,
    borderRadius: 10,
    marginBottom: 10,
  },
  reviewActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  likeCount: {
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
    color: "#9EB09F",
  },
  menuCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  menuImage: {
    width: 90,
    height: 90,
  },
  menuBody: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  menuName: {
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
    color: "#1A1A1A",
  },
  menuFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuPrice: {
    fontSize: 15,
    fontFamily: "Montserrat-Bold",
    color: PRIMARY,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
