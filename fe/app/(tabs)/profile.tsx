import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronRight,
  Settings,
  ShoppingBasket,
  Award,
  UserRoundPen,
  MapPin,
  History,
  Truck,
  Bell,
  Globe,
  ShieldQuestionMark,
  Info
} from 'lucide-react-native';
import { router } from 'expo-router';

// API URL và các hằng số khác
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";
const PROFILE_CACHE_KEY = "profile-cache-v1";
const AVATAR_FALLBACK = { uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" };

// User Profile Type (để định nghĩa kiểu dữ liệu của hồ sơ người dùng)
type UserProfile = {
  id: string;
  name: string;
  username: string;
  phone?: string | null;
  avatar?: string | null;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  completedOrders: number; // Số lượng đơn hàng đã hoàn thành
};

type ProfileResponse = {
  success: boolean;
  message: string;
  data: UserProfile;
};

type CachedProfile = {
  profile: UserProfile;
  cachedAt: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);


      try {
        const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as CachedProfile;
          if (parsed?.profile && isMounted) {
            setProfile(parsed.profile);
          }
        }
      } catch (error) {
        console.warn("Failed to read cached profile", error);
      }

      try {
        const tokensRaw = await SecureStore.getItemAsync("tokens");
        const tokens = tokensRaw ? JSON.parse(tokensRaw) : null;
        const accessToken = tokens?.accessToken;

        if (!accessToken) {
          throw new Error("Missing access token");
        }

        const response = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const payload = (await response.json()) as ProfileResponse;

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Không lấy được thông tin tài khoản");
        }

        if (isMounted) {
          setProfile(payload.data);
        }

        await AsyncStorage.setItem(
          PROFILE_CACHE_KEY,
          JSON.stringify({
            profile: payload.data,
            cachedAt: new Date().toISOString(),
          }),
        );
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const avatarSource = useMemo(() => {
    if (profile?.avatar) {
      return { uri: profile.avatar };
    }
    return AVATAR_FALLBACK;
  }, [profile?.avatar]);

  if (isLoading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#459B5E" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <View style={styles.backIconRotated}>
            <ChevronRight />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Settings />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageWrapper}>
              <Image
                source={avatarSource}
                style={styles.profileImage}
              />
            </View>
            <View style={styles.badge}>
              <Award size={20} stroke="#D1FFC8" />
            </View>
          </View>

          <Text style={styles.userName}>{profile?.name || "Người dùng"}</Text>

          <View style={styles.completedBadge}>
            <ShoppingBasket size={18} stroke="#176A21" />
            <Text style={styles.completedText}>
              <Text style={styles.completedNumber}>{profile?.completedOrders || 0}</Text>
              <Text style={styles.completedLabel}> đơn hàng đã hoàn tất</Text>
            </Text>
          </View>
        </View>

        {/* My Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TÀI KHOẢN CỦA TÔI</Text>
          <View style={styles.menuCard}>
            <MenuItem icon={<UserRoundPen size={22} stroke="rgba(34,49,49,0.8)" />} title="Chỉnh sửa hồ sơ" />
            <View style={styles.divider} />
            <MenuItem icon={<MapPin size={22} stroke="rgba(34,49,49,0.8)" />} title="Địa chỉ đã lưu" onPress={() => router.push('/address')} />
          </View>
        </View>

        {/* My Orders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ĐƠN HÀNG CỦA TÔI</Text>
          <View style={styles.menuCard}>
            <MenuItem icon={<History size={22} stroke="rgba(34,49,49,0.8)" />} title="Lịch sử đơn hàng" showBorder onPress={() => router.push('/(tabs)/orders')} />
            <MenuItem icon={<Truck size={22} stroke="rgba(34,49,49,0.8)" />} title="Đơn hàng đang giao" badge="1" />
          </View>
        </View>

        {/* Settings & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CÀI ĐẶT & HỖ TRỢ</Text>
          <View style={styles.menuCard}>
            <MenuItem icon={<Bell size={22} stroke="rgba(34,49,49,0.8)" />} title="Thông báo" showBorder />
            <MenuItem
              icon={<Globe size={22} stroke="rgba(34,49,49,0.8)" />}
              title="Ngôn ngữ"
              rightText="Tiếng Việt"
              showBorder
            />
            <MenuItem icon={<ShieldQuestionMark size={22} stroke="rgba(34,49,49,0.8)" />} title="Chính sách bảo mật" showBorder />
            <MenuItem icon={<Info size={22} stroke="rgba(34,49,49,0.8)" />} title="Trợ giúp & Hỗ trợ" />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            // Xóa token và chuyển hướng về trang đăng nhập
            SecureStore.deleteItemAsync('tokens').then(() => {
              router.push('/signin');
            });
          }}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Menu Item Component
const MenuItem = ({
  icon,
  title,
  rightText,
  badge,
  showBorder,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  rightText?: string;
  badge?: string;
  showBorder?: boolean;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={[styles.menuItem, showBorder && styles.menuItemBorder]} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      {icon}
      <Text style={styles.menuItemText}>{title}</Text>
    </View>
    <View style={styles.menuItemRight}>
      {rightText && <Text style={styles.menuItemRightText}>{rightText}</Text>}
      {badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      <ChevronRight />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#CFE9D7",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#CFE9D7",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#4E4E4E",
    fontFamily: "Montserrat-Medium",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    fontSize: 20,
    color: '#000',
    fontFamily: 'Montserrat-ExtraBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#223131',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  profileImageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  profileImageWrapper: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#9df197',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    backgroundColor: '#176a21',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    color: '#223131',
    marginBottom: 16,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  completedBadge: {
    backgroundColor: '#e1f5f4',
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedText: {
    fontSize: 16,
  },
  completedNumber: {
    color: '#176a21',
    fontFamily: 'BeVietnamPro-SemiBold',
  },
  completedLabel: {
    fontWeight: '500',
    color: '#4e5f5e',
    fontFamily: 'BeVietnamPro-Medium',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    color: 'rgba(34,49,49,0.8)',
    letterSpacing: 1.2,
    marginBottom: 16,
    paddingHorizontal: 8,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232,250,249,0.3)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: 'rgba(34,49,49,0.8)',
    fontFamily: 'BeVietnamPro-SemiBold',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemRightText: {
    fontSize: 16,
    color: '#4e5f5e',
    fontFamily: 'BeVietnamPro-Medium',
  },
  menuBadge: {
    backgroundColor: '#176a21',
    borderRadius: 100,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  menuBadgeText: {
    fontSize: 11.2,
    fontFamily: 'BeVietnamPro-SemiBold',
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#fff',
  },
  logoutButton: {
    backgroundColor: '#e24255',
    borderRadius: 100,
    paddingVertical: 20,
    width: '60%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
});