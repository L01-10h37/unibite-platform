import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  Clock3,
  FileText,
  LogOut,
  MapPin,
  Settings,
  Store,
  Wallet,
} from "lucide-react-native";

import { SellerBottomTabBar } from "@/components/seller-bottom-tab-bar";
import {
  getMySellerShop,
  parseSellerTokens,
  uploadSellerShopAvatar,
  type SellerShop,
} from "@/services/seller-shop";

const SHOP_AVATAR_FALLBACK = require("@/assets/images/seller/shop-avatar.png");

export default function SellerProfileScreen() {
  const [shop, setShop] = useState<SellerShop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadShop = async () => {
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

        if (isMounted) {
          setShop(currentShop);
        }
      } catch (error) {
        console.error("Failed to load seller profile:", error);
        router.replace("/seller/signin" as any);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadShop();

    return () => {
      isMounted = false;
    };
  }, []);

  const avatarSource = useMemo<ImageSourcePropType>(() => {
    if (shop?.avatar) {
      return { uri: shop.avatar };
    }

    return SHOP_AVATAR_FALLBACK;
  }, [shop?.avatar]);

  const goToEditShop = () => {
    router.push("/seller/edit-shop" as any);
  };

  const handlePickAvatar = async () => {
    if (!shop) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Thiếu quyền", "Vui lòng cấp quyền truy cập ảnh để đổi avatar shop.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const tokens = parseSellerTokens(
        await SecureStore.getItemAsync("sellerTokens"),
      );

      if (!tokens) {
        router.replace("/seller/signin" as any);
        return;
      }

      const asset = result.assets[0];
      const avatar = await uploadSellerShopAvatar(tokens.accessToken, shop.id, {
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });

      if (avatar) {
        setShop({ ...shop, avatar });
      }
    } catch (error) {
      console.error("Failed to upload shop avatar:", error);
      Alert.alert("Lỗi", "Cập nhật avatar thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("sellerTokens");
    router.replace("/seller/signin" as any);
  };

  if (isLoading && !shop) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2478FF" />
        <Text style={styles.loadingText}>Đang tải thông tin shop...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ChevronRight size={26} color="#000000" style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ</Text>
        <TouchableOpacity style={styles.headerButton} onPress={goToEditShop}>
          <Settings size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isUploadingAvatar}
            onPress={handlePickAvatar}
            style={styles.avatarWrap}
          >
            <Image source={avatarSource} style={styles.avatar} />
            <View style={styles.avatarBadge}>
              {isUploadingAvatar ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="camera-outline" size={17} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.shopName}>{shop?.name || "Gian hàng của tôi"}</Text>
          <Text style={styles.shopAddress} numberOfLines={2}>
            {shop?.address || "Chưa cập nhật địa chỉ"}
          </Text>

          <View style={styles.waitingBadge}>
            <Ionicons name="bag-handle-outline" size={18} color="#2478FF" />
            <Text style={styles.waitingText}>
              <Text style={styles.waitingNumber}>2</Text> đơn hàng đang chờ
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN GIAN HÀNG</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Store size={22} color="#536161" />}
              onPress={goToEditShop}
              title="Chỉnh sửa gian hàng"
            />
            <View style={styles.divider} />
            <MenuItem
              icon={<MapPin size={22} color="#536161" />}
              onPress={goToEditShop}
              subtitle={shop?.address || "Chưa cập nhật"}
              title="Địa chỉ cửa hàng"
            />
            <View style={styles.divider} />
            <MenuItem
              icon={<Clock3 size={22} color="#536161" />}
              onPress={goToEditShop}
              subtitle={shop?.openingHours || "Chưa cập nhật"}
              title="Giờ mở cửa"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VẬN HÀNH</Text>
          <View style={styles.menuCard}>
            <MenuItem icon={<Wallet size={22} color="#536161" />} title="Ví doanh thu" />
            <View style={styles.divider} />
            <MenuItem icon={<FileText size={22} color="#536161" />} title="Khai báo thuế" />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      <SellerBottomTabBar />
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  onPress,
  subtitle,
  title,
}: {
  icon: ReactNode;
  onPress?: () => void;
  subtitle?: string;
  title: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={!onPress}
      onPress={onPress}
      style={styles.menuItem}
    >
      <View style={styles.menuLeft}>
        {icon}
        <View style={styles.menuTextWrap}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.menuSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <ChevronRight size={24} color="#2478FF" />
    </TouchableOpacity>
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
    paddingHorizontal: 24,
  },
  loadingText: {
    color: "#4E5F5E",
    fontFamily: "Montserrat-Medium",
    marginTop: 12,
  },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    transform: [{ rotate: "180deg" }],
  },
  headerTitle: {
    color: "#000000",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 26,
    paddingBottom: 24,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    marginBottom: 18,
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 32,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: "#2478FF",
  },
  avatarBadge: {
    position: "absolute",
    right: 2,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2478FF",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  shopName: {
    color: "#223131",
    fontFamily: "PlusJakartaSans-ExtraBold",
    fontSize: 16,
    marginBottom: 7,
    textAlign: "center",
  },
  shopAddress: {
    color: "#6C7A7A",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
    textAlign: "center",
  },
  waitingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#DDF3F2",
    borderRadius: 100,
    paddingHorizontal: 28,
    paddingVertical: 9,
  },
  waitingText: {
    color: "#4E5F5E",
    fontFamily: "BeVietnamPro-Medium",
    fontSize: 16,
  },
  waitingNumber: {
    color: "#2478FF",
    fontFamily: "BeVietnamPro-SemiBold",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: "rgba(34,49,49,0.78)",
    fontFamily: "PlusJakartaSans-ExtraBold",
    fontSize: 12,
    letterSpacing: 1.1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  menuCard: {
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
  },
  menuItem: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  menuLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    color: "rgba(34,49,49,0.82)",
    fontFamily: "BeVietnamPro-SemiBold",
    fontSize: 16,
  },
  menuSubtitle: {
    color: "#9CA7B8",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#F2F8F8",
    marginLeft: 60,
  },
  logoutButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E24255",
    borderRadius: 100,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 2,
  },
  logoutText: {
    color: "#FFFFFF",
    fontFamily: "PlusJakartaSans-ExtraBold",
    fontSize: 16,
  },
});
