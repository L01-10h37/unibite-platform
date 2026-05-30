import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/constants/api";

export default function PaymentResultScreen() {
  const { paymentId } = useLocalSearchParams();
  const [message, setMessage] = useState("Đang kiểm tra thanh toán...");

  useEffect(() => {
    const checkPayment = async () => {
      try {
        const tokensRaw = await SecureStore.getItemAsync("tokens");
        const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;

        const res = await fetch(`${API_BASE_URL}/api/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Không thể kiểm tra thanh toán");
        }

        const payment = json.data;

        if (payment.status === "SUCCESS") {
          router.replace({
            pathname: "/checkout",
            params: { paymentSuccess: "true" },
          });
          return;
        }

        if (payment.status === "FAILED") {
          router.replace({
            pathname: "/checkout",
            params: { paymentFailed: "true" },
          });
          return;
        }

        setMessage("Thanh toán đang được xử lý. Vui lòng thử lại sau.");
      } catch (error: any) {
        setMessage(error.message || "Có lỗi khi kiểm tra thanh toán.");
      }
    };

    checkPayment();
  }, [paymentId]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#295D38" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#C5E0CD",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  text: {
    marginTop: 12,
    color: "#223131",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});