import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { AlignLeft, Check, Clock3, MapPin, Store } from "lucide-react-native";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getMySellerShop,
  parseSellerTokens,
  updateSellerShop,
  type SellerShop,
} from "@/services/seller-shop";

const COLORS = {
  blue: "#2478FF",
  blueLight: "#F1F6FF",
  bg: "#EAF9F8",
  text: "#223131",
  muted: "#7A878F",
  line: "#D8E6FF",
  danger: "#EF4444",
};

const noFontScale = {
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
} as const;

export default function SellerEditShopScreen() {
  const [shop, setShop] = useState<SellerShop | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [about, setAbout] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
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

        setShop(currentShop);
        setName(currentShop.name || "");
        setAddress(currentShop.address || "");
        setOpeningHours(currentShop.openingHours || "");
        setAbout(currentShop.about || "");
      } catch (loadError) {
        console.error("Failed to load shop for edit:", loadError);
        setError("Không tải được thông tin gian hàng.");
      } finally {
        setIsLoading(false);
      }
    };

    loadShop();
  }, []);

  const handleSave = async () => {
    if (!shop) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Tên shop là bắt buộc.");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Tên shop phải có ít nhất 2 ký tự.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const tokens = parseSellerTokens(
        await SecureStore.getItemAsync("sellerTokens"),
      );

      if (!tokens) {
        router.replace("/seller/signin" as any);
        return;
      }

      await updateSellerShop(tokens.accessToken, shop.id, {
        name: trimmedName,
        address: address.trim(),
        openingHours: openingHours.trim(),
        about: about.trim(),
      });

      router.replace("/seller/profile" as any);
    } catch (saveError) {
      console.error("Failed to update shop:", saveError);
      setError("Cập nhật gian hàng thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.blue} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text {...noFontScale} style={styles.title}>
            Chỉnh sửa gian hàng
          </Text>
          <Text {...noFontScale} style={styles.subtitle}>
            Cập nhật thông tin shop, địa chỉ và giờ mở cửa cho khách hàng.
          </Text>
        </View>

        <View style={styles.form}>
          <FormField
            icon={<Store color="#616161" size={18} />}
            label="Tên shop"
            onChangeText={setName}
            placeholder="Nhập tên shop"
            value={name}
          />

          <FormField
            icon={<MapPin color="#616161" size={18} />}
            label="Địa chỉ cửa hàng"
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ cửa hàng"
            value={address}
          />

          <FormField
            icon={<Clock3 color="#616161" size={18} />}
            label="Giờ mở cửa"
            onChangeText={setOpeningHours}
            placeholder="Ví dụ: 6:00 am - 01:20 pm"
            value={openingHours}
          />

          <View style={styles.field}>
            <Text {...noFontScale} style={styles.label}>
              Mô tả
            </Text>
            <View style={styles.textAreaWrapper}>
              <AlignLeft color="#616161" size={18} />
              <TextInput
                {...noFontScale}
                multiline
                onChangeText={setAbout}
                placeholder="Giới thiệu ngắn về shop"
                placeholderTextColor="#9E9E9E"
                style={styles.textArea}
                textAlignVertical="top"
                value={about}
              />
            </View>
          </View>

          {error ? (
            <Text {...noFontScale} style={styles.errorText}>
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.86}
            disabled={isSaving}
            onPress={handleSave}
            style={[styles.submitButton, isSaving && styles.buttonDisabled]}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Check color="#FFFFFF" size={20} />
                <Text {...noFontScale} style={styles.submitText}>
                  Lưu thay đổi
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.78}
            disabled={isSaving}
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <Text {...noFontScale} style={styles.cancelText}>
              Hủy
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormField({
  icon,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  icon: ReactNode;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text {...noFontScale} style={styles.label}>
        {label}
      </Text>
      <View style={styles.inputRow}>
        {icon}
        <View style={styles.divider} />
        <TextInput
          {...noFontScale}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9E9E9E"
          style={styles.input}
          value={value}
        />
      </View>
      <View style={styles.inputUnderline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 34,
  },
  title: {
    color: COLORS.text,
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 28,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.muted,
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    lineHeight: 22,
  },
  form: {
    gap: 22,
  },
  field: {
    gap: 10,
  },
  label: {
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
    fontSize: 18,
    lineHeight: 24,
  },
  inputRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  divider: {
    backgroundColor: "#D5DCE5",
    height: 18,
    width: 1,
  },
  input: {
    color: "#616161",
    flex: 1,
    fontFamily: "Montserrat-Regular",
    fontSize: 14,
    padding: 0,
  },
  inputUnderline: {
    backgroundColor: COLORS.line,
    borderRadius: 100,
    height: 1.5,
  },
  textAreaWrapper: {
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    minHeight: 116,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  textArea: {
    color: "#616161",
    flex: 1,
    fontFamily: "Montserrat-Regular",
    fontSize: 14,
    minHeight: 90,
    padding: 0,
  },
  errorText: {
    color: COLORS.danger,
    fontFamily: "Montserrat-Medium",
    fontSize: 13,
    lineHeight: 19,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.68,
  },
  submitText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 17,
    lineHeight: 24,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 4,
  },
  cancelText: {
    color: COLORS.muted,
    fontFamily: "Montserrat-SemiBold",
    fontSize: 14,
  },
});
