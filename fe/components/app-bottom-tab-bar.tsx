import {
  styles as tabStyles,
  tabBarLabelStyle,
  tabBarStyle,
} from "@/constants/tabs-layout-styles";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INACTIVE_COLOR = "#8C96A4";

export function AppBottomTabBar() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.container, tabBarStyle]}>
      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.8}
        onPress={() => router.push("/(tabs)")}
      >
        <Ionicons name="home-outline" size={24} color={INACTIVE_COLOR} />
        <Text style={[styles.label, tabBarLabelStyle]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.8}
        onPress={() => router.push("/(tabs)/voucher")}
      >
        <MaterialCommunityIcons
          name="ticket-outline"
          size={24}
          color={INACTIVE_COLOR}
        />
        <Text style={[styles.label, tabBarLabelStyle]}>Voucher</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.centerWrapper}
        activeOpacity={0.9}
        onPress={() => router.push("/(tabs)/cart")}
      >
        <View style={tabStyles.centerTabButton}>
          <MaterialCommunityIcons
            name="shopping-outline"
            size={28}
            color="#FFFFFF"
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.8}
        onPress={() => router.push("/(tabs)/review")}
      >
        <MaterialCommunityIcons
          name="message-outline"
          size={24}
          color={INACTIVE_COLOR}
        />
        <Text style={[styles.label, tabBarLabelStyle]}>Review</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.8}
        onPress={() => router.push("/(tabs)/profile")}
      >
        <Ionicons name="person-outline" size={24} color={INACTIVE_COLOR} />
        <Text style={[styles.label, tabBarLabelStyle]}>Profile</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: INACTIVE_COLOR,
  },
  centerWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    top: -18,
  },
});
