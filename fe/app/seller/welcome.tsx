import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2, Store } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const COLORS = {
  blue: "#9DBCF0",
  blueLight: "#F1F6FF",
  text: "#424242",
  muted: "#8D8D8D",
};

const noFontScale = {
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
} as const;

export default function SellerWelcomeScreen() {
  const params = useLocalSearchParams<{ shopName?: string }>();
  const shopName = Array.isArray(params.shopName)
    ? params.shopName[0]
    : params.shopName;

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <CheckCircle2 color="#FFFFFF" size={42} strokeWidth={2.4} />
      </View>

      <Text {...noFontScale} style={styles.title}>
        Chào mừng!
      </Text>
      <Text {...noFontScale} style={styles.subtitle}>
        {shopName || "Shop của bạn"} đã được tạo thành công. Bạn có thể bắt đầu
        quản lý cửa hàng và đăng món bán trên Unibite.
      </Text>

      <View style={styles.shopPanel}>
        <Store color={COLORS.blue} size={24} strokeWidth={2} />
        <Text {...noFontScale} style={styles.shopName}>
          {shopName || "Shop của bạn"}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.86}
        onPress={() => router.replace("/seller" as any)}
        style={styles.submitButton}
      >
        <Text {...noFontScale} style={styles.submitText}>
          Vào kênh người bán
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  badge: {
    alignItems: "center",
    backgroundColor: COLORS.blue,
    borderRadius: 42,
    height: 84,
    justifyContent: "center",
    marginBottom: 28,
    width: 84,
  },
  title: {
    color: COLORS.text,
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.muted,
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: "center",
  },
  shopPanel: {
    alignItems: "center",
    backgroundColor: COLORS.blueLight,
    borderRadius: 10,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 28,
    minHeight: 56,
    paddingHorizontal: 18,
    width: "100%",
  },
  shopName: {
    color: COLORS.text,
    flex: 1,
    fontFamily: "Montserrat-Bold",
    fontSize: 16,
    lineHeight: 22,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: COLORS.blue,
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 50,
    width: "100%",
  },
  submitText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 18,
    lineHeight: 24,
  },
});
