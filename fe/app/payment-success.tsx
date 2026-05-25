import Feather from "@expo/vector-icons/build/Feather";
import { router } from "expo-router";
import React from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PaymentSuccessScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Feather name="check-circle" size={34} color="#2F9E44" />
        </View>

        <Text style={styles.title}>Thanh toán thành công</Text>
        <Text style={styles.message}>
          Đơn hàng của bạn đã được ghi nhận. Hãy chờ cửa hàng xác nhận nhé!
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace("/")}>
            <Text style={styles.secondaryText}>Trang chủ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace("/history-order")}>
            <Text style={styles.primaryText}>Đơn mua</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#C5E0CD", justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E9F8ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "900", color: "#1B4332", marginBottom: 8 },
  message: { fontSize: 14, color: "#6E767D", lineHeight: 20, marginBottom: 24 },
  actions: { flexDirection: "row", gap: 12 },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDE3E1",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryText: { fontSize: 14, fontWeight: "700", color: "#4E5F5E" },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#3E7B57",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryText: { fontSize: 14, fontWeight: "800", color: "white" },
});