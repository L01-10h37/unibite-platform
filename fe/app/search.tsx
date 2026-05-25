import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AppBottomTabBar } from "@/components/app-bottom-tab-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 52) / 2;
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";
const PAGE_SIZE = 10;

type SearchParams = {
  query?: string;
  category?: string;
  categoryId?: string;
  categoryName?: string;
  sort?: string;
  minRating?: string;
  minPrice?: string;
  maxPrice?: string;
  fromFilter?: string;
};

type SearchFood = {
  id: string;
  name: string;
  shopName?: string | null;
  shop?: string | null;
  UrlImg?: string | null;
  listUrlImg?: string[] | null;
  price?: number | null;
  average_rating?: number | null;
};

type SearchResponse = {
  success: boolean;
  message: string;
  data: SearchFood[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

function formatPrice(value?: number | null) {
  if (value == null) {
    return "Liên hệ";
  }

  return `${value.toLocaleString("vi-VN")}đ`;
}

function getImageSource(item: SearchFood) {
  const firstFoodImage = item.listUrlImg?.find(Boolean) || item.UrlImg;

  return firstFoodImage
    ? { uri: firstFoodImage }
    : require("@/assets/images/bun-bo-hue-detail-2.png");
}

function buildRequestUrl(
  apiUrl: string,
  pathname: "/api/foods/search" | "/api/foods",
  params: SearchParams,
  page: number,
) {
  const url = new URL(`${apiUrl}${pathname}`);

  if (params.query?.trim()) {
    url.searchParams.set("search", params.query.trim());
  }

  const categoryId = params.categoryId?.trim() || params.category?.trim();

  if (categoryId) {
    url.searchParams.set("categoryId", categoryId);
  }

  if (params.sort?.trim()) {
    url.searchParams.set("order", params.sort.trim());
  }

  if (params.minRating?.trim()) {
    url.searchParams.set("minRating", params.minRating.trim());
  }

  if (params.minPrice?.trim()) {
    url.searchParams.set("minPrice", params.minPrice.trim());
  }

  if (params.maxPrice?.trim()) {
    url.searchParams.set("maxPrice", params.maxPrice.trim());
  }

  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PAGE_SIZE));

  return url.toString();
}

async function fetchFoods(apiUrl: string, params: SearchParams, page = 1) {
  const hasCategory = Boolean(params.categoryId?.trim() || params.category?.trim());

  if (hasCategory) {
    const categoryResponse = await fetch(buildRequestUrl(apiUrl, "/api/foods", params, page), {
      headers: { accept: "application/json" },
    });

    const categoryPayload = (await categoryResponse.json()) as SearchResponse;

    if (!categoryResponse.ok || !categoryPayload.success) {
      throw new Error(categoryPayload.message || "KhÃ´ng tÃ¬m Ä‘Æ°á»£c mÃ³n Äƒn phÃ¹ há»£p");
    }

    return categoryPayload;
  }

  const searchResponse = await fetch(buildRequestUrl(apiUrl, "/api/foods/search", params, page), {
    headers: { accept: "application/json" },
  });

  const searchPayload = (await searchResponse.json()) as SearchResponse;

  if (searchResponse.ok && searchPayload.success) {
    return searchPayload;
  }

  const fallbackResponse = await fetch(buildRequestUrl(apiUrl, "/api/foods", params, page), {
    headers: { accept: "application/json" },
  });

  const fallbackPayload = (await fallbackResponse.json()) as SearchResponse;

  if (!fallbackResponse.ok || !fallbackPayload.success) {
    throw new Error(searchPayload.message || fallbackPayload.message || "Không tìm được món ăn phù hợp");
  }

  return fallbackPayload;
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<SearchParams>();
  const query = typeof params.query === "string" ? params.query : "";
  const categoryId =
    typeof params.categoryId === "string"
      ? params.categoryId
      : typeof params.category === "string"
        ? params.category
        : "";
  const sort = typeof params.sort === "string" ? params.sort : "relevant";
  const minRating = typeof params.minRating === "string" ? params.minRating : "";
  const minPrice = typeof params.minPrice === "string" ? params.minPrice : "";
  const maxPrice = typeof params.maxPrice === "string" ? params.maxPrice : "";
  const categoryName = typeof params.categoryName === "string" ? params.categoryName : "";
  const fromFilter = typeof params.fromFilter === "string" ? params.fromFilter : "";

  const [searchText, setSearchText] = useState(query);
  const [foods, setFoods] = useState<SearchFood[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    setSearchText(query);
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    const loadFoods = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const payload = await fetchFoods(API_URL, {
          query,
          categoryId,
          sort,
          minRating,
          minPrice,
          maxPrice,
        }, 1);

        if (isMounted) {
          setFoods(payload.data ?? []);
          setTotal(payload.pagination?.total ?? payload.data?.length ?? 0);
          setPage(payload.pagination?.page ?? 1);
          setTotalPages(payload.pagination?.pages ?? 1);
        }
      } catch (error) {
        if (isMounted) {
          setFoods([]);
          setTotal(0);
          setPage(1);
          setTotalPages(1);
          setErrorMessage(error instanceof Error ? error.message : "Không tìm được món ăn phù hợp");
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
  }, [query, categoryId, sort, minRating, minPrice, maxPrice]);

  const loadMoreFoods = useCallback(async () => {
    if (isLoading || isLoadingMoreRef.current || page >= totalPages) {
      return;
    }

    const nextPage = page + 1;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const payload = await fetchFoods(API_URL, {
        query,
        categoryId,
        sort,
        minRating,
        minPrice,
        maxPrice,
      }, nextPage);

      setFoods((current) => {
        const existingIds = new Set(current.map((food) => food.id));
        const nextFoods = (payload.data ?? []).filter((food) => !existingIds.has(food.id));
        return [...current, ...nextFoods];
      });
      setTotal(payload.pagination?.total ?? total);
      setPage(payload.pagination?.page ?? nextPage);
      setTotalPages(payload.pagination?.pages ?? totalPages);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không tải được trang tiếp theo");
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [categoryId, isLoading, maxPrice, minPrice, minRating, page, query, sort, total, totalPages]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (distanceFromBottom < 220) {
      loadMoreFoods();
    }
  };

  const submitSearch = () => {
    const nextQuery = searchText.trim();

    router.replace({
      pathname: "/search",
      params: {
        query: nextQuery,
        categoryId,
        categoryName,
        sort,
        minRating,
        minPrice,
        maxPrice,
      },
    });
  };

  const openFilter = () => {
    router.push({
      pathname: "/filter",
      params: {
        query: searchText.trim() || query,
        categoryId,
        categoryName,
        sort,
        minRating,
        minPrice,
        maxPrice,
      },
    });
  };

  const handleBack = () => {
    if (fromFilter === "1") {
      router.replace("/(tabs)");
      return;
    }

    router.back();
  };

  const activeFilterCount = [sort !== "relevant", categoryId, minRating, minPrice, maxPrice].filter(Boolean).length;

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.8} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#17301F" />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Pressable onPress={submitSearch} hitSlop={10} style={styles.searchIconButton}>
              <Ionicons name="search" size={20} color="#1A1A1A" />
            </Pressable>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Tìm kiếm món ăn"
              placeholderTextColor="#7A7A7A"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={submitSearch}
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.titleRow}>
            <Text style={styles.title}>{`Kết quả tìm kiếm (${total})`}</Text>

            <Pressable style={styles.filterButton} onPress={openFilter}>
              <MaterialCommunityIcons name="tune-variant" size={18} color="#1EA64A" />
              {/* <Text style={styles.filterButtonText}>Bộ lọc</Text> */}
              {activeFilterCount > 0 ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color="#1EA64A" />
              <Text style={styles.stateText}>Đang tìm món ăn...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : foods.length === 0 ? (
            <View style={styles.stateBox}>
              <Text style={styles.emptyTitle}>Không có kết quả</Text>
              <Text style={styles.emptyText}>Hãy thử đổi từ khóa hoặc bộ lọc khác.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {foods.map((food) => (
                <Pressable
                  key={food.id}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: "/food-detail",
                      params: { id: food.id },
                    })
                  }
                >
                  <Image source={getImageSource(food)} style={styles.cardImage} />

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {food.name}
                    </Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {food.shopName || food.shop || "Quán ăn"}
                    </Text>

                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons name="star" size={16} color="#F7B500" />
                      <Text style={styles.metaText}>{(food.average_rating ?? 0).toFixed(1)}</Text>
                    </View>

                    <Text style={styles.price}>{formatPrice(food.price)}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {isLoadingMore ? (
            <View style={styles.loadMoreBox}>
              <ActivityIndicator color="#1EA64A" />
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <AppBottomTabBar />
    </KeyboardAvoidingView>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F6F6F6",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  searchIconButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
    color: "#1A1A1A",
    fontFamily: "Montserrat-Medium",
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 124,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    flex: 1,
    fontSize: 17,
    color: "#17301F",
    fontFamily: "Montserrat-Bold",
    paddingRight: 12,
  },
  filterButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6E1D8",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterButtonText: {
    color: "#17301F",
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#1EA64A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Montserrat-Bold",
  },
  stateBox: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  stateText: {
    marginTop: 12,
    color: "#315A3E",
    fontSize: 14,
    fontFamily: "Montserrat-Medium",
  },
  errorText: {
    color: "#C0392B",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Montserrat-Medium",
  },
  emptyTitle: {
    color: "#17301F",
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
  },
  emptyText: {
    marginTop: 8,
    color: "#4E6A57",
    fontSize: 13,
    textAlign: "center",
    fontFamily: "Montserrat-Medium",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  loadMoreBox: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 138,
    backgroundColor: "#DDE8DF",
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardTitle: {
    fontSize: 16,
    color: "#171717",
    fontFamily: "Montserrat-Bold",
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6A6A6A",
    fontFamily: "Montserrat-Medium",
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#444",
    fontFamily: "Montserrat-Medium",
  },
  price: {
    marginTop: 6,
    fontSize: 16,
    color: "#1EA64A",
    fontFamily: "Montserrat-Bold",
  },
});
