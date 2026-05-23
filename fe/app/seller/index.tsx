import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SellerBottomTabBar } from "@/components/seller-bottom-tab-bar";
import { getMySellerShop, parseSellerTokens } from "@/services/seller-shop";

export default function SellerHomeScreen() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkSellerAuth = async () => {
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

        setIsCheckingAuth(false);
      } catch (error) {
        console.error("Error checking seller shop:", error);
        router.replace("/seller/signin" as any);
      }
    };

    checkSellerAuth();
  }, []);

  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2478FF" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Đang phát triển</Text>
        <Text style={styles.subtitle}>Tính năng Home cho người bán sẽ được cập nhật sau.</Text>
      </View>
      <SellerBottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EAF9F8",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF9F8",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    color: "#111111",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 24,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "#65727F",
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
