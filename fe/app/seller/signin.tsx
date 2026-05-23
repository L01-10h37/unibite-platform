import { Link, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { ClipPath, Defs, Image as ImageSVG, Path } from "react-native-svg";
import { Eye, EyeOff, KeyRound, Store, User } from "lucide-react-native";

import { getMySellerShop } from "@/services/seller-shop";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";
const imgLogo = require("../../assets/images/logo.png");

const SELLER_COLOR = "#9DBCF0";
const SELLER_BG = "#F1F6FF";

const noFontScale = {
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
} as const;

function decodeBase64(value: string) {
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(value);
  }

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  let buffer = 0;
  let bits = 0;

  for (const char of value.replace(/=+$/, "")) {
    const index = chars.indexOf(char);

    if (index < 0) {
      continue;
    }

    buffer = (buffer << 6) | index;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
}

function decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(decodeBase64(padded));
  } catch {
    return null;
  }
}

export default function SellerSignInScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const { width } = Dimensions.get("window");

  const handleSubmit = async () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      newErrors.username = "Tên tài khoản là bắt buộc";
    }

    if (!password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Seller login failed: ${res.status} ${text}`);
      }

      const data = await res.json();
      const payload = data?.data || data;

      if (!payload?.accessToken || !payload?.refreshToken) {
        throw new Error("Missing tokens in response");
      }

      const jwtPayload = decodeJwtPayload(payload.accessToken);

      if (jwtPayload?.role !== "seller") {
        setErrors({
          username: "Tài khoản này không phải tài khoản người bán.",
        });
        return;
      }

      await SecureStore.setItemAsync(
        "sellerTokens",
        JSON.stringify({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        }),
      );

      const shop = await getMySellerShop(payload.accessToken);
      router.replace((shop ? "/seller" : "/seller/create-shop") as any);
    } catch (error) {
      console.error("Error during seller sign in:", error);
      setErrors({
        username: "Đăng nhập người bán thất bại. Vui lòng thử lại.",
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Svg
            height="100%"
            width="100%"
            viewBox={`0 0 ${width} 300`}
            preserveAspectRatio="none"
            style={styles.svg}
          >
            <Defs>
              <ClipPath id="sellerSignInWave">
                <Path
                  d={`M0,0 L${width},0 L${width},220 C${width * 0.7},320 ${width * 0.3},150 0,250 Z`}
                />
              </ClipPath>
            </Defs>
            <Path
              fill={SELLER_COLOR}
              d={`M0,0 L${width},0 L${width},220 C${width * 0.7},320 ${width * 0.3},150 0,250 Z`}
            />
            <ImageSVG
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
              opacity="0.25"
              href={require("../../assets/images/sign-in-bg.png")}
              clipPath="url(#sellerSignInWave)"
            />
          </Svg>

          <View style={styles.logoContainer}>
            <Image source={imgLogo} style={styles.logo} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.formContainer}>
            <View style={styles.titleContainer}>
              <Text {...noFontScale} style={styles.title}>
                Đăng nhập
              </Text>
              <View style={styles.titleUnderline} />
            </View>

            <View style={styles.roleSwitchContainer}>
              <TouchableOpacity
                style={styles.roleSwitchButton}
                activeOpacity={0.85}
                onPress={() => router.replace("/signin")}
              >
                <User color={SELLER_COLOR} size={16} />
                <Text
                  {...noFontScale}
                  numberOfLines={1}
                  style={styles.roleSwitchText}
                >
                  Người mua
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleSwitchButton, styles.roleSwitchButtonActive]}
                activeOpacity={0.85}
              >
                <Store color="#FFFFFF" size={16} />
                <Text
                  {...noFontScale}
                  numberOfLines={1}
                  style={styles.roleSwitchTextActive}
                >
                  Người bán
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.labelLarge}>Tên tài khoản</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputRow}>
                  <User size={16} color="#616161" />
                  <View style={styles.dividerGray} />
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Nhập tên tài khoản"
                    placeholderTextColor="#BDBDBD"
                    keyboardType="default"
                    autoCapitalize="none"
                  />
                </View>
                <View
                  style={[
                    styles.inputUnderline,
                    errors.username && styles.inputUnderlineError,
                  ]}
                />
              </View>
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputRow}>
                  <KeyRound size={16} color="#616161" />
                  <View style={styles.dividerGray} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor="#BDBDBD"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <Eye size={20} color="#BDBDBD" />
                    ) : (
                      <EyeOff size={20} color="#BDBDBD" />
                    )}
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.inputUnderlineGray,
                    errors.password && styles.inputUnderlineError,
                  ]}
                />
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberPassword(!rememberPassword)}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberPassword && styles.checkboxChecked,
                  ]}
                >
                  {rememberPassword && <View style={styles.innerSquare} />}
                </View>
                <Text
                  {...noFontScale}
                  numberOfLines={1}
                  style={styles.checkboxLabel}
                >
                  Ghi nhớ mật khẩu
                </Text>
              </TouchableOpacity>
              <Link
                {...noFontScale}
                href={"/forgot-password" as any}
                numberOfLines={1}
                style={styles.forgotPassword}
              >
                Quên mật khẩu?
              </Link>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text
                {...noFontScale}
                numberOfLines={1}
                style={styles.submitButtonText}
              >
                Đăng nhập
              </Text>
            </TouchableOpacity>

            <View style={styles.switchContainer}>
              <Text {...noFontScale} numberOfLines={1} style={styles.switchText}>
                Chưa có tài khoản?{" "}
              </Text>
              <Link
                {...noFontScale}
                href={"/seller/signup" as any}
                numberOfLines={1}
                style={styles.switchLink}
              >
                Đăng ký
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  svg: {
    backgroundColor: "transparent",
  },
  header: {
    height: 280,
    overflow: "hidden",
    position: "relative",
  },
  logoContainer: {
    position: "absolute",
    top: -50,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 16,
    zIndex: 10,
  },
  logo: {
    width: 180,
    height: 180,
  },
  formSection: {
    backgroundColor: "transparent",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -50,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  formContainer: {
    width: "100%",
    maxWidth: 448,
    alignSelf: "center",
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 26,
    color: "#424242",
    marginBottom: 8,
  },
  titleUnderline: {
    width: 74,
    height: 3,
    backgroundColor: SELLER_COLOR,
    borderRadius: 100,
  },
  roleSwitchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SELLER_BG,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  roleSwitchButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  roleSwitchButtonActive: {
    backgroundColor: SELLER_COLOR,
  },
  roleSwitchText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 0,
    minWidth: 74,
    textAlign: "center",
    color: SELLER_COLOR,
  },
  roleSwitchTextActive: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 0,
    minWidth: 74,
    textAlign: "center",
    color: "#FFFFFF",
  },
  fieldContainer: {
    marginBottom: 24,
  },
  labelLarge: {
    fontFamily: "Montserrat-Bold",
    fontSize: 20,
    color: "#424242",
    marginBottom: 12,
  },
  label: {
    fontFamily: "Montserrat-Bold",
    fontSize: 18,
    color: "#424242",
    marginBottom: 12,
  },
  inputWrapper: {
    position: "relative",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
    gap: 8,
  },
  dividerGray: {
    width: 1,
    height: 8,
    backgroundColor: "#BDBDBD",
  },
  input: {
    flex: 1,
    fontFamily: "Montserrat-Regular",
    fontSize: 14,
    color: "#616161",
    padding: 0,
  },
  inputUnderline: {
    height: 1.5,
    backgroundColor: SELLER_COLOR,
    borderRadius: 100,
  },
  inputUnderlineGray: {
    height: 1.5,
    backgroundColor: "#BDBDBD",
    borderRadius: 100,
  },
  inputUnderlineError: {
    backgroundColor: "#EF4444",
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#EF4444",
    fontFamily: "Montserrat-Regular",
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: SELLER_COLOR,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#FFFFFF",
  },
  innerSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: SELLER_COLOR,
  },
  checkboxLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    lineHeight: 18,
    color: "#424242",
    minWidth: 112,
  },
  forgotPassword: {
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    lineHeight: 18,
    color: SELLER_COLOR,
    flexShrink: 0,
    minWidth: 106,
    textAlign: "right",
  },
  submitButton: {
    width: "100%",
    backgroundColor: SELLER_COLOR,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    fontFamily: "Montserrat-Bold",
    fontSize: 18,
    lineHeight: 24,
    color: "#F8F8FF",
    minWidth: 128,
    textAlign: "center",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 2,
  },
  switchText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    lineHeight: 20,
    color: "#9E9E9E",
    flexShrink: 0,
    minWidth: 142,
    textAlign: "right",
  },
  switchLink: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: SELLER_COLOR,
    flexShrink: 0,
    minWidth: 62,
  },
});
