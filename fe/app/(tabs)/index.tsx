import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
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

const CATEGORIES = [
  { id: "all", label: "Tất cả", icon: "🍽️" },
  { id: "rice", label: "Cơm", icon: "🍚" },
  { id: "pho", label: "Phở", icon: "🍜" },
  { id: "bun", label: "Bánh", icon: "🥟" },
  { id: "drink", label: "Giải khát", icon: "🥤" },
];

const POPULAR_FOODS = [
  {
    id: "1",
    name: "Cơm gà xối mỡ",
    subtitle: "Cơm gà Nguyên Ký",
    rating: "4.8",
    time: "10 - 15p",
    price: "50.000đ",
    image:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2023_12_6_638374928096209198_com-ga-xoi-mo-bao-nhieu-calo.jpg",
  },
  {
    id: "2",
    name: "Bún bò Huế",
    subtitle: "Bún bò Huế Duy Bảo",
    rating: "4.5",
    time: "13 - 15p",
    price: "45.000đ",
    image:
      "https://file.hstatic.net/200000700229/article/bun-bo-hue-1_da318989e7c2493f9e2c3e010e722466.jpg",
  },
  {
    id: "3",
    name: "Bún riêu cua",
    subtitle: "Bún riêu Minh Nhựt",
    rating: "4.5",
    time: "13 - 15p",
    price: "43.000đ",
    image:
      "https://i-giadinh.vnecdn.net/2024/02/22/Bc8Thnhphm18-1708574950-2889-1708574962.jpg",
  },
  {
    id: "4",
    name: "Mì cay 7 cấp độ",
    subtitle: "Mì cay Seoul",
    rating: "4.9",
    time: "15 - 20p",
    price: "60.000đ",
    image:
      "https://static.vinwonders.com/production/mi-cay-quy-nhon-1.jpg",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.searchBar}>
          <Ionicons name="search" size={24} color="#1A1A1A" />
          <TextInput
            placeholder="Tìm kiếm món ăn, quán ăn,..."
            placeholderTextColor="#7A7A7A"
            style={styles.searchInput}
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
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {POPULAR_FOODS.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/food-detail",
                  params: { id: "69f73f1b97a704ff41e13e32" },
                })
              }
            >
              <Image source={{ uri: food.image }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {food.name}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {food.subtitle}
                </Text>

                <View style={styles.metaRow}>
                  <MaterialCommunityIcons
                    name="star"
                    size={16}
                    color="#F7B500"
                  />
                  <Text style={styles.metaText}>{food.rating}</Text>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={16}
                    color="#555"
                    style={styles.clockIcon}
                  />
                  <Text style={styles.metaText}>{food.time}</Text>
                </View>

                <Text style={styles.price}>{food.price}</Text>
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
});
