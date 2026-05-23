import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const ACTIVE = "#2478FF";
const INACTIVE = "#8C96A4";
const TAB_BAR_STYLE = {
  backgroundColor: "#FFFFFF",
  borderTopColor: "#A8B5C7",
  borderTopWidth: 1,
  height: 78,
  paddingBottom: 10,
  paddingTop: 8,
} as const;

const TAB_LABEL_STYLE = {
  fontFamily: "Montserrat-Medium",
  fontSize: 12,
  marginTop: 2,
} as const;

const HIDDEN_TAB_OPTIONS = {
  href: null,
  tabBarStyle: { display: "none" },
} as const;

export default function SellerLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarLabelStyle: TAB_LABEL_STYLE,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Gian hàng",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
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
        name="order"
        options={{
          title: "Đơn hàng",
          tabBarLabel: "Order",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-outline" size={size} color={color} />
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
      <Tabs.Screen name="signin" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="signup" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="welcome" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="create-shop" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="edit-shop" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="create-food" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="edit-food" options={HIDDEN_TAB_OPTIONS} />
    </Tabs>
  );
}
