import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  getMySellerShop,
  parseSellerTokens,
  type SellerShop,
} from "@/services/seller-shop";

export default function SellerHomeScreen() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [shop, setShop] = useState<SellerShop | null>(null);

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

        setShop(currentShop);
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#9DBCF0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kênh người bán</Text>
      <Text style={styles.shopName}>{shop?.name}</Text>
      <Text style={styles.subtitle}>
        Shop đã sẵn sàng. Bạn có thể tiếp tục thêm các màn quản lý món ăn,
        đơn hàng và thông tin cửa hàng trong khu vực người bán.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 28,
    color: "#9DBCF0",
    marginBottom: 12,
  },
  shopName: {
    fontFamily: "Montserrat-Bold",
    fontSize: 20,
    color: "#424242",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Montserrat-Medium",
    fontSize: 15,
    lineHeight: 22,
    color: "#616161",
  },
});
