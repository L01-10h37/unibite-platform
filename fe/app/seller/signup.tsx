import { Link, router } from "expo-router";
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

import {
  Eye,
  EyeOff,
  KeyRound,
  Smartphone,
  Store,
  User,
} from "lucide-react-native";

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

export default function SellerSignUpScreen() {
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { width } = Dimensions.get("window");

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async () => {
    const newErrors: {
      username?: string;
      phoneNumber?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!username.trim()) {
      newErrors.username = "Tên tài khoản là bắt buộc";
    }

    if (!phoneNumber) {
      newErrors.phoneNumber = "Số điện thoại là bắt buộc";
    } else if (!validatePhone(phoneNumber)) {
      newErrors.phoneNumber = "Số điện thoại không hợp lệ";
    }

    if (!password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          phone: phoneNumber,
          password,
          role: "seller",
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Seller registration failed: ${res.status} ${text}`);
      }

      router.replace("/seller/signin" as any);
    } catch (error) {
      console.error("Error during seller sign up:", error);
      setErrors({
        username: "Có lỗi xảy ra khi đăng ký người bán. Vui lòng thử lại.",
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
              <ClipPath id="sellerSignUpWave">
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
              clipPath="url(#sellerSignUpWave)"
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
              Đăng kí
            </Text>
            <View style={styles.titleUnderline} />
          </View>

          <View style={styles.roleSwitchContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/signup")}
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
              <View style={styles.divider} />
              <TextInput
                autoCapitalize="none"
                keyboardType="default"
                onChangeText={setUsername}
                placeholder="Nhập tên tài khoản"
                placeholderTextColor="#7A7A7A"
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
              Số điện thoại
            </Text>
            <View style={styles.inputRow}>
              <Smartphone color="#616161" size={15} strokeWidth={1.7} />
              <View style={styles.divider} />
              <TextInput
                keyboardType="phone-pad"
                onChangeText={setPhoneNumber}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#7A7A7A"
                {...noFontScale}
                style={styles.input}
                value={phoneNumber}
              />
            </View>
            <View
              style={[
                styles.inputUnderline,
                errors.phoneNumber && styles.inputUnderlineError,
              ]}
            />
            {errors.phoneNumber && (
              <Text {...noFontScale} style={styles.errorText}>
                {errors.phoneNumber}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text {...noFontScale} style={styles.label}>
              Mật khẩu
            </Text>
            <View style={styles.inputRow}>
              <KeyRound color={COLORS.placeholder} size={15} strokeWidth={1.6} />
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

          <View style={styles.fieldContainer}>
            <Text {...noFontScale} style={styles.label}>
              Xác nhận mật khẩu
            </Text>
            <View style={styles.inputRow}>
              <KeyRound color={COLORS.placeholder} size={15} strokeWidth={1.6} />
              <View style={styles.dividerGray} />
              <TextInput
                autoCapitalize="none"
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor={COLORS.placeholder}
                secureTextEntry={!showConfirmPassword}
                {...noFontScale}
                style={styles.inputMuted}
                value={confirmPassword}
              />
              <TouchableOpacity
                hitSlop={10}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
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
                errors.confirmPassword && styles.inputUnderlineError,
              ]}
            />
            {errors.confirmPassword && (
              <Text {...noFontScale} style={styles.errorText}>
                {errors.confirmPassword}
              </Text>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text {...noFontScale} style={styles.submitButtonText}>
              Đăng ký
            </Text>
          </TouchableOpacity>

          <View style={styles.switchContainer}>
            <Text {...noFontScale} style={styles.switchText}>
              Đã có tài khoản?{" "}
            </Text>
            <Link
              {...noFontScale}
              href={"/seller/signin" as any}
              style={styles.switchLink}
            >
              Đăng nhập
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
    marginBottom: 25,
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
  submitButton: {
    alignItems: "center",
    backgroundColor: COLORS.blueStrong,
    borderRadius: 10,
    justifyContent: "center",
    marginTop: 5,
    minHeight: 49,
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
