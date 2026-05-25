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
  StatusBar,
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

// BẢNG MÀU ĐỒNG BỘ 100% VỚI CHECKOUT VÀ HỆ THỐNG
const C = {
  bgMain: "#C5E0CD",           // Nền xám nhạt tinh tế của hệ thống
  white: "#FFFFFF",
  primaryDeep: "#295D38",      // Màu xanh lá chủ đạo (Thương hiệu)
  paleLightGreen: "#F4F8F5",   // Màu nền khi voucher được chọn / Voucher ưu đãi
  textDark: "#223131",         // Màu chữ chính gần đen
  textMid: "#4E5F5E",          // Màu chữ phụ 1
  textLight: "#6E767D",        // Màu chữ phụ 2 (Xám)
  accentRed: "#B02500",
  accentRedBg: "rgba(176, 37, 0, 0.06)",
  borderLight: "#EFEFEF",      // Đường viền mảnh chuẩn của Checkout
  radioBorder: "#CCD2D1",
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
  const iconName = voucher.type === "FREE_SHIPPING" ? "truck" : "tag";

  return (
    <View style={[voucherCardStyles.card, selected && voucherCardStyles.cardSelected, expired && voucherCardStyles.cardExpired, !expired && voucherCardStyles.cardActive]}>
      {/* Cột trái chứa Icon */}
      <View style={[voucherCardStyles.leftSection, selected && voucherCardStyles.leftSectionSelected]}>
        <View style={[voucherCardStyles.iconBg, expired && voucherCardStyles.iconBgExpired]}>
          <Feather 
            name={iconName as "tag" | "truck"} 
            size={18} 
            color={expired ? C.textLight : C.primaryDeep} 
          />
        </View>
        <Text style={[voucherCardStyles.typeLabel, expired && { color: C.textLight }]}>
          {voucher.type === "FREE_SHIPPING" ? "SHIP" : "MÃ GIẢM"}
        </Text>
      </View>

      {/* Cột phải chứa nội dung */}
      <View style={voucherCardStyles.contentSection}>
        <View style={voucherCardStyles.titleRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={voucherCardStyles.title} numberOfLines={1}>
              {getVoucherTitle(voucher)}
            </Text>
            <Text style={voucherCardStyles.codeText}>{voucher.code}</Text>
          </View>

          {/* Trạng thái nút bấm lựa chọn theo thiết kế hình tròn Radio mượt mà giống Checkout */}
          {!expired ? (
            <TouchableOpacity
              onPress={() => onPress(voucher)}
              activeOpacity={0.7}
              style={voucherCardStyles.radioWrapper}
            >
              <Text style={[voucherCardStyles.selectBtnText, selected && voucherCardStyles.selectBtnTextSelected]}>
                {selected ? "Đã chọn" : "Chọn"}
              </Text>
              <View style={[voucherCardStyles.radioCircle, selected && voucherCardStyles.radioCircleSelected]} />
            </TouchableOpacity>
          ) : (
            <View style={[voucherCardStyles.statusPill,
                voucher.status === "USED" && voucherCardStyles.statusUsed,
                voucher.status === "EXPIRED" && voucherCardStyles.statusExpired,
                voucher.status === "RESERVED" && voucherCardStyles.statusReserved,
            ]}>
              <Text style={voucherCardStyles.statusPillText}>{getStatusLabel(voucher.status)}</Text>
            </View>
          )}
        </View>

        <Text style={voucherCardStyles.subtitle} numberOfLines={2}>
          {getVoucherSubtitle(voucher)}
        </Text>

        {/* Thời gian hết hạn */}
        {voucher.status === "ACTIVE" && !isExpired(voucher) ? (
          <View style={isExpiringSoon(voucher) ? voucherCardStyles.expiryWarning : voucherCardStyles.expiryNormal}>
            <Feather
              name={isExpiringSoon(voucher) ? "clock" : "calendar"}
              size={12}
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
            <Feather name="slash" size={12} color={C.textLight} />
            <Text style={voucherCardStyles.expiryNormalText}>
              {voucher.status === "USED"
                ? `Đã dùng ngày ${voucher.usedAt ? formatDate(voucher.usedAt) : formatDate(voucher.expiresAt)}`
                : voucher.status === "RESERVED"
                  ? "Đang chờ thanh toán..."
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
    borderRadius: 16, // Đồng bộ bo góc mượt của Checkout
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  statusUsed: {
    backgroundColor: "rgba(176,37,0,0.08)",
  },
  statusExpired: {
    backgroundColor: "#ECECEC",
  },
  statusReserved: {
    backgroundColor: "rgba(181,136,0,0.10)",
  },
  cardSelected: {
    borderColor: C.primaryDeep,
  },
  cardExpired: {
    opacity: 0.68,
    backgroundColor: "#F6F7F7",
    borderColor: "#E4E7E7",
  },
  cardActive: {
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  leftSection: {
    width: 84,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAF9",
    borderRightWidth: 1,
    borderRightColor: C.borderLight,
    borderStyle: "dashed",
  },
  leftSectionSelected: {
    backgroundColor: C.paleLightGreen,
    borderRightColor: C.primaryDeep,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  iconBgExpired: {
    backgroundColor: "#F0F3F1",
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: C.primaryDeep,
    letterSpacing: 0.5,
  },
  contentSection: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: C.textDark,
  },
  codeText: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: "500",
  },
  radioWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectBtnText: {
    fontSize: 12,
    color: C.textLight,
    fontWeight: "500",
  },
  selectBtnTextSelected: {
    color: C.primaryDeep,
    fontWeight: "600",
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.radioBorder,
    backgroundColor: C.white,
  },
  radioCircleSelected: {
    borderColor: C.primaryDeep,
    borderWidth: 5,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F0F3F1",
  },
  statusPillText: {
    fontSize: 11,
    color: C.textLight,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    color: C.textMid,
    lineHeight: 18,
  },
  expiryWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.accentRedBg,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  expiryWarningText: {
    fontSize: 11,
    color: C.accentRed,
    fontWeight: "600",
  },
  expiryNormal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  expiryNormalText: {
    fontSize: 11,
    color: C.textLight,
  },
});

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {typeof count === "number" ? (
        <Text style={styles.sectionCount}>({count})</Text>
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
        if (!mounted) return;
        setVouchers(voucherList);
        setSelectedCode(storedSelectedCode?.toUpperCase() || null);
      } catch (error) {
        if (!mounted) return;
        setMessage(error instanceof Error ? error.message : "Không thể tải voucher");
        setMessageTone("error");
      } finally {
        if (mounted) setLoading(false);
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
      setMessage(`Áp dụng mã ${voucher.code} thành công.`);
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
      setMessage(`Áp dụng mã ${voucher.code} thành công.`);
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
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        
        {/* HEADER CHUẨN SÁNG NHẸ CỦA TRANG CHECKOUT */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
            <Feather name="chevron-left" size={24} color="#223131" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn Voucher</Text>
          <View style={styles.headerRight} />
        </View>

        {/* THANH Ô NHẬP MÃ VOUCHER */}
        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <Feather name="tag" size={18} color={C.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Nhập mã giảm giá..."
              placeholderTextColor="#A0A5A8"
              value={voucherCode}
              onChangeText={setVoucherCode}
              returnKeyType="done"
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.applyBtn} activeOpacity={0.8} onPress={handleApplyCode} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color={C.white} /> : <Text style={styles.applyBtnText}>Áp dụng</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* BANNER THÔNG TIN VÀ CHIP VOUCHER ĐANG CHỌN */}
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Feather name="info" size={16} color={C.primaryDeep} />
              <Text style={styles.infoTitle}>Điều khoản áp dụng</Text>
            </View>
            <Text style={styles.infoText}>{infoBannerText}</Text>
            
            {selectedVoucher ? (
              <View style={styles.selectedChip}>
                <Feather name="check-circle" size={14} color={C.primaryDeep} />
                <Text style={styles.selectedChipText}>Đang chọn: {selectedVoucher.code}</Text>
                <TouchableOpacity onPress={handleClearSelection} activeOpacity={0.7}>
                  <Text style={styles.clearSelectionText}>Bỏ chọn</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Hộp thoại thông báo kết quả */}
          {message ? (
            <View style={[
              styles.messageBox, 
              messageTone === "success" && styles.messageSuccess, 
              messageTone === "error" && styles.messageError
            ]}>
              <Text style={[
                styles.messageText, 
                messageTone === "success" && styles.messageTextSuccess, 
                messageTone === "error" && styles.messageTextError
              ]}>
                {message}
              </Text>
            </View>
          ) : null}

          {/* DANH SÁCH VOUCHER CÒN HẠN */}
          <SectionHeader title="Voucher hiện có" count={activeVouchers.length} />

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={C.primaryDeep} />
              <Text style={styles.loadingText}>Đang tìm kiếm voucher...</Text>
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
              <Feather name="tag" size={20} color={C.textLight} />
              <Text style={styles.emptyStateText}>Không tìm thấy voucher khả dụng.</Text>
            </View>
          )}

          {/* DANH SÁCH VOUCHER HẾT HẠN / ĐÃ DÙNG */}
          <View style={styles.expiredSection}>
            <View style={styles.expiredHeader}>
              <SectionHeader title="Hết hiệu lực" count={inactiveVouchers.length} />
            </View>
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
                <Feather name="shield" size={20} color={C.textLight} />
                <Text style={styles.emptyStateText}>Chưa có lịch sử voucher hết hạn.</Text>
              </View>
            )}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.white,
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
    paddingVertical: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  expiredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    opacity: 0.75,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F3F1",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.textDark,
  },
  headerRight: {
    width: 40,
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: C.textDark,
    paddingVertical: 12,
  },
  applyBtn: {
    backgroundColor: C.primaryDeep,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  applyBtnText: {
    color: C.white,
    fontSize: 13,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  infoCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textDark,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    color: C.textLight,
  },
  selectedChip: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.paleLightGreen,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(41, 93, 56, 0.15)",
  },
  selectedChipText: {
    flex: 1,
    fontSize: 13,
    color: C.primaryDeep,
    fontWeight: "600",
    marginLeft: 6,
  },
  clearSelectionText: {
    fontSize: 13,
    color: C.accentRed,
    fontWeight: "600",
  },
  messageBox: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: "#F4F8F5",
  },
  messageSuccess: {
    backgroundColor: "#F4F8F5",
    borderWidth: 1,
    borderColor: "rgba(41, 93, 56, 0.15)",
  },
  messageError: {
    backgroundColor: C.accentRedBg,
    borderWidth: 1,
    borderColor: "rgba(176, 37, 0, 0.15)",
  },
  messageText: {
    fontSize: 13,
    color: C.primaryDeep,
    fontWeight: "500",
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
    marginBottom: 12,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.textDark,
  },
  sectionCount: {
    fontSize: 15,
    fontWeight: "600",
    color: C.textLight,
  },
  cardsGap: {
    gap: 12,
  },
  expiredSection: {
    marginTop: 24,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: C.textLight,
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderLight,
    borderStyle: "dashed",
    backgroundColor: C.white,
    paddingVertical: 24,
    alignItems: "center",
    gap: 6,
  },
  emptyStateText: {
    fontSize: 13,
    color: C.textLight,
  },
});