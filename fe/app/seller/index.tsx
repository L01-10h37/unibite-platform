import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react-native";

import {
  getMySellerShop,
  getMySellerOrders,
  getSellerMenu,
  parseSellerTokens,
  updateSellerFood,
  type SellerFood,
  type SellerOrder,
  type SellerShop,
} from "@/services/seller-shop";

const SHOP_AVATAR_FALLBACK = require("@/assets/images/seller/shop-avatar.png");
const FOOD_IMAGE_FALLBACK = require("@/assets/images/seller/milk-tea.png");

const BLUE = "#2478FF";
const BORDER = "#9FAFC0";
const BG = "#EAF9F8";
const noFontScale = {
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
} as const;

export default function SellerHomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [shop, setShop] = useState<SellerShop | null>(null);
  const [menu, setMenu] = useState<SellerFood[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [orderRange, setOrderRange] = useState(() => getCurrentMonthRange());
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [draftFromDate, setDraftFromDate] = useState(orderRange.fromDate);
  const [draftToDate, setDraftToDate] = useState(orderRange.toDate);
  const [calendarTarget, setCalendarTarget] = useState<"from" | "to" | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    parseApiDate(orderRange.toDate),
  );

  const openDateFilter = () => {
    setDraftFromDate(orderRange.fromDate);
    setDraftToDate(orderRange.toDate);
    setCalendarTarget(null);
    setShowDateFilter(true);
  };

  const applyDateFilter = () => {
    if (!isValidApiDate(draftFromDate) || !isValidApiDate(draftToDate)) {
      return;
    }

    setOrderRange({
      fromDate: draftFromDate,
      toDate: draftToDate,
    });
    setShowDateFilter(false);
  };

  const resetDateFilter = () => {
    const currentMonthRange = getCurrentMonthRange();

    setDraftFromDate(currentMonthRange.fromDate);
    setDraftToDate(currentMonthRange.toDate);
    setOrderRange(currentMonthRange);
    setCalendarTarget(null);
    setShowDateFilter(false);
  };

  const openCalendar = (target: "from" | "to") => {
    const date = target === "from" ? draftFromDate : draftToDate;

    setCalendarTarget(target);
    setCalendarMonth(isValidApiDate(date) ? parseApiDate(date) : new Date());
  };

  const selectCalendarDate = (date: string) => {
    if (calendarTarget === "from") {
      setDraftFromDate(date);
    } else if (calendarTarget === "to") {
      setDraftToDate(date);
    }

    setCalendarTarget(null);
  };

  const handleToggleAvailability = async (food: SellerFood) => {
    try {
      const tokens = parseSellerTokens(await SecureStore.getItemAsync("sellerTokens"));

      if (!tokens) {
        router.replace("/seller/signin" as any);
        return;
      }

      const updated = await updateSellerFood(tokens.accessToken, food.id, {
        isAvailable: !food.isAvailable,
      });

      setMenu((current) =>
        current.map((item) => (item.id === food.id ? { ...item, ...updated } : item)),
      );
    } catch (error) {
      console.error("Failed to update food availability:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

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
          const sellerOrders = await getMySellerOrders(tokens.accessToken, {
            fromDate: orderRange.fromDate,
            toDate: orderRange.toDate,
            limit: 1000,
          }).catch((error) => {
            console.error("Failed to load seller orders:", error);
            return { orders: [] };
          });

          if (isActive) {
            setShop(currentShop);
            setMenu(foods);
            setOrders(sellerOrders.orders);
          }
        } catch (error) {
          console.error("Error loading seller home:", error);
          router.replace("/seller/signin" as any);
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      loadHome();

      return () => {
        isActive = false;
      };
    }, [orderRange.fromDate, orderRange.toDate]),
  );

  const avatarSource = useMemo<ImageSourcePropType>(() => {
    if (shop?.avatar) {
      return { uri: shop.avatar };
    }

    return SHOP_AVATAR_FALLBACK;
  }, [shop?.avatar]);
  const shopMetrics = useMemo(() => {
    const profit = shop?.profit ?? 0;
    const ratingCount = shop?.rating_count ?? 0;
    const averageRating = shop?.average_rating ?? 0;

    return {
      profit: formatProfitMetric(profit),
      ratingCount: String(ratingCount),
      rating: ratingCount > 0 ? `${averageRating.toFixed(1)}/5` : "-/5",
    };
  }, [shop?.average_rating, shop?.profit, shop?.rating_count]);
  const orderStats = useMemo(() => getOrderStats(orders), [orders]);

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
        <Text {...noFontScale} style={styles.screenTitle}>
          Gian hàng của tôi
        </Text>

        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => router.push("/seller/profile" as any)}
          style={styles.shopCard}
        >
          <Image source={avatarSource} style={styles.shopAvatar} />
          <View style={styles.shopInfo}>
            <Text {...noFontScale} style={styles.shopName} numberOfLines={1}>
              {shop?.name || "Gian hàng của tôi"}
            </Text>
            <Text {...noFontScale} style={styles.shopTime} numberOfLines={1}>
              {shop?.openingHours || "Chưa cập nhật giờ mở cửa"}
            </Text>
            <Text {...noFontScale} style={styles.rankText} numberOfLines={1}>
              {shop?.address || "Chưa cập nhật địa chỉ"}
            </Text>
          </View>
          <ChevronRight size={18} color="#8EA0B4" />

          <View style={styles.shopMetrics}>
            <Metric value={shopMetrics.profit} label="Lợi nhuận" />
            <Metric value={shopMetrics.ratingCount} label="Lượt đánh giá" />
            <Metric value={shopMetrics.rating} label="Đánh giá" />
          </View>
        </TouchableOpacity>

        <View style={styles.orderCard}>
          <View style={styles.cardHeader}>
            <Text {...noFontScale} style={styles.cardTitle}>
              Đơn hàng
            </Text>
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={openDateFilter}
              style={styles.dateResetButton}
            >
              <Text {...noFontScale} style={styles.cardDate}>
                {formatDateRange(orderRange)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={openDateFilter}
              style={styles.headerChevronButton}
            >
              <ChevronRight size={17} color="#8EA0B4" />
            </TouchableOpacity>
          </View>
          <View style={styles.orderStats}>
            <OrderStat active value={String(orderStats.pending)} label="Đang chờ" />
            <OrderStat value={String(orderStats.completed)} label="Hoàn thành" />
            <OrderStat value={String(orderStats.processing)} label="Đang xử lý" />
            <OrderStat value={String(orderStats.total)} label="Tổng đơn" />
          </View>
        </View>

        <View style={styles.menuCard}>
          <View style={styles.cardHeader}>
            <Text {...noFontScale} style={styles.cardTitle}>
              Thực đơn
            </Text>
            <ChevronRight size={17} color="#8EA0B4" />
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/seller/create-food" as any)}
            style={styles.addButton}
          >
            <Plus size={26} color="#FFFFFF" />
            <Text {...noFontScale} style={styles.addButtonText}>
              Thêm món mới
            </Text>
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
              <Text {...noFontScale} style={styles.emptyTitle}>
                Chưa có món nào
              </Text>
              <Text {...noFontScale} style={styles.emptyText}>
                Thêm món mới để bắt đầu bán hàng.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={showDateFilter}
        onRequestClose={() => setShowDateFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateModal}>
            <Text {...noFontScale} style={styles.modalTitle}>
              Chọn ngày đơn hàng
            </Text>
            <DateInputRow
              label="Từ ngày"
              value={draftFromDate}
              onChangeText={setDraftFromDate}
              onOpenCalendar={() => openCalendar("from")}
            />
            <DateInputRow
              label="Đến ngày"
              value={draftToDate}
              onChangeText={setDraftToDate}
              onOpenCalendar={() => openCalendar("to")}
            />
            {calendarTarget ? (
              <CalendarPicker
                monthDate={calendarMonth}
                selectedDate={calendarTarget === "from" ? draftFromDate : draftToDate}
                onChangeMonth={setCalendarMonth}
                onSelectDate={selectCalendarDate}
              />
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={resetDateFilter}
                style={styles.modalSecondaryButton}
              >
                <Text {...noFontScale} numberOfLines={1} style={styles.modalSecondaryText}>
                  Tháng này
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={applyDateFilter}
                style={styles.modalPrimaryButton}
              >
                <Text {...noFontScale} numberOfLines={1} style={styles.modalPrimaryText}>
                  Áp dụng
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => setShowDateFilter(false)}
              style={styles.modalCloseButton}
            >
              <Text {...noFontScale} style={styles.modalCloseText}>
                Đóng
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text {...noFontScale} style={styles.metricValue}>
        {value}
      </Text>
      <Text {...noFontScale} style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
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
      <Text {...noFontScale} style={[styles.orderValue, active && styles.orderValueActive]}>
        {value}
      </Text>
      <Text {...noFontScale} style={styles.orderLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function DateInputRow({
  label,
  onChangeText,
  onOpenCalendar,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  onOpenCalendar: () => void;
  value: string;
}) {
  return (
    <View style={styles.dateInputGroup}>
      <Text {...noFontScale} style={styles.dateInputLabel}>
        {label}
      </Text>
      <View style={styles.dateInputRow}>
        <TextInput
          {...noFontScale}
          value={value}
          onChangeText={onChangeText}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9AA6B9"
          style={styles.dateInput}
        />
        <TouchableOpacity
          activeOpacity={0.78}
          onPress={onOpenCalendar}
          style={styles.calendarButton}
        >
          <CalendarDays size={18} color={BLUE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CalendarPicker({
  monthDate,
  onChangeMonth,
  onSelectDate,
  selectedDate,
}: {
  monthDate: Date;
  onChangeMonth: (date: Date) => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
}) {
  const weeks = useMemo(() => buildCalendarWeeks(monthDate), [monthDate]);
  const monthLabel = `${String(monthDate.getMonth() + 1).padStart(2, "0")}/${monthDate.getFullYear()}`;
  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const shiftMonth = (offset: number) => {
    onChangeMonth(new Date(monthDate.getFullYear(), monthDate.getMonth() + offset, 1));
  };

  return (
    <View style={styles.calendarPanel}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          activeOpacity={0.78}
          onPress={() => shiftMonth(-1)}
          style={styles.calendarNavButton}
        >
          <ChevronLeft size={18} color="#596879" />
        </TouchableOpacity>
        <Text {...noFontScale} style={styles.calendarMonthText}>
          {monthLabel}
        </Text>
        <TouchableOpacity
          activeOpacity={0.78}
          onPress={() => shiftMonth(1)}
          style={styles.calendarNavButton}
        >
          <ChevronRight size={18} color="#596879" />
        </TouchableOpacity>
      </View>
      <View style={styles.calendarWeekRow}>
        {weekDays.map((day) => (
          <Text {...noFontScale} key={day} style={styles.calendarWeekText}>
            {day}
          </Text>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={`week-${weekIndex}`} style={styles.calendarWeekRow}>
          {week.map((date, dateIndex) => {
            const dateValue = date ? formatApiDate(date) : "";
            const active = dateValue === selectedDate;

            return (
              <TouchableOpacity
                activeOpacity={date ? 0.78 : 1}
                disabled={!date}
                key={`${weekIndex}-${dateIndex}`}
                onPress={() => date && onSelectDate(dateValue)}
                style={[styles.calendarDayButton, active && styles.calendarDayActive]}
              >
                <Text
                  {...noFontScale}
                  style={[styles.calendarDayText, active && styles.calendarDayTextActive]}
                >
                  {date ? date.getDate() : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      <View style={styles.calendarFooter}>
        <TouchableOpacity
          activeOpacity={0.78}
          onPress={() => onSelectDate(formatApiDate(new Date()))}
        >
          <Text {...noFontScale} style={styles.calendarTodayText}>
            Hôm nay
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getOrderStats(orders: SellerOrder[]) {
  return orders.reduce(
    (stats, order) => {
      const status = order.status?.toUpperCase();

      stats.total += 1;

      if (status === "PENDING") {
        stats.pending += 1;
      } else if (status === "COMPLETED") {
        stats.completed += 1;
      } else if (status !== "CANCELLED") {
        stats.processing += 1;
      }

      return stats;
    },
    {
      pending: 0,
      completed: 0,
      processing: 0,
      total: 0,
    },
  );
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    fromDate: formatApiDate(start),
    toDate: formatApiDate(now),
  };
}

function parseApiDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isValidApiDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = parseApiDate(value);
  return formatApiDate(date) === value;
}

function buildCalendarWeeks(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
  const cells: Array<Date | null> = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: Array<Array<Date | null>> = [];

  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

function formatApiDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  const date = parseApiDate(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${day}/${month}`;
}

function formatDateRange(range: { fromDate: string; toDate: string }) {
  return `${formatDisplayDate(range.fromDate)} - ${formatDisplayDate(range.toDate)}`;
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
        <Text {...noFontScale} style={styles.foodName} numberOfLines={1}>
          {food.name}
        </Text>
        <Text {...noFontScale} style={styles.foodTime}>29 Nov, 01:20 pm</Text>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => onToggleAvailability(food)}
          style={[
            styles.statusPill,
            !food.isAvailable && styles.statusPillUnavailable,
          ]}
        >
          <Text {...noFontScale} style={styles.statusText}>
            {food.isAvailable ? "Hiện có" : "Hết món"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.foodRight}>
        <Text {...noFontScale} style={styles.foodPrice} numberOfLines={1}>
          {formatPrice(price)}
        </Text>
        <Text {...noFontScale} style={styles.soldText}>Đã bán: {food.sold_count || 0}</Text>
        <View style={styles.ratingPill}>
          <Text {...noFontScale} style={styles.ratingText}>{rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatPrice(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;
}

function formatProfitMetric(value: number) {
  const amount = Number(value || 0);

  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}tr`;
  }

  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}k`;
  }

  return `${amount}`;
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
    paddingHorizontal: 11,
    paddingTop: 8,
    paddingBottom: 18,
  },
  screenTitle: {
    color: "#111111",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 12,
    marginLeft: 6,
  },
  shopCard: {
    minHeight: 126,
    backgroundColor: "#FFFFFF",
    borderColor: BORDER,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 12,
    marginBottom: 10,
  },
  shopAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 12,
  },
  shopInfo: {
    flex: 1,
    paddingRight: 8,
  },
  shopName: {
    color: "#171717",
    fontFamily: "Montserrat-Bold",
    fontSize: 16,
    lineHeight: 21,
    marginBottom: 4,
  },
  shopTime: {
    color: "#94A0B4",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  rankText: {
    color: "#94A0B4",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    lineHeight: 16,
  },
  shopMetrics: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  metric: {
    width: "32%",
    alignItems: "center",
    gap: 4,
  },
  metricValue: {
    color: "#000000",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 16,
    lineHeight: 18,
  },
  metricLabel: {
    color: "#9AA6B9",
    fontFamily: "Montserrat-Medium",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 11,
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
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  cardDate: {
    color: "#9AA6B9",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    lineHeight: 16,
  },
  dateResetButton: {
    marginRight: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#F3F7FC",
  },
  headerChevronButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  dateFilterRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  dateFilterButton: {
    flex: 1,
    minHeight: 25,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6E2EF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  dateFilterButtonActive: {
    flex: 1,
    minHeight: 25,
    borderRadius: 999,
    backgroundColor: "#E8F1FF",
    borderWidth: 1,
    borderColor: "#AFCBFA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  dateFilterText: {
    color: "#7C8CA0",
    fontFamily: "Montserrat-Medium",
    fontSize: 10,
    lineHeight: 13,
  },
  dateFilterTextActive: {
    color: BLUE,
    fontFamily: "Montserrat-Bold",
    fontSize: 10,
    lineHeight: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  dateModal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 18,
  },
  modalTitle: {
    color: "#111111",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: "center",
  },
  dateInputGroup: {
    marginBottom: 12,
  },
  dateInputLabel: {
    color: "#4C5A68",
    fontFamily: "Montserrat-Bold",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D6E2EF",
    borderRadius: 10,
  },
  dateInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: 12,
    color: "#111111",
    fontFamily: "Montserrat-Medium",
    fontSize: 13,
  },
  calendarButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarPanel: {
    borderWidth: 1,
    borderColor: "#D6E2EF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarMonthText: {
    color: "#111111",
    fontFamily: "Montserrat-Bold",
    fontSize: 14,
    lineHeight: 18,
  },
  calendarWeekRow: {
    flexDirection: "row",
  },
  calendarWeekText: {
    flex: 1,
    color: "#7C8CA0",
    fontFamily: "Montserrat-Bold",
    fontSize: 11,
    lineHeight: 20,
    textAlign: "center",
  },
  calendarDayButton: {
    flex: 1,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  calendarDayActive: {
    backgroundColor: BLUE,
  },
  calendarDayText: {
    color: "#334155",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    lineHeight: 16,
  },
  calendarDayTextActive: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-Bold",
  },
  calendarFooter: {
    alignItems: "flex-end",
    paddingTop: 8,
  },
  calendarTodayText: {
    color: BLUE,
    fontFamily: "Montserrat-Bold",
    fontSize: 12,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#AFCBFA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  modalPrimaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  modalSecondaryText: {
    color: BLUE,
    fontFamily: "Montserrat-Bold",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  modalPrimaryText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-Bold",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  modalCloseButton: {
    alignSelf: "center",
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  modalCloseText: {
    color: "#7C8CA0",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    lineHeight: 16,
  },
  orderStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  orderStat: {
    width: "24%",
    alignItems: "center",
    gap: 5,
  },
  orderValue: {
    color: "#000000",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 15,
    lineHeight: 18,
  },
  orderValueActive: {
    color: BLUE,
  },
  orderLabel: {
    color: "#98A3B6",
    fontFamily: "Montserrat-Medium",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 18,
  },
  addButton: {
    height: 50,
    borderRadius: 9,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    marginBottom: 18,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 15,
    lineHeight: 20,
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  foodImage: {
    width: 64,
    height: 60,
    borderRadius: 15,
    marginRight: 10,
  },
  foodInfo: {
    flex: 1,
    minWidth: 0,
  },
  foodName: {
    color: "#3A221A",
    fontFamily: "Montserrat-Medium",
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 2,
  },
  foodTime: {
    color: "#3A221A",
    fontFamily: "Montserrat-Regular",
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
  },
  statusPill: {
    width: 104,
    height: 24,
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
    fontSize: 12,
    lineHeight: 16,
  },
  foodRight: {
    width: 106,
    alignItems: "flex-end",
  },
  foodPrice: {
    color: BLUE,
    fontFamily: "Montserrat-Bold",
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 3,
  },
  soldText: {
    color: "#3A221A",
    fontFamily: "Montserrat-Regular",
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 7,
  },
  ratingPill: {
    width: 92,
    height: 24,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A9C9F7",
  },
  ratingText: {
    color: "#000000",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    lineHeight: 16,
  },
  emptyMenu: {
    alignItems: "center",
    paddingVertical: 22,
  },
  emptyTitle: {
    color: "#111111",
    fontFamily: "Montserrat-Bold",
    fontSize: 16,
    lineHeight: 21,
    marginBottom: 6,
  },
  emptyText: {
    color: "#7A8795",
    fontFamily: "Montserrat-Medium",
    fontSize: 13,
    lineHeight: 18,
  },
});
