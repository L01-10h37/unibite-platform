import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACTIVE = "#2478FF";
const INACTIVE = "#8C96A4";

const TABS = [
  {
    label: "Home",
    route: "/seller",
    icon: (color: string) => <Ionicons name="home-outline" size={26} color={color} />,
  },
  {
    label: "Review",
    route: "/seller/review",
    icon: (color: string) => (
      <MaterialCommunityIcons name="message-outline" size={27} color={color} />
    ),
  },
  {
    label: "Order",
    route: "/seller/order",
    icon: (color: string) => (
      <MaterialCommunityIcons name="book-outline" size={29} color={color} />
    ),
  },
  {
    label: "Profile",
    route: "/seller/profile",
    icon: (color: string) => <Ionicons name="person-outline" size={26} color={color} />,
  },
];

export function SellerBottomTabBar() {
  const pathname = usePathname();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.container}>
        {TABS.map((tab) => {
          const active =
            tab.route === "/seller" ? pathname === "/seller" : pathname === tab.route;
          const color = active ? ACTIVE : INACTIVE;

          return (
            <TouchableOpacity
              key={tab.label}
              onPress={() => router.push(tab.route as any)}
              style={styles.tab}
              activeOpacity={0.8}
            >
              {tab.icon(color)}
              <Text style={[styles.label, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#A8B5C7",
  },
  container: {
    height: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  tab: {
    width: 78,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: {
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
  },
});
