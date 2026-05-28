import { Provider } from "react-redux"; // 1. Thêm import này
import { store } from "../../store/store"; // Import store vừa tạo
import { useSelector, useDispatch } from "react-redux"; // Để lấy dữ liệu và kích hoạt fetch
import { RootState, AppDispatch } from "../../store/store";
import { fetchCart } from "../../store/cartSlice";
import {
  styles,
  tabBarLabelStyle,
  tabBarStyle,
} from "@/constants/tabs-layout-styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View, Text, StyleSheet } from "react-native";
import OnboardingScreen from "./onboarding";

const STORAGE_KEY = "has_launched";
const PRIMARY_COLOR = "#1EA64A";

function MainTabsLayout() {
  const dispatch = useDispatch<AppDispatch>();
  
  const distinctItemsCount = useSelector((state: RootState) => state.cart.items.length);

  useEffect(() => {
    // Tự động gọi API lấy giỏ hàng ngay khi mở app
    dispatch(fetchCart());
  }, [dispatch]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY_COLOR,
        tabBarInactiveTintColor: "#8C96A4",
        tabBarStyle,
        tabBarLabelStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="voucher"
        options={{
          title: "Voucher",
          tabBarLabel: "Voucher",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="ticket-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Giỏ hàng",
          tabBarLabel: "",
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <TouchableOpacity
              onPress={props.onPress}
              onLongPress={props.onLongPress ?? undefined}
              accessibilityState={props.accessibilityState}
              accessibilityLabel={props.accessibilityLabel}
              testID={props.testID}
              style={[props.style, styles.centerTabButtonWrapper]}
              activeOpacity={0.9}
            >
              <View style={{ position: 'relative' }}>
                <View style={styles.centerTabButton}>
                  <MaterialCommunityIcons
                    name="shopping-outline"
                    size={28}
                    color="#FFFFFF"
                  />
                </View>

                {/* HIỂN THỊ BADGE SỐ LƯỢNG KHI LỚN HƠN 0 */}
                {distinctItemsCount > 0 && (
                  <View style={localStyles.badge}>
                    <Text style={localStyles.badgeText}>{distinctItemsCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="review"
        options={{
          title: "Đánh giá",
          tabBarLabel: "Review",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="message-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      /> */}

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="onboarding"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  // Onboarding logic: Kiểm tra lần đầu mở app và lưu trạng thái vào SecureStore
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const value = await SecureStore.getItemAsync(STORAGE_KEY);
        setIsFirstLaunch(value === null);
      } catch {
        setIsFirstLaunch(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleOnboardingDone = async () => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, "true");
      setIsFirstLaunch(false);
    } catch (error) {
      console.error("Error saving status:", error);
    }
  };

  // 1. Hiệu ứng chờ khi đang kiểm tra bộ nhớ
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  // 2. Nếu là lần đầu mở app -> Hiển thị Onboarding
  if (isFirstLaunch) {
    return <OnboardingScreen onDone={handleOnboardingDone} />;
  }

  // 3. Đã vào App chính -> Cấu hình các Tabs và Icon
  return (
    <Provider store={store}>
      <MainTabsLayout />
    </Provider>
  );
}

const localStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,                  // Đẩy lên góc trên của hình tròn xanh
    right: -4,                // Đẩy sang góc phải
    backgroundColor: '#e20505',
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    // Hiệu ứng shadow đổ bóng mượt mà giống hệt ảnh mẫu của bạn
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
});