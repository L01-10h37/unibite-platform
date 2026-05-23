import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { AlignLeft, Camera, Check, ImagePlus, MapPin, Store } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  createSellerShop,
  parseSellerTokens,
  uploadSellerShopAvatar,
  type SellerShop,
} from "@/services/seller-shop";

const COLORS = {
  blue: "#9DBCF0",
  blueLight: "#F1F6FF",
  text: "#424242",
  muted: "#8D8D8D",
  line: "#A7C3F2",
  danger: "#EF4444",
};

const noFontScale = {
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
} as const;

export default function SellerCreateShopScreen() {
  const [step, setStep] = useState<"info" | "avatar">("info");
  const [createdShop, setCreatedShop] = useState<SellerShop | null>(null);
  const [avatarAsset, setAvatarAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [about, setAbout] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    form?: string;
  }>({});

  const getTokensOrRedirect = async () => {
    const tokens = parseSellerTokens(await SecureStore.getItemAsync("sellerTokens"));

    if (!tokens) {
      router.replace("/seller/signin" as any);
      return null;
    }

    return tokens;
  };

  const handleCreateShop = async () => {
    const trimmedName = name.trim();
    const newErrors: { name?: string; form?: string } = {};

    if (!trimmedName) {
      newErrors.name = "Tên shop là bắt buộc";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Tên shop phải có ít nhất 2 ký tự";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const tokens = await getTokensOrRedirect();

      if (!tokens) {
        return;
      }

      const shop = await createSellerShop(tokens.accessToken, {
        name: trimmedName,
        address: address.trim(),
        about: about.trim(),
      });

      setCreatedShop(shop);
      setStep("avatar");
      setErrors({});
    } catch (error) {
      console.error("Error creating seller shop:", error);
      setErrors({
        form: "Tạo shop thất bại. Vui lòng kiểm tra thông tin và thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrors({ form: "Vui lòng cấp quyền truy cập ảnh để chọn avatar." });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (!result.canceled) {
      setAvatarAsset(result.assets[0]);
      setErrors({});
    }
  };

  const goToWelcome = (shopName: string) => {
    router.replace({
      pathname: "/seller/welcome",
      params: { shopName },
    } as any);
  };

  const handleFinishAvatar = async () => {
    if (!createdShop) {
      router.replace("/seller/create-shop" as any);
      return;
    }

    try {
      setIsSubmitting(true);
      const tokens = await getTokensOrRedirect();

      if (!tokens) {
        return;
      }

      if (avatarAsset) {
        await uploadSellerShopAvatar(tokens.accessToken, createdShop.id, {
          uri: avatarAsset.uri,
          fileName: avatarAsset.fileName,
          mimeType: avatarAsset.mimeType,
        });
      }

      goToWelcome(createdShop.name);
    } catch (error) {
      console.error("Error uploading shop avatar:", error);
      setErrors({
        form: "Cập nhật avatar thất bại. Vui lòng thử lại hoặc bỏ qua bước này.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === "info" ? (
          <>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Store color="#FFFFFF" size={32} strokeWidth={2.2} />
              </View>
              <Text {...noFontScale} style={styles.title}>
                Tạo shop
              </Text>
              <Text {...noFontScale} style={styles.subtitle}>
                Hoàn tất thông tin cửa hàng để bắt đầu bán hàng trên Unibite.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text {...noFontScale} style={styles.label}>
                  Tên shop
                </Text>
                <View style={styles.inputRow}>
                  <Store color="#616161" size={17} strokeWidth={1.8} />
                  <View style={styles.divider} />
                  <TextInput
                    {...noFontScale}
                    autoCapitalize="words"
                    onChangeText={setName}
                    placeholder="Nhập tên shop"
                    placeholderTextColor="#9E9E9E"
                    style={styles.input}
                    value={name}
                  />
                </View>
                <View
                  style={[
                    styles.inputUnderline,
                    errors.name && styles.inputUnderlineError,
                  ]}
                />
                {errors.name && (
                  <Text {...noFontScale} style={styles.errorText}>
                    {errors.name}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <Text {...noFontScale} style={styles.label}>
                  Địa chỉ
                </Text>
                <View style={styles.inputRow}>
                  <MapPin color="#616161" size={17} strokeWidth={1.8} />
                  <View style={styles.divider} />
                  <TextInput
                    {...noFontScale}
                    onChangeText={setAddress}
                    placeholder="Nhập địa chỉ shop"
                    placeholderTextColor="#9E9E9E"
                    style={styles.input}
                    value={address}
                  />
                </View>
                <View style={styles.inputUnderline} />
              </View>

              <View style={styles.field}>
                <Text {...noFontScale} style={styles.label}>
                  Mô tả
                </Text>
                <View style={styles.textAreaWrapper}>
                  <AlignLeft color="#616161" size={17} strokeWidth={1.8} />
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

              {errors.form && (
                <Text {...noFontScale} style={styles.formError}>
                  {errors.form}
                </Text>
              )}

              <TouchableOpacity
                activeOpacity={0.86}
                disabled={isSubmitting}
                onPress={handleCreateShop}
                style={[
                  styles.submitButton,
                  isSubmitting && styles.buttonDisabled,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text {...noFontScale} style={styles.submitText}>
                    Tiếp tục
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.avatarStep}>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Camera color="#FFFFFF" size={32} strokeWidth={2.2} />
              </View>
              <Text {...noFontScale} style={styles.title}>
                Chọn avatar
              </Text>
              <Text {...noFontScale} style={styles.subtitle}>
                Avatar giúp khách nhận diện shop {createdShop?.name || "của bạn"} nhanh hơn.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePickAvatar}
              style={styles.avatarPicker}
            >
              {avatarAsset ? (
                <Image source={{ uri: avatarAsset.uri }} style={styles.avatarPreview} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <ImagePlus color={COLORS.blue} size={44} strokeWidth={1.8} />
                  <Text {...noFontScale} style={styles.avatarPlaceholderText}>
                    Chọn ảnh từ thư viện
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {avatarAsset && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePickAvatar}
                style={styles.secondaryButton}
              >
                <Text {...noFontScale} style={styles.secondaryText}>
                  Chọn ảnh khác
                </Text>
              </TouchableOpacity>
            )}

            {errors.form && (
              <Text {...noFontScale} style={styles.formError}>
                {errors.form}
              </Text>
            )}

            <TouchableOpacity
              activeOpacity={0.86}
              disabled={isSubmitting}
              onPress={handleFinishAvatar}
              style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Check color="#FFFFFF" size={20} strokeWidth={2.2} />
                  <Text {...noFontScale} style={styles.submitText}>
                    Hoàn tất
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isSubmitting}
              onPress={() => createdShop && goToWelcome(createdShop.name)}
              style={styles.skipButton}
            >
              <Text {...noFontScale} style={styles.skipText}>
                Bỏ qua bước này
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 36,
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: COLORS.blue,
    borderRadius: 24,
    height: 64,
    justifyContent: "center",
    marginBottom: 20,
    width: 64,
  },
  title: {
    color: COLORS.text,
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 30,
    lineHeight: 38,
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
    fontSize: 19,
    lineHeight: 25,
  },
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 24,
  },
  divider: {
    backgroundColor: "#616161",
    height: 10,
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
  inputUnderlineError: {
    backgroundColor: COLORS.danger,
  },
  textAreaWrapper: {
    alignItems: "flex-start",
    backgroundColor: COLORS.blueLight,
    borderColor: "#D8E6FF",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 116,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    fontFamily: "Montserrat-Regular",
    fontSize: 12,
  },
  formError: {
    color: COLORS.danger,
    fontFamily: "Montserrat-Medium",
    fontSize: 13,
    lineHeight: 19,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: COLORS.blue,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 50,
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.68,
  },
  submitText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 18,
    lineHeight: 24,
  },
  avatarStep: {
    flex: 1,
  },
  avatarPicker: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: COLORS.blueLight,
    borderColor: "#D8E6FF",
    borderRadius: 92,
    borderWidth: 2,
    height: 184,
    justifyContent: "center",
    marginBottom: 22,
    overflow: "hidden",
    width: 184,
  },
  avatarPreview: {
    height: "100%",
    width: "100%",
  },
  avatarPlaceholder: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
  },
  avatarPlaceholderText: {
    color: COLORS.blue,
    fontFamily: "Montserrat-SemiBold",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  secondaryButton: {
    alignItems: "center",
    marginBottom: 24,
  },
  secondaryText: {
    color: COLORS.blue,
    fontFamily: "Montserrat-SemiBold",
    fontSize: 14,
    lineHeight: 20,
  },
  skipButton: {
    alignItems: "center",
    marginTop: 18,
  },
  skipText: {
    color: COLORS.muted,
    fontFamily: "Montserrat-SemiBold",
    fontSize: 14,
    lineHeight: 20,
  },
});
