import { Link, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
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

const COLORS = {
  blue: "#9DBCF0",
  blueStrong: "#9DBCF0",
  text: "#424242",
  muted: "#9E9E9E",
  line: "#A7C3F2",
  grayLine: "#C9C9C9",
  placeholder: "#BDBDBD",
};

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
    const decoded = decodeBase64(padded);

    return JSON.parse(decoded);
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
        bounces={false}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Svg
            height="100%"
            preserveAspectRatio="none"
            style={styles.svg}
            viewBox={`0 0 ${width} 300`}
            width="100%"
          >
            <Defs>
              <ClipPath id="sellerSignInWave">
                <Path
                  d={`M0,0 L${width},0 L${width},220 C${width * 0.7},320 ${width * 0.3},150 0,250 Z`}
                />
              </ClipPath>
            </Defs>
            <Path
              d={`M0,0 L${width},0 L${width},220 C${width * 0.7},320 ${width * 0.3},150 0,250 Z`}
              fill={COLORS.blue}
            />
            <ImageSVG
              clipPath="url(#sellerSignInWave)"
              height="100%"
              href={require("../../assets/images/sign-in-bg.png")}
              opacity="0.36"
              preserveAspectRatio="xMidYMid slice"
              width="100%"
              x="0"
              y="0"
            />
          </Svg>

          <View style={styles.logoContainer}>
            <Image source={imgLogo} style={styles.logo} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.titleContainer}>
            <Text {...noFontScale} style={styles.title}>
              Đăng nhập
            </Text>
            <View style={styles.titleUnderline} />
          </View>

          <View style={styles.roleSwitchContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/signin")}
              style={styles.roleSwitchButton}
            >
              <User color={COLORS.blueStrong} size={16} />
              <Text {...noFontScale} style={styles.roleSwitchText}>
                Người mua
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.roleSwitchButton, styles.roleSwitchButtonActive]}
            >
              <Store color="#FFFFFF" size={16} />
              <Text {...noFontScale} style={styles.roleSwitchTextActive}>
                Người bán
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldContainer}>
            <Text {...noFontScale} style={styles.label}>
              Tên tài khoản
            </Text>
            <View style={styles.inputRow}>
              <User color="#616161" size={15} strokeWidth={1.7} />
              <View style={styles.dividerGray} />
              <TextInput
                autoCapitalize="none"
                keyboardType="default"
                onChangeText={setUsername}
                placeholder="Nhập tên tài khoản"
                placeholderTextColor={COLORS.placeholder}
                {...noFontScale}
                style={styles.input}
                value={username}
              />
            </View>
            <View
              style={[
                styles.inputUnderline,
                errors.username && styles.inputUnderlineError,
              ]}
            />
            {errors.username && (
              <Text {...noFontScale} style={styles.errorText}>
                {errors.username}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text {...noFontScale} style={styles.label}>
              Mật khẩu
            </Text>
            <View style={styles.inputRow}>
              <KeyRound color="#616161" size={15} strokeWidth={1.6} />
              <View style={styles.dividerGray} />
              <TextInput
                autoCapitalize="none"
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={COLORS.placeholder}
                secureTextEntry={!showPassword}
                {...noFontScale}
                style={styles.inputMuted}
                value={password}
              />
              <TouchableOpacity
                hitSlop={10}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <Eye color={COLORS.placeholder} size={18} strokeWidth={1.7} />
                ) : (
                  <EyeOff
                    color={COLORS.placeholder}
                    size={18}
                    strokeWidth={1.7}
                  />
                )}
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.inputUnderlineGray,
                errors.password && styles.inputUnderlineError,
              ]}
            />
            {errors.password && (
              <Text {...noFontScale} style={styles.errorText}>
                {errors.password}
              </Text>
            )}
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
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
              <Text {...noFontScale} style={styles.checkboxLabel}>
                Ghi nhớ mật khẩu
              </Text>
            </TouchableOpacity>
            <Link
              {...noFontScale}
              href={"/forgot-password" as any}
              style={styles.forgotPassword}
            >
              Quên mật khẩu?
            </Link>
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text {...noFontScale} style={styles.submitButtonText}>
              Đăng nhập
            </Text>
          </TouchableOpacity>

          <View style={styles.switchContainer}>
            <Text {...noFontScale} style={styles.switchText}>
              Chưa có tài khoản?{" "}
            </Text>
            <Link
              {...noFontScale}
              href={"/seller/signup" as any}
              style={styles.switchLink}
            >
              Đăng ký
            </Link>
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
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 28,
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
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: -50,
    paddingTop: 16,
    zIndex: 10,
  },
  logo: {
    height: 180,
    width: 180,
  },
  formSection: {
    marginTop: -50,
    paddingHorizontal: 24,
  },
  titleContainer: {
    marginBottom: 30,
  },
  title: {
    color: COLORS.text,
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 26,
    lineHeight: 34,
    marginBottom: 10,
  },
  titleUnderline: {
    backgroundColor: COLORS.line,
    borderRadius: 100,
    height: 3,
    width: 76,
  },
  roleSwitchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F6FF",
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
    backgroundColor: COLORS.blueStrong,
  },
  roleSwitchText: {
    color: COLORS.blueStrong,
    fontFamily: "Montserrat-SemiBold",
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 0,
    textAlign: "center",
  },
  roleSwitchTextActive: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-SemiBold",
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 0,
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: 27,
  },
  label: {
    color: COLORS.text,
    fontFamily: "Montserrat-Bold",
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 12,
  },
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minHeight: 21,
  },
  divider: {
    backgroundColor: "#616161",
    height: 10,
    width: 1,
  },
  dividerGray: {
    backgroundColor: COLORS.placeholder,
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
  inputMuted: {
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
    marginTop: 9,
  },
  inputUnderlineGray: {
    backgroundColor: COLORS.grayLine,
    borderRadius: 100,
    height: 1.5,
    marginTop: 9,
  },
  inputUnderlineError: {
    backgroundColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontFamily: "Montserrat-Regular",
    fontSize: 12,
    marginTop: 5,
  },
  optionsRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 21,
    marginTop: -8,
    gap: 8,
  },
  checkboxContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    flex: 1,
  },
  checkbox: {
    alignItems: "center",
    borderColor: COLORS.line,
    borderRadius: 3,
    borderWidth: 1.5,
    height: 14,
    justifyContent: "center",
    width: 14,
  },
  checkboxChecked: {
    backgroundColor: "#FFFFFF",
  },
  innerSquare: {
    backgroundColor: COLORS.line,
    borderRadius: 2,
    height: 8,
    width: 8,
  },
  checkboxLabel: {
    color: COLORS.text,
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    lineHeight: 18,
    flexShrink: 1,
  },
  forgotPassword: {
    color: COLORS.blueStrong,
    fontFamily: "Montserrat-SemiBold",
    fontSize: 12,
    lineHeight: 18,
    flexShrink: 0,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: COLORS.blueStrong,
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 48,
    width: "100%",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 18,
    lineHeight: 24,
  },
  switchContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 2,
  },
  switchText: {
    color: COLORS.muted,
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 0,
  },
  switchLink: {
    color: COLORS.blueStrong,
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 14,
    lineHeight: 20,
  },
});
