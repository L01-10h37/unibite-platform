import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AppBottomTabBar } from "@/components/app-bottom-tab-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterParams = {
  query?: string;
  sort?: string;
  minRating?: string;
  minPrice?: string;
  maxPrice?: string;
  area?: string;
};

const SORT_OPTIONS = [
  { label: "Liên quan", value: "relevant" },
  { label: "Gần đây", value: "newest" },
  { label: "Giá thấp", value: "price_low" },
  { label: "Đánh giá", value: "rating" },
];

const AREA_OPTIONS = [
  { label: "Khu A", value: "Khu A" },
  { label: "Khu B", value: "Khu B" },
];

const RATING_OPTIONS = [
  { label: "4.0+", value: "4" },
  { label: "4.5+", value: "4.5" },
  { label: "5.0", value: "5" },
];

function formatCurrency(value: string) {
  const number = Number(value);

  if (Number.isNaN(number) || value.trim() === "") {
    return "--";
  }

  return `${number.toLocaleString("vi-VN")}đ`;
}

export default function FilterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<FilterParams>();

  const initialQuery = typeof params.query === "string" ? params.query : "";
  const initialSort = typeof params.sort === "string" ? params.sort : "relevant";
  const initialMinRating = typeof params.minRating === "string" ? params.minRating : "";
  const initialMinPrice = typeof params.minPrice === "string" ? params.minPrice : "";
  const initialMaxPrice = typeof params.maxPrice === "string" ? params.maxPrice : "";
  const initialArea = typeof params.area === "string" ? params.area : "";

  const [sort, setSort] = useState(initialSort);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [area, setArea] = useState(initialArea);
  const [minRating, setMinRating] = useState(initialMinRating);

  const priceLabel = useMemo(() => {
    if (!minPrice && !maxPrice) {
      return "Chưa chọn";
    }

    return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
  }, [minPrice, maxPrice]);

  const applyFilters = () => {
    router.replace({
      pathname: "/search",
      params: {
        query: initialQuery,
        sort,
        minRating,
        minPrice,
        maxPrice,
        area,
        fromFilter: "1",
      },
    });
  };

  const resetFilters = () => {
    setSort("relevant");
    setMinPrice("");
    setMaxPrice("");
    setArea("");
    setMinRating("");
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#17301F" />
          </TouchableOpacity>
          <Text pointerEvents="none" style={styles.title}>
            Bộ lọc
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sắp xếp theo</Text>
            <View style={styles.chipGrid}>
              {SORT_OPTIONS.map((option) => {
                const selected = sort === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setSort(option.value)}
                    style={[styles.sortChip, selected && styles.sortChipSelected]}
                  >
                    <Text style={[styles.sortChipText, selected && styles.sortChipTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Khoảng giá</Text>
              <Text style={styles.pricePreview}>{priceLabel}</Text>
            </View>
            <Text style={styles.sectionCaption}>Đơn vị: VND</Text>

            <View style={styles.priceInputsRow}>
              <View style={styles.priceInputWrap}>
                <Text style={styles.inputLabel}>Từ</Text>
                <TextInput
                  value={minPrice}
                  onChangeText={setMinPrice}
                  placeholder="60.000"
                  keyboardType="number-pad"
                  style={styles.priceInput}
                />
              </View>
              <View style={styles.priceInputWrap}>
                <Text style={styles.inputLabel}>Đến</Text>
                <TextInput
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  placeholder="250.000"
                  keyboardType="number-pad"
                  style={styles.priceInput}
                />
              </View>
            </View>

            <View style={styles.sliderTrack}>
              <View style={styles.sliderFill} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Khu vực</Text>
            <View style={styles.areaRow}>
              {AREA_OPTIONS.map((option) => {
                const selected = area === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setArea(selected ? "" : option.value)}
                    style={[styles.areaCard, selected && styles.areaCardSelected]}
                  >
                    <Text style={[styles.areaCardText, selected && styles.areaCardTextSelected]}>
                      {option.label}
                    </Text>
                    {selected ? <MaterialCommunityIcons name="check-circle" size={18} color="#1EA64A" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Đánh giá</Text>
            <View style={styles.ratingRow}>
              {RATING_OPTIONS.map((option) => {
                const selected = minRating === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setMinRating(selected ? "" : option.value)}
                    style={[styles.ratingCard, selected && styles.ratingCardSelected]}
                  >
                    <MaterialCommunityIcons
                      name="star"
                      size={24}
                      color={selected ? "#FFFFFF" : "#F7B500"}
                    />
                    <Text style={[styles.ratingCardText, selected && styles.ratingCardTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={resetFilters} style={styles.resetButton} activeOpacity={0.85}>
              <Text style={styles.resetButtonText}>Đặt lại</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={applyFilters} style={styles.applyButton} activeOpacity={0.9}>
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <AppBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#CFE9D7",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    position: "relative",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    color: "#17301F",
    fontFamily: "Montserrat-Bold",
    zIndex: 0,
  },
  headerSpacer: {
    width: 36,
    height: 36,
    marginLeft: "auto",
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 124,
    gap: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#2B3830",
    fontFamily: "Montserrat-Bold",
  },
  sectionCaption: {
    marginTop: 4,
    fontSize: 12,
    color: "#7A8C80",
    fontFamily: "Montserrat-Medium",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
  },
  sortChip: {
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D4DBD6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  sortChipSelected: {
    backgroundColor: "#1EA64A",
    borderColor: "#1EA64A",
  },
  sortChipText: {
    fontSize: 14,
    color: "#53635A",
    fontFamily: "Montserrat-SemiBold",
  },
  sortChipTextSelected: {
    color: "#FFFFFF",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pricePreview: {
    fontSize: 18,
    color: "#1A7B35",
    fontFamily: "Montserrat-Bold",
  },
  priceInputsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  priceInputWrap: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: "#809187",
    fontFamily: "Montserrat-Medium",
    marginBottom: 6,
  },
  priceInput: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D5DDD7",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#17301F",
    fontFamily: "Montserrat-SemiBold",
    backgroundColor: "#FDFEFE",
  },
  sliderTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#D7E7E1",
    marginTop: 18,
    overflow: "hidden",
  },
  sliderFill: {
    width: "55%",
    height: "100%",
    backgroundColor: "#1EA64A",
  },
  areaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  areaCard: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D4DBD6",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  areaCardSelected: {
    borderColor: "#1EA64A",
    backgroundColor: "#F0F8F2",
  },
  areaCardText: {
    fontSize: 14,
    color: "#31443A",
    fontFamily: "Montserrat-SemiBold",
  },
  areaCardTextSelected: {
    color: "#17301F",
  },
  ratingRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  ratingCard: {
    flex: 1,
    minHeight: 80,
    borderRadius: 16,
    backgroundColor: "#DDEFF2",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  ratingCardSelected: {
    backgroundColor: "#1EA64A",
  },
  ratingCardText: {
    fontSize: 14,
    color: "#31443A",
    fontFamily: "Montserrat-Bold",
  },
  ratingCardTextSelected: {
    color: "#FFFFFF",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  resetButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    fontSize: 16,
    color: "#2B3830",
    fontFamily: "Montserrat-Bold",
  },
  applyButton: {
    flex: 2,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1A7B35",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A7B35",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Montserrat-Bold",
  },
});