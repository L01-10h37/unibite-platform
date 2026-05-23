/**
 * AddressScreen - Screen 8
 * Màn hình quản lý địa chỉ giao hàng cho food mobile app
 *
 * Hình ảnh:
 *   - Thay thế MAP_IMAGE_URI và VEGETABLES_IMAGE_URI bằng asset thực tế
 *   - Hoặc dùng react-native-maps cho map thật
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  bgMain: '#C5E0CD',
  white: '#FFFFFF',
  offWhite: '#FEFFFE',
  primaryDark: '#176A21',
  primaryDarker: '#005F31',
  primaryMid: '#3E8C55',
  primaryDeep: '#295D38',
  lightGreen: '#9DF197',
  paleLightGreen: 'rgba(157, 241, 151, 0.3)',
  textDark: '#223131',
  textMid: '#4E5F5E',
  textLight: '#697A79',
  textGrey: '#484C52',
  borderLight: '#C8E2E1',
  tealLight: '#D7EDEC',
  tealBg: '#E1F5F4',
};

// ─── Map Preview Placeholder ───────────────────────────────────────────────────
// Thay bằng ảnh map thực tế hoặc react-native-maps
function MapPreview() {
  return (
    <View style={mapStyles.container}>
      {/* Map placeholder (light green grid-like visual) */}
      <View style={mapStyles.mapPlaceholder}>
        {/* Grid lines horizontal */}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <View
            key={`h-${ratio}`}
            style={[mapStyles.gridLine, mapStyles.gridLineH, { top: `${ratio * 100}%` as any }]}
          />
        ))}
        {/* Grid lines vertical */}
        {[0.33, 0.66].map((ratio) => (
          <View
            key={`v-${ratio}`}
            style={[mapStyles.gridLine, mapStyles.gridLineV, { left: `${ratio * 100}%` as any }]}
          />
        ))}
        {/* Road simulation */}
        <View style={mapStyles.roadH} />
        <View style={mapStyles.roadV} />
        {/* Map pin */}
        <View style={mapStyles.pinWrapper}>
          <View style={mapStyles.pinOuter}>
            <Feather name="map-pin" size={18} color={C.primaryDark} />
          </View>
        </View>
      </View>

      {/* Gradient overlay */}
      <View style={mapStyles.gradient} />

      {/* Location badge */}
      <View style={mapStyles.locationBadge}>
        <Feather name="map-pin" size={11} color={C.primaryDark} />
        <Text style={mapStyles.locationText}>ĐHQG, Thủ Đức</Text>
      </View>
    </View>
  );
}

const mapStyles = StyleSheet.create({
  container: {
    width: '100%',
    height: 192,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#223131',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#D8EDD5',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(180, 220, 180, 0.8)',
  },
  gridLineH: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineV: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  roadH: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginTop: -4,
  },
  roadV: {
    position: 'absolute',
    left: '33%',
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  pinWrapper: {
    position: 'absolute',
    top: '35%',
    left: '30%',
    alignItems: 'center',
  },
  pinOuter: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(34, 49, 49, 0.15)',
  },
  locationBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Be Vietnam Pro' : 'BeVietnamPro-SemiBold',
  },
});

// ─── Address Card ──────────────────────────────────────────────────────────────
interface AddressItemProps {
  icon: 'home' | 'school';
  title: string;
  address: string;
  isDefault?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

function AddressItem({ icon, title, address, isDefault, onEdit, onDelete }: AddressItemProps) {
  const isHome = icon === 'home';
  const iconBg = isHome ? C.primaryDark : C.tealLight;
  const iconColor = isHome ? '#D1FFC8' : C.textMid;

  return (
    <View style={addressStyles.card}>
      {/* Icon */}
      <View style={[addressStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Feather
          name={isHome ? 'home' : 'book-open'}
          size={18}
          color={iconColor}
        />
      </View>

      {/* Content */}
      <View style={addressStyles.content}>
        <View style={addressStyles.titleRow}>
          <Text style={addressStyles.title}>{title}</Text>
          <View style={addressStyles.actionBtns}>
            <TouchableOpacity onPress={onEdit} style={addressStyles.actionBtn}>
              <Feather name="edit-2" size={14} color={C.textLight} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={addressStyles.actionBtn}>
              <Feather name="trash-2" size={13} color={C.textLight} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={addressStyles.address} numberOfLines={2}>
          {address}
        </Text>
        {isDefault && (
          <Text style={addressStyles.defaultLabel}>MẶC ĐỊNH</Text>
        )}
      </View>
    </View>
  );
}

const addressStyles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    gap: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textDark,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Plus Jakarta Sans' : 'PlusJakartaSans-Bold',
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
  address: {
    fontSize: 14,
    fontWeight: '500',
    color: C.textMid,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Be Vietnam Pro' : 'BeVietnamPro-Medium',
  },
  defaultLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Be Vietnam Pro' : 'BeVietnamPro-Bold',
  },
});

// ─── Add New Address Button ────────────────────────────────────────────────────
function AddNewAddressButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={addNewStyles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={addNewStyles.iconCircle}>
        <Feather name="plus" size={16} color={C.textMid} />
      </View>
      <Text style={addNewStyles.label}>Thêm địa chỉ mới</Text>
    </TouchableOpacity>
  );
}

const addNewStyles = StyleSheet.create({
  container: {
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.4)',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    gap: 12,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textMid,
    fontFamily: Platform.OS === 'ios' ? 'Be Vietnam Pro' : 'BeVietnamPro-Bold',
  },
});

// ─── Promotional Card ──────────────────────────────────────────────────────────
function PromoCard() {
  return (
    <View style={promoStyles.card}>
      <View style={promoStyles.textSection}>
        <Text style={promoStyles.tagText}>MẸO GIAO HÀNG</Text>
        <Text style={promoStyles.heading}>
          Lưu địa chỉ giúp bạn{'\n'}đặt hàng nhanh hơn{'\n'}40%
        </Text>
      </View>
      {/* Vegetables image placeholder */}
      <View style={promoStyles.imageWrapper}>
        <Image
            source={require('../assets/images/veggies.png')}
            style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 16 }}
        />
      </View>
    </View>
  );
}

const promoStyles = StyleSheet.create({
  card: {
    backgroundColor: C.paleLightGreen,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 23,
    gap: 20,
  },
  textSection: {
    flex: 1,
    gap: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.primaryDark,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Be Vietnam Pro' : 'BeVietnamPro-Bold',
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#005C15',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Be Vietnam Pro' : 'BeVietnamPro-Bold',
  },
  imageWrapper: {
    width: 84,
    height: 84,
    transform: [{ rotate: '3deg' }],
  },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function AddressScreen() {
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={22} color="#17181B" onPress={() => router.back()} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Địa chỉ</Text>
          <View style={styles.headerRight} />
        </View>

        {/* ── Scrollable content ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Search input */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchIconWrap}>
              <Feather name="search" size={18} color={C.textLight} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm địa chỉ mới..."
              placeholderTextColor={C.textLight}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
          </View>

          {/* Map preview */}
          <MapPreview />

          {/* Use current location button */}
          <TouchableOpacity style={styles.locationBtn} activeOpacity={0.85}>
            <Feather name="crosshair" size={22} color={C.primaryDarker} />
            <Text style={styles.locationBtnText}>Sử dụng vị trí hiện tại</Text>
          </TouchableOpacity>

          {/* Saved addresses section */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Địa chỉ đã lưu</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2 Địa chỉ</Text>
            </View>
          </View>

          <View style={styles.cardsGap}>
            <AddressItem
              icon="home"
              title="Nhà riêng"
              address="Cổng sau ktx khu B - ĐHQG TPHCM"
              isDefault
            />
            <AddressItem
              icon="school"
              title="Trường học"
              address="Trường đại học Bách Khoa - ĐHQG TPHCM"
            />
            <AddNewAddressButton />
          </View>

          {/* Promotional card */}
          <PromoCard />

          {/* Bottom padding */}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── Confirm button (fixed above nav) ── */}
        <View style={styles.confirmWrapper}>
          <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.9}>
            <Text style={styles.confirmBtnText}>Xác nhận địa chỉ</Text>
            <Feather name="check-circle" size={20} color={C.white} />
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bgMain,
  },
  container: {
    flex: 1,
    backgroundColor: C.bgMain,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#17181B',
    fontFamily: 'Montserrat-ExtraBold',
  },
  headerRight: {
    width: 34,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 16,
  },

  // Search input
  searchWrapper: {
    backgroundColor: C.white,
    borderRadius: 48,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#223131',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
  searchIconWrap: {
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: C.textDark,
    paddingRight: 24,
    paddingVertical: 18,
    fontFamily: 'BeVietnamPro-Regular',
  },

  // Use current location button
  locationBtn: {
    backgroundColor: C.white,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
    shadowColor: '#223131',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  locationBtnText: {
    fontSize: 14,
    color: C.primaryDarker,
    fontFamily: 'BeVietnamPro-SemiBold',
  },

  // Section heading
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    color: C.textDark,
    letterSpacing: -0.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  badge: {
    backgroundColor: C.lightGreen,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    color: C.primaryDark,
    lineHeight: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },

  cardsGap: {
    gap: 16,
  },

  // Confirm button
  confirmWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
  },
  confirmBtn: {
    backgroundColor: C.primaryDeep,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    shadowColor: C.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 16,
    color: C.white,
    fontFamily: 'BeVietnamPro-Bold',
  },
});
