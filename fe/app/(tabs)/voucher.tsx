/**
 * VoucherScreen - Screen 7
 * Màn hình quản lý Voucher cho food mobile app
 *
 * Dependencies cần cài:
 *   expo install react-native-safe-area-context @expo/vector-icons react-native-svg
 *
 * Fonts cần load (expo-font):
 *   - Be Vietnam Pro (Regular, Medium, Bold)
 *   - Plus Jakarta Sans (Bold)
 *   - Montserrat (ExtraBold)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  bgMain: '#C5E0CD',
  white: '#FFFFFF',
  offWhite: '#FEFFFE',
  primaryDark: '#176A21',
  primaryDarker: '#006A38',
  primaryMid: '#3E8C55',
  primaryDeep: '#295D38',
  lightGreen: '#9DF197',
  paleLightGreen: 'rgba(157, 241, 151, 0.3)',
  paleDeliveryGreen: 'rgba(134, 250, 172, 0.3)',
  textDark: '#223131',
  textMid: '#4E5F5E',
  textLight: '#697A79',
  textGrey: '#484C52',
  textIconGrey: '#8E98A8',
  accentRed: '#B02500',
  accentRedBg: 'rgba(249, 86, 48, 0.1)',
  borderLight: '#C8E2E1',
};

// ─── Voucher Card (active) ─────────────────────────────────────────────────────
interface VoucherCardProps {
  type: 'offer' | 'delivery';
  title: string;
  subtitle: string;
  expiry: string;
  isExpiringSoon?: boolean;
}

function VoucherCard({ type, title, subtitle, expiry, isExpiringSoon }: VoucherCardProps) {
  const isOffer = type === 'offer';
  const leftBg = isOffer ? C.paleLightGreen : C.paleDeliveryGreen;
  const iconBg = isOffer ? C.primaryDark : C.primaryDarker;
  const iconColor = isOffer ? '#D1FFC8' : '#CCFFD6';
  const labelColor = isOffer ? C.primaryDark : C.primaryDarker;
  const label = isOffer ? 'OFFER' : 'DELIVERY';

  return (
    <View style={voucherCardStyles.card}>
      {/* Left icon section */}
      <View style={[voucherCardStyles.leftSection, { backgroundColor: leftBg }]}>
        <View style={[voucherCardStyles.iconBg, { backgroundColor: iconBg }]}>
          {isOffer ? (
            <MaterialCommunityIcons name="percent" size={20} color={iconColor} />
          ) : (
            <Feather name="truck" size={18} color={iconColor} />
          )}
        </View>
        <Text style={[voucherCardStyles.typeLabel, { color: labelColor }]}>{label}</Text>
      </View>

      {/* Content section */}
      <View style={voucherCardStyles.contentSection}>
        {/* Title row */}
        <View style={voucherCardStyles.titleRow}>
          <Text style={voucherCardStyles.title} numberOfLines={2}>
            {title}
          </Text>
          <TouchableOpacity>
            <Text style={voucherCardStyles.selectBtn}>Chọn</Text>
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <Text style={voucherCardStyles.subtitle}>{subtitle}</Text>

        {/* Expiry */}
        {isExpiringSoon ? (
          <View style={voucherCardStyles.expiryWarning}>
            <Feather name="clock" size={11} color={C.accentRed} />
            <Text style={voucherCardStyles.expiryWarningText}>{expiry}</Text>
          </View>
        ) : (
          <View style={voucherCardStyles.expiryNormal}>
            <Feather name="calendar" size={11} color={C.textLight} />
            <Text style={voucherCardStyles.expiryNormalText}>{expiry}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const voucherCardStyles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 32,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#223131',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  leftSection: {
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingRight: 2,
    borderRightWidth: 2,
    borderRightColor: C.borderLight,
    borderStyle: 'dashed',
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: 'BeVietnamPro-Bold',
  },
  contentSection: {
    flex: 1,
    padding: 24,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    color: C.textDark,
    lineHeight: 28,
    flex: 1,
    marginRight: 8,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  selectBtn: {
    fontSize: 14,
    color: C.primaryDark,
    fontFamily: 'BeVietnamPro-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: C.textMid,
    lineHeight: 20,
    fontFamily: 'BeVietnamPro-Regular',
    paddingBottom: 8,
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accentRedBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  expiryWarningText: {
    fontSize: 12,
    color: C.accentRed,
    fontFamily: 'BeVietnamPro-Medium',
  },
  expiryNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  expiryNormalText: {
    fontSize: 12,
    color: C.textMid,
    fontFamily: 'BeVietnamPro-Medium',
  },
});

// ─── Expired Voucher Card ──────────────────────────────────────────────────────
interface ExpiredCardProps {
  title: string;
  date: string;
  status: 'used' | 'expired';
}

function ExpiredVoucherCard({ title, date, status }: ExpiredCardProps) {
  return (
    <View style={expiredStyles.card}>
      {/* Icon */}
      <View style={expiredStyles.iconWrapper}>
        <View style={expiredStyles.iconCircle}>
          <Feather name="slash" size={16} color={C.textLight} />
        </View>
      </View>

      {/* Content */}
      <View style={expiredStyles.content}>
        <Text style={expiredStyles.title}>{title}</Text>
        <Text style={expiredStyles.date}>{date}</Text>
      </View>

      {/* Status badge */}
      <Text style={expiredStyles.statusText}>
        {status === 'used' ? 'ĐÃ DÙNG' : 'HẾT HẠN'}
      </Text>
    </View>
  );
}

const expiredStyles = StyleSheet.create({
  card: {
    backgroundColor: '#E1F5F4',
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: C.borderLight,
    borderStyle: 'dashed',
  },
  iconWrapper: {
    marginRight: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: C.textMid,
    lineHeight: 24,
    fontFamily: 'BeVietnamPro-Bold',
  },
  date: {
    fontSize: 12,
    color: C.textLight,
    lineHeight: 16,
    fontFamily: 'BeVietnamPro-Regular',
  },
  statusText: {
    fontSize: 12,
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'BeVietnamPro-Bold',
  },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function VoucherScreen() {
  const [voucherCode, setVoucherCode] = useState('');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Page background */}
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
            <Feather name="chevron-left" size={22} color="#17181B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voucher</Text>
          <View style={styles.headerRight} />
        </View>

        {/* ── Voucher Code Input ── */}
        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <View style={styles.inputIconWrap}>
              <MaterialCommunityIcons
                name="ticket-percent-outline"
                size={20}
                color="#697A79"
              />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập code"
              placeholderTextColor="#9FB1B0"
              value={voucherCode}
              onChangeText={setVoucherCode}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.applyBtn} activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Scrollable content ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Active vouchers heading */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Voucher hiện có</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2 voucher mới</Text>
            </View>
          </View>

          {/* Active voucher cards */}
          <View style={styles.cardsGap}>
            <VoucherCard
              type="offer"
              title="Giảm 5.000đ"
              subtitle="Đơn tối thiểu 50.000đ"
              expiry="Hết hạn trong 2 ngày"
              isExpiringSoon
            />
            <VoucherCard
              type="delivery"
              title="Miễn phí vận chuyển"
              subtitle="Đơn tối thiểu 0đ"
              expiry="Hết hạn: 31/3/2026"
            />
          </View>

          {/* Expired vouchers section (60% opacity) */}
          <View style={styles.expiredSection}>
            <Text style={styles.expiredSectionTitle}>Voucher hết hiệu lực</Text>
            <View style={styles.cardsGap}>
              <ExpiredVoucherCard
                title="Giảm 50.000đ"
                date="Đã sử dụng ngày 28/3/2026"
                status="used"
              />
              <ExpiredVoucherCard
                title="Miễn phí vận chuyển"
                date="Đã hết hạn ngày 30/3/2026"
                status="expired"
              />
            </View>
          </View>

          {/* Bottom padding for nav */}
          <View style={{ height: 16 }} />
        </ScrollView>
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

  // Voucher input
  inputSection: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 9999,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 6,
    shadowColor: '#223131',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  inputIconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: C.textDark,
    paddingVertical: 10,
    fontFamily: 'Montserrat-Medium',
  },
  applyBtn: {
    backgroundColor: C.primaryDark,
    borderRadius: 9999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  applyBtnText: {
    color: '#D1FFC8',
    fontSize: 14,
    letterSpacing: 0.35,
    fontFamily: 'Montserrat-Bold',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },

  // Section heading
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    color: '#005C15',
    lineHeight: 16,
    fontFamily: 'BeVietnamPro-Bold',
  },

  cardsGap: {
    gap: 16,
  },

  // Expired section
  expiredSection: {
    marginTop: 20,
    opacity: 0.6,
    gap: 8,
  },
  expiredSectionTitle: {
    fontSize: 18,
    color: C.textMid,
    letterSpacing: -0.45,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 4,
  },
});
