import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  clearSelectedVoucherCode,
  getSelectedVoucherCode,
  getVouchers,
  lookupVoucherByCode,
  saveSelectedVoucherCode,
  type VoucherDto,
  type VoucherStatus,
} from "@/services/voucher-service";

const C = {
  bgMain: "#C5E0CD",
  white: "#FFFFFF",
  offWhite: "#FEFFFE",
  primaryDark: "#176A21",
  primaryDarker: "#006A38",
  primaryMid: "#3E8C55",
  primaryDeep: "#295D38",
  lightGreen: "#9DF197",
  paleLightGreen: "rgba(157, 241, 151, 0.3)",
  paleDeliveryGreen: "rgba(134, 250, 172, 0.3)",
  textDark: "#223131",
  textMid: "#4E5F5E",
  textLight: "#697A79",
  accentRed: "#B02500",
  accentRedBg: "rgba(249, 86, 48, 0.1)",
  borderLight: "#C8E2E1",
};

const infoBannerText =
  "Mỗi đơn chỉ dùng 1 voucher. Voucher sẽ hết hiệu lực khi được áp dụng thành công hoặc khi quá hạn.";

function formatMoney(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getVoucherTitle(voucher: VoucherDto) {
  if (voucher.type === "FREE_SHIPPING") {
    return "Miễn phí vận chuyển";
  }

  if (voucher.type === "PERCENT") {
    return `Giảm ${voucher.value}%`;
  }

  return `Giảm ${formatMoney(voucher.value)}`;
}

function getVoucherSubtitle(voucher: VoucherDto) {
  const parts = [voucher.description?.trim() || "Voucher từ ứng dụng"];

  if (voucher.minOrderValue > 0) {
    parts.push(`Đơn tối thiểu ${formatMoney(voucher.minOrderValue)}`);
  } else {
    parts.push("Áp dụng cho mọi đơn hợp lệ");
  }

  return parts.join(" • ");
}

function getStatusLabel(status: VoucherStatus) {
  const labels: Record<VoucherStatus, string> = {
    ACTIVE: "Còn hiệu lực",
    RESERVED: "Đang giữ chỗ",
    USED: "Đã dùng",
    EXPIRED: "Hết hạn",
    DISABLED: "Đã tắt",
  };

  return labels[status] ?? status;
}

function isExpired(voucher: VoucherDto) {
  return new Date(voucher.expiresAt).getTime() < Date.now();
}

function isExpiringSoon(voucher: VoucherDto) {
  const remainingMs = new Date(voucher.expiresAt).getTime() - Date.now();
  return remainingMs > 0 && remainingMs <= 3 * 24 * 60 * 60 * 1000;
}

function getPalette(voucher: VoucherDto) {
  const isOffer = voucher.type === "PERCENT" || voucher.type === "FIXED";

  return {
    leftBg: isOffer ? C.paleLightGreen : C.paleDeliveryGreen,
    iconBg: isOffer ? C.primaryDark : C.primaryDarker,
    iconColor: isOffer ? "#D1FFC8" : "#CCFFD6",
    labelColor: isOffer ? C.primaryDark : C.primaryDarker,
  };
}

function VoucherCard({
  voucher,
  selected,
  onPress,
}: {
  voucher: VoucherDto;
  selected: boolean;
  onPress: (voucher: VoucherDto) => void;
}) {
  const expired = isExpired(voucher) || voucher.status !== "ACTIVE";
  const palette = getPalette(voucher);
  const iconName = voucher.type === "FREE_SHIPPING" ? "truck" : "percent";

  return (
    <View style={[voucherCardStyles.card, selected && voucherCardStyles.cardSelected]}>
      <View style={[voucherCardStyles.leftSection, { backgroundColor: palette.leftBg }]}>
        <View style={[voucherCardStyles.iconBg, { backgroundColor: palette.iconBg }]}>
          {voucher.type === "FREE_SHIPPING" ? (
            <Feather name={iconName as "truck"} size={18} color={palette.iconColor} />
          ) : (
            <MaterialCommunityIcons name={iconName as "percent"} size={20} color={palette.iconColor} />
          )}
        </View>
        <Text style={[voucherCardStyles.typeLabel, { color: palette.labelColor }]}> 
          {voucher.type === "FREE_SHIPPING" ? "DELIVERY" : voucher.type}
        </Text>
      </View>

      <View style={voucherCardStyles.contentSection}>
        <View style={voucherCardStyles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={voucherCardStyles.title} numberOfLines={2}>
              {getVoucherTitle(voucher)}
            </Text>
            <Text style={voucherCardStyles.codeText}>{voucher.code}</Text>
          </View>

          {!expired ? (
            <TouchableOpacity
              onPress={() => onPress(voucher)}
              activeOpacity={0.8}
              style={[voucherCardStyles.selectButton, selected && voucherCardStyles.selectButtonSelected]}
            >
              <Text style={[voucherCardStyles.selectBtn, selected && voucherCardStyles.selectBtnSelected]}>
                {selected ? "Đã chọn" : "Chọn"}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={voucherCardStyles.statusPill}>
              <Text style={voucherCardStyles.statusPillText}>{getStatusLabel(voucher.status)}</Text>
            </View>
          )}
        </View>

        <Text style={voucherCardStyles.subtitle}>{getVoucherSubtitle(voucher)}</Text>

        {voucher.status === "ACTIVE" && !isExpired(voucher) ? (
          <View style={isExpiringSoon(voucher) ? voucherCardStyles.expiryWarning : voucherCardStyles.expiryNormal}>
            <Feather
              name={isExpiringSoon(voucher) ? "clock" : "calendar"}
              size={11}
              color={isExpiringSoon(voucher) ? C.accentRed : C.textLight}
            />
            <Text style={isExpiringSoon(voucher) ? voucherCardStyles.expiryWarningText : voucherCardStyles.expiryNormalText}>
              {isExpiringSoon(voucher)
                ? `Hết hạn trong ${Math.max(
                    1,
                    Math.ceil((new Date(voucher.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
                  )} ngày`
                : `Hết hạn: ${formatDate(voucher.expiresAt)}`}
            </Text>
          </View>
        ) : (
          <View style={voucherCardStyles.expiryNormal}>
            <Feather name="slash" size={11} color={C.textLight} />
            <Text style={voucherCardStyles.expiryNormalText}>
              {voucher.status === "USED"
                ? `Đã dùng ngày ${voucher.usedAt ? formatDate(voucher.usedAt) : formatDate(voucher.expiresAt)}`
                : voucher.status === "RESERVED"
                  ? "Đang chờ thanh toán hoàn tất"
                  : `Đã hết hạn ngày ${formatDate(voucher.expiresAt)}`}
            </Text>
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
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#223131",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardSelected: {
    borderColor: C.primaryMid,
  },
  leftSection: {
    width: 96,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingRight: 2,
    borderRightWidth: 2,
    borderRightColor: C.borderLight,
    borderStyle: "dashed",
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "BeVietnamPro-Bold",
  },
  contentSection: {
    flex: 1,
    padding: 24,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    fontSize: 20,
    color: C.textDark,
    lineHeight: 28,
    fontFamily: "PlusJakartaSans-Bold",
  },
  codeText: {
    marginTop: 4,
    fontSize: 12,
    color: C.primaryDeep,
    letterSpacing: 1,
    fontFamily: "Montserrat-Bold",
  },
  selectButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9999,
    backgroundColor: "rgba(41, 93, 56, 0.10)",
  },
  selectButtonSelected: {
    backgroundColor: C.primaryDark,
  },
  selectBtn: {
    fontSize: 14,
    color: C.primaryDark,
    fontFamily: "BeVietnamPro-Bold",
  },
  selectBtnSelected: {
    color: C.white,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: C.accentRedBg,
  },
  statusPillText: {
    fontSize: 12,
    color: C.accentRed,
    fontFamily: "BeVietnamPro-Bold",
  },
  subtitle: {
    fontSize: 14,
    color: C.textMid,
    lineHeight: 20,
    fontFamily: "BeVietnamPro-Regular",
    paddingBottom: 4,
  },
  expiryWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.accentRedBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  expiryWarningText: {
    fontSize: 12,
    color: C.accentRed,
    fontFamily: "BeVietnamPro-Medium",
  },
  expiryNormal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
  },
  expiryNormalText: {
    fontSize: 12,
    color: C.textMid,
    fontFamily: "BeVietnamPro-Medium",
  },
});

function SectionHeader({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {typeof count === "number" ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count} voucher</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function VoucherScreen() {
  const [voucherCode, setVoucherCode] = useState("");
  const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      try {
        const [voucherList, storedSelectedCode] = await Promise.all([
          getVouchers(),
          getSelectedVoucherCode(),
        ]);

        if (!mounted) {
          return;
        }

        setVouchers(voucherList);
        setSelectedCode(storedSelectedCode?.toUpperCase() || null);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setMessage(error instanceof Error ? error.message : "Không thể tải voucher");
        setMessageTone("error");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const activeVouchers = useMemo(
    () => vouchers.filter((voucher) => voucher.status === "ACTIVE" && !isExpired(voucher)),
    [vouchers],
  );

  const inactiveVouchers = useMemo(
    () => vouchers.filter((voucher) => voucher.status !== "ACTIVE" || isExpired(voucher)),
    [vouchers],
  );

  const selectedVoucher = useMemo(
    () => vouchers.find((voucher) => voucher.code === selectedCode) || null,
    [selectedCode, vouchers],
  );

  const applySelectedVoucher = async (voucher: VoucherDto) => {
    if (voucher.status !== "ACTIVE" || isExpired(voucher)) {
      setMessage("Voucher này không còn hiệu lực.");
      setMessageTone("error");
      return;
    }

    setSubmitting(true);
    try {
      await saveSelectedVoucherCode(voucher.code);
      setSelectedCode(voucher.code);
      setVoucherCode(voucher.code);
      setMessage(`Đã áp dụng ${voucher.code} cho lần thanh toán tới.`);
      setMessageTone("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể áp dụng voucher");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyCode = async () => {
    const code = voucherCode.trim();

    if (!code) {
      setMessage("Vui lòng nhập mã voucher.");
      setMessageTone("error");
      return;
    }

    setSubmitting(true);
    try {
      const voucher = await lookupVoucherByCode(code);
      await saveSelectedVoucherCode(voucher.code);
      setSelectedCode(voucher.code);
      setVoucherCode(voucher.code);
      setMessage(`Đã áp dụng ${voucher.code} cho lần thanh toán tới.`);
      setMessageTone("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mã voucher không hợp lệ");
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearSelection = async () => {
    await clearSelectedVoucherCode();
    setSelectedCode(null);
    setMessage("Đã bỏ chọn voucher.");
    setMessageTone("info");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
            <Feather name="chevron-left" size={22} color="#17181B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voucher</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <View style={styles.inputIconWrap}>
              <MaterialCommunityIcons name="ticket-percent-outline" size={20} color="#697A79" />
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập code"
              placeholderTextColor="#9FB1B0"
              value={voucherCode}
              onChangeText={setVoucherCode}
              returnKeyType="done"
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.applyBtn} activeOpacity={0.85} onPress={handleApplyCode} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color={C.white} /> : <Text style={styles.applyBtnText}>Áp dụng</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <View style={styles.infoIcon}>
                <Feather name="info" size={16} color={C.primaryDark} />
              </View>
              <Text style={styles.infoTitle}>Cách dùng voucher</Text>
            </View>
            <Text style={styles.infoText}>{infoBannerText}</Text>
            {selectedVoucher ? (
              <View style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>Đang chọn: {selectedVoucher.code}</Text>
                <TouchableOpacity onPress={handleClearSelection} activeOpacity={0.8}>
                  <Text style={styles.clearSelectionText}>Bỏ chọn</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {message ? (
            <View style={[styles.messageBox, messageTone === "success" && styles.messageSuccess, messageTone === "error" && styles.messageError]}>
              <Text style={[styles.messageText, messageTone === "success" && styles.messageTextSuccess, messageTone === "error" && styles.messageTextError]}>
                {message}
              </Text>
            </View>
          ) : null}

          <SectionHeader title="Voucher hiện có" count={activeVouchers.length} />

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={C.primaryDark} />
              <Text style={styles.loadingText}>Đang tải voucher...</Text>
            </View>
          ) : activeVouchers.length > 0 ? (
            <View style={styles.cardsGap}>
              {activeVouchers.map((voucher) => (
                <VoucherCard
                  key={voucher.id}
                  voucher={voucher}
                  selected={selectedCode === voucher.code}
                  onPress={applySelectedVoucher}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="tag" size={22} color={C.textLight} />
              <Text style={styles.emptyStateText}>Chưa có voucher đang hoạt động</Text>
            </View>
          )}

          <View style={styles.expiredSection}>
            <SectionHeader title="Voucher hết hiệu lực" count={inactiveVouchers.length} />
            {inactiveVouchers.length > 0 ? (
              <View style={styles.cardsGap}>
                {inactiveVouchers.map((voucher) => (
                  <VoucherCard
                    key={voucher.id}
                    voucher={voucher}
                    selected={selectedCode === voucher.code}
                    onPress={applySelectedVoucher}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="shield" size={22} color={C.textLight} />
                <Text style={styles.emptyStateText}>Chưa có voucher đã dùng hoặc hết hạn</Text>
              </View>
            )}
          </View>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    color: "#17181B",
    fontFamily: "Montserrat-ExtraBold",
  },
  headerRight: {
    width: 34,
  },
  inputSection: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 9999,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 6,
    shadowColor: "#223131",
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
    fontFamily: "Montserrat-Medium",
  },
  applyBtn: {
    minWidth: 96,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primaryDark,
    borderRadius: 9999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  applyBtnText: {
    color: C.white,
    fontSize: 14,
    letterSpacing: 0.35,
    fontFamily: "Montserrat-Bold",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  infoCard: {
    backgroundColor: C.offWhite,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: C.borderLight,
    marginBottom: 16,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.paleLightGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    fontSize: 16,
    color: C.textDark,
    fontFamily: "PlusJakartaSans-Bold",
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: C.textMid,
    fontFamily: "BeVietnamPro-Regular",
  },
  selectedChip: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: C.paleDeliveryGreen,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedChipText: {
    flex: 1,
    fontSize: 13,
    color: C.primaryDeep,
    fontFamily: "BeVietnamPro-Bold",
  },
  clearSelectionText: {
    fontSize: 13,
    color: C.accentRed,
    fontFamily: "BeVietnamPro-Bold",
  },
  messageBox: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "rgba(41, 93, 56, 0.10)",
  },
  messageSuccess: {
    backgroundColor: "rgba(157, 241, 151, 0.25)",
  },
  messageError: {
    backgroundColor: C.accentRedBg,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    color: C.primaryDeep,
    fontFamily: "BeVietnamPro-Medium",
  },
  messageTextSuccess: {
    color: C.primaryDeep,
  },
  messageTextError: {
    color: C.accentRed,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    color: C.textDark,
    letterSpacing: -0.5,
    fontFamily: "PlusJakartaSans-Bold",
  },
  badge: {
    backgroundColor: C.lightGreen,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    color: "#005C15",
    lineHeight: 16,
    fontFamily: "BeVietnamPro-Bold",
  },
  cardsGap: {
    gap: 16,
  },
  expiredSection: {
    marginTop: 20,
    gap: 8,
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: C.textMid,
    fontFamily: "BeVietnamPro-Medium",
  },
  emptyState: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.borderLight,
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.65)",
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: C.textMid,
    textAlign: "center",
    fontFamily: "BeVietnamPro-Medium",
  },
});
