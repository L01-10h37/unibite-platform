import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AppBottomTabBar } from "@/components/app-bottom-tab-bar";
import { getFoodCategories, type SellerCategory } from "@/services/seller-shop";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  category?: string;
  categoryId?: string;
  categoryName?: string;
  sort?: string;
  minRating?: string;
  minPrice?: string;
  maxPrice?: string;
};

type SortOption = {
  label: string;
  value: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
};

const SORT_OPTIONS: SortOption[] = [
  {
    label: "Phù hợp nhất",
    value: "relevant",
    icon: "text-search",
  },
  {
    label: "Mới nhất",
    value: "newest",
    icon: "clock-outline",
  },
  {
    label: "Cũ nhất",
    value: "oldest",
    icon: "history",
  },
  {
    label: "Giá thấp",
    value: "price_low",
    icon: "sort-numeric-ascending",
  },
  {
    label: "Giá cao",
    value: "price_high",
    icon: "sort-numeric-descending",
  },
  {
    label: "Rating cao",
    value: "rating_desc",
    icon: "star",
  },
  {
    label: "Rating thấp",
    value: "rating_asc",
    icon: "star-outline",
  },
];

const RATING_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "3.0+", value: "3" },
  { label: "4.0+", value: "4" },
  { label: "4.5+", value: "4.5" },
  { label: "5.0", value: "5" },
];

function getCategoryChildren(category: SellerCategory) {
  return category.child || category.children || [];
}

function findCategoryPath(categories: SellerCategory[], categoryId: string): SellerCategory[] {
  for (const category of categories) {
    if (category.id === categoryId) {
      return [category];
    }

    const childPath = findCategoryPath(getCategoryChildren(category), categoryId);

    if (childPath.length > 0) {
      return [category, ...childPath];
    }
  }

  return [];
}

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
  const initialCategoryId =
    typeof params.categoryId === "string"
      ? params.categoryId
      : typeof params.category === "string"
        ? params.category
        : "";
  const initialCategoryName = typeof params.categoryName === "string" ? params.categoryName : "";
  const initialSort = typeof params.sort === "string" ? params.sort : "relevant";
  const initialMinRating = typeof params.minRating === "string" ? params.minRating : "";
  const initialMinPrice = typeof params.minPrice === "string" ? params.minPrice : "";
  const initialMaxPrice = typeof params.maxPrice === "string" ? params.maxPrice : "";

  const [sort, setSort] = useState(initialSort);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [categoryName, setCategoryName] = useState(initialCategoryName);
  const [categoryPath, setCategoryPath] = useState<SellerCategory[]>([]);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [minRating, setMinRating] = useState(initialMinRating);
  const [categories, setCategories] = useState<SellerCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        setCategoryError("");
        const data = await getFoodCategories();

        if (isMounted) {
          setCategories(data);
        }
      } catch (error) {
        if (isMounted) {
          setCategories([]);
          setCategoryError(error instanceof Error ? error.message : "Không lấy được danh mục");
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!initialCategoryId || categories.length === 0 || categoryPath.length > 0) {
      return;
    }

    const initialPath = findCategoryPath(categories, initialCategoryId);

    if (initialPath.length > 0) {
      setCategoryPath(initialPath.slice(0, -1));
    }
  }, [categories, categoryPath.length, initialCategoryId]);

  const currentCategory = categoryPath[categoryPath.length - 1] ?? null;
  const visibleCategories = currentCategory ? getCategoryChildren(currentCategory) : categories;
  const breadcrumbLabel = useMemo(
    () =>
      categoryPath.length > 0
        ? categoryPath.map((category) => category.name).join(" / ")
        : "Tất cả danh mục",
    [categoryPath]
  );

  const priceLabel = useMemo(() => {
    if (!minPrice && !maxPrice) {
      return "Chưa chọn";
    }

    return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
  }, [minPrice, maxPrice]);

  const clearCategory = () => {
    setCategoryId("");
    setCategoryName("");
    setCategoryPath([]);
  };

  const applyFilters = () => {
    router.replace({
      pathname: "/search",
      params: {
        query: initialQuery,
        categoryId,
        categoryName,
        sort,
        minRating,
        minPrice,
        maxPrice,
        fromFilter: "1",
      },
    });
  };

  const resetFilters = () => {
    setSort("relevant");
    clearCategory();
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#17301F" />
          </TouchableOpacity>
          <Text pointerEvents="none" style={styles.title}>Bộ lọc</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sắp xếp theo</Text>
            <View style={styles.sortList}>
              {SORT_OPTIONS.map((option, index) => {
                const selected = sort === option.value;
                const isPrimary = index === 0;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setSort(option.value)}
                    style={[
                      styles.sortOption,
                      isPrimary && styles.sortOptionPrimary,
                      selected && styles.sortOptionSelected,
                    ]}
                  >
                    <View style={[styles.sortIconBox, selected && styles.sortIconBoxSelected]}>
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={20}
                        color={selected ? "#FFFFFF" : "#1A7B35"}
                      />
                    </View>
                    <View style={[styles.sortTextBlock, isPrimary && styles.sortTextBlockPrimary]}>
                      <Text style={[styles.sortOptionTitle, selected && styles.sortOptionTitleSelected]}>
                        {option.label}
                      </Text>
                    </View>
                    {selected ? (
                      <MaterialCommunityIcons name="check-circle" size={20} color="#1EA64A" />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionTextBlock}>
                <Text style={styles.sectionTitle}>Danh mục</Text>
                <Text style={styles.sectionCaption}>{categoryName || "Tất cả món ăn"}</Text>
              </View>
              {categoryId ? (
                <Pressable onPress={clearCategory} hitSlop={8}>
                  <Text style={styles.clearText}>Bỏ chọn</Text>
                </Pressable>
              ) : null}
            </View>

            {isLoadingCategories ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator color="#1EA64A" />
              </View>
            ) : categoryError ? (
              <Text style={styles.errorText}>{categoryError}</Text>
            ) : (
              <View style={styles.categoryPicker}>
                <View style={styles.categoryNavRow}>
                  <Text style={styles.categoryPathText} numberOfLines={1}>
                    {breadcrumbLabel}
                  </Text>
                  {categoryPath.length > 0 ? (
                    <Pressable
                      onPress={() => setCategoryPath((prev) => prev.slice(0, -1))}
                      style={styles.categoryBackButton}
                    >
                      <Ionicons name="chevron-back" size={16} color="#1A7B35" />
                      <Text style={styles.categoryBackText}>Lùi lại</Text>
                    </Pressable>
                  ) : null}
                </View>

                {currentCategory ? (
                  <Pressable
                    onPress={() => {
                      setCategoryId(currentCategory.id);
                      setCategoryName(currentCategory.name);
                    }}
                    style={[
                      styles.currentCategoryButton,
                      categoryId === currentCategory.id && styles.categoryRowSelected,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={18}
                      color={categoryId === currentCategory.id ? "#FFFFFF" : "#1EA64A"}
                    />
                    <Text
                      style={[
                        styles.currentCategoryText,
                        categoryId === currentCategory.id && styles.categoryTextSelected,
                      ]}
                    >
                      Chọn danh mục này
                    </Text>
                  </Pressable>
                ) : null}

                <View style={styles.categoryList}>
                  {visibleCategories.map((category) => {
                    const selected = categoryId === category.id;
                    const hasChildren = getCategoryChildren(category).length > 0;

                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => {
                          if (hasChildren) {
                            setCategoryPath((prev) => [...prev, category]);
                            return;
                          }

                          setCategoryId(selected ? "" : category.id);
                          setCategoryName(selected ? "" : category.name);
                        }}
                        style={[styles.categoryRow, selected && styles.categoryRowSelected]}
                      >
                        <Text
                          style={[styles.categoryRowText, selected && styles.categoryTextSelected]}
                          numberOfLines={1}
                        >
                          {category.name}
                        </Text>
                        {hasChildren ? (
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={selected ? "#FFFFFF" : "#7A8C80"}
                          />
                        ) : selected ? (
                          <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
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
                  placeholder="60000"
                  keyboardType="number-pad"
                  style={styles.priceInput}
                />
              </View>
              <View style={styles.priceInputWrap}>
                <Text style={styles.inputLabel}>Đến</Text>
                <TextInput
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  placeholder="250000"
                  keyboardType="number-pad"
                  style={styles.priceInput}
                />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Đánh giá tối thiểu</Text>
              <Text style={styles.ratingPreview}>{minRating ? `${minRating}+` : "Tất cả"}</Text>
            </View>
            <View style={styles.ratingGrid}>
              {RATING_OPTIONS.map((option) => {
                const selected = minRating === option.value;

                return (
                  <Pressable
                    key={option.value || "all"}
                    onPress={() => setMinRating(option.value)}
                    style={[styles.ratingChip, selected && styles.ratingChipSelected]}
                  >
                    <MaterialCommunityIcons
                      name="star"
                      size={17}
                      color={selected ? "#FFFFFF" : "#F7B500"}
                    />
                    <Text style={[styles.ratingChipText, selected && styles.ratingChipTextSelected]}>
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
    borderRadius: 20,
    padding: 16,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTextBlock: {
    flex: 1,
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
  sortList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    gap: 10,
  },
  sortOption: {
    width: "48%",
    minHeight: 86,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D4DBD6",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sortOptionPrimary: {
    width: "100%",
    minHeight: 72,
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 12,
    gap: 12,
  },
  sortOptionSelected: {
    backgroundColor: "#F0F8F2",
    borderColor: "#1EA64A",
  },
  sortIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#EAF4ED",
    alignItems: "center",
    justifyContent: "center",
  },
  sortIconBoxSelected: {
    backgroundColor: "#1EA64A",
  },
  sortTextBlock: {
    maxWidth: "100%",
    alignItems: "center",
  },
  sortTextBlockPrimary: {
    flex: 1,
    alignItems: "flex-start",
  },
  sortOptionTitle: {
    fontSize: 13,
    color: "#20352A",
    fontFamily: "Montserrat-Bold",
    textAlign: "center",
  },
  sortOptionTitleSelected: {
    color: "#17301F",
  },
  clearText: {
    color: "#1A7B35",
    fontSize: 13,
    fontFamily: "Montserrat-Bold",
  },
  inlineLoading: {
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 12,
    color: "#C0392B",
    fontSize: 13,
    fontFamily: "Montserrat-Medium",
  },
  categoryPicker: {
    marginTop: 14,
    gap: 10,
  },
  categoryNavRow: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  categoryPathText: {
    flex: 1,
    color: "#52665B",
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
  },
  categoryBackButton: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: "#EFF8F2",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  categoryBackText: {
    color: "#1A7B35",
    fontSize: 12,
    fontFamily: "Montserrat-Bold",
  },
  currentCategoryButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BFDCC8",
    backgroundColor: "#F6FAF7",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currentCategoryText: {
    color: "#1A7B35",
    fontSize: 13,
    fontFamily: "Montserrat-Bold",
  },
  categoryList: {
    gap: 8,
  },
  categoryRow: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D4DBD6",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  categoryRowSelected: {
    backgroundColor: "#1EA64A",
    borderColor: "#1EA64A",
  },
  categoryRowText: {
    flex: 1,
    color: "#31443A",
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
  },
  categoryTextSelected: {
    color: "#FFFFFF",
  },
  pricePreview: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 16,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D5DDD7",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#17301F",
    fontFamily: "Montserrat-SemiBold",
    backgroundColor: "#FDFEFE",
  },
  ratingPreview: {
    fontSize: 14,
    color: "#1A7B35",
    fontFamily: "Montserrat-Bold",
  },
  ratingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  ratingChip: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D4DBD6",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingChipSelected: {
    backgroundColor: "#1EA64A",
    borderColor: "#1EA64A",
  },
  ratingChipText: {
    fontSize: 13,
    color: "#31443A",
    fontFamily: "Montserrat-Bold",
  },
  ratingChipTextSelected: {
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
