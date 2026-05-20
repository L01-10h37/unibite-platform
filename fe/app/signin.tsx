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

import { Eye, EyeOff, KeyRound, User } from "lucide-react-native";

import imgLogo from "../assets/images/logo.png";

export default function SignInScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const { width } = Dimensions.get("window"); // Dùng để vẽ background

  const validateUsername = (username: string) => {
    return username.length >= 6 && username.length <= 20;
  };

  const handleSubmit = async () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!username) {
      newErrors.username = "Tên tài khoản là bắt buộc";
    } else if (!validateUsername(username)) {
      newErrors.username = "Tên tài khoản phải có từ 6 đến 20 ký tự";
    }

    if (!password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const apiBase =
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";
        console.log("Attempting login to", apiBase + "/api/auth/login");

        const res = await fetch(`${apiBase}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `Login failed: ${res.status} ${res.statusText} ${text}`,
          );
        }

        const data = await res.json();

        // Backend wraps payload in { success, message, data }
        const payload = data?.data || data;

        if (!payload?.accessToken || !payload?.refreshToken) {
          console.error("Unexpected login response payload", payload);
          throw new Error("Missing tokens in response");
        }

        const tokens = JSON.stringify({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        });

        await SecureStore.setItemAsync("tokens", tokens);

        router.push("/");
      } catch (error) {
        console.error("Error during sign in:", error);
        setErrors({ username: "Đăng nhập thất bại. Vui lòng thử lại." });
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Phần Wavy Header với màu xanh chủ đạo */}
        <View style={styles.header}>
          <Svg
            height="100%"
            width="100%"
            viewBox={`0 0 ${width} 300`}
            preserveAspectRatio="none"
            style={styles.svg}
          >
            <Defs>
              {/* ĐỊNH NGHĨA KHUÔN CẮT (CLIPPATH) */}
              {/* Dùng lại mã Path tạo hình dạng sóng */}
              <ClipPath id="wavyShape">
                <Path
                  d={`M0,0 L${width},0 L${width},220 C${width * 0.7},320 ${width * 0.3},150 0,250 Z`}
                />
              </ClipPath>
            </Defs>

            {/* VẼ LỚP NỀN MÀU XANH TRƯỚC */}
            <Path
              fill="#459e66" // Màu xanh chủ đạo
              d={`M0,0 L${width},0 L${width},220 C${width * 0.7},320 ${width * 0.3},150 0,250 Z`}
            />

            {/* CHÈN ẢNH HOẠ TIẾT VÀO VÀ ÁP DỤNG KHUÔN CẮT */}
            <ImageSVG
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice" // Đảm bảo ảnh phủ kín không bị méo
              opacity="0.2" // Điều chỉnh độ mờ của ảnh để không làm mất đi màu xanh chủ đạo
              href={require("../assets/images/sign-in-bg.png")}
              clipPath="url(#wavyShape)" // GỌI KHUÔN CẮT ĐÃ ĐỊNH NGHĨA Ở TRÊN
            />
          </Svg>

          {/* Placeholder for Unibite Logo */}
          <View style={styles.logoContainer}>
            <Image source={imgLogo} style={styles.logo} resizeMode="contain" />
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.formContainer}>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Đăng nhập</Text>
              <View style={styles.titleUnderline} />
            </View>

            {/* Username Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.labelLarge}>Tên tài khoản</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputRow}>
                  <User style={styles.icon} size={16} />
                  <View style={styles.divider} />
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Nhập tên tài khoản"
                    placeholderTextColor="#616161"
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

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputRow}>
                  <KeyRound style={styles.iconGray} size={16} />
                  <View style={styles.dividerGray} />
                  <TextInput
                    style={styles.inputGray}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor="#BDBDBD"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Eye style={styles.iconGray} size={20} />
                    ) : (
                      <EyeOff style={styles.iconGray} size={20} />
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

            {/* Remember Password & Forgot Password */}
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
                <Text style={styles.checkboxLabel}>Ghi nhớ mật khẩu</Text>
              </TouchableOpacity>
              <Link href="/forgot-password" style={styles.forgotPassword}>
                Quên mật khẩu?
              </Link>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Đăng nhập</Text>
            </TouchableOpacity>

            {/* Switch to Sign Up */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>Chưa có tài khoản? </Text>
              <Link href="/signup" style={styles.switchLink}>
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
  svg: {
    backgroundColor: "transparent",
  },
  header: {
    height: 280,
    overflow: "hidden",
    position: "relative",
  },
  backgroundContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
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
    paddingTop: 32,
    paddingBottom: 24,
  },
  formContainer: {
    maxWidth: 448,
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
    backgroundColor: "#459B5E",
    borderRadius: 100,
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
  icon: {
    fontSize: 16,
    color: "#616161",
  },
  iconGray: {
    fontSize: 16,
    color: "#BDBDBD",
  },
  divider: {
    width: 1,
    height: 8,
    backgroundColor: "#616161",
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
  inputGray: {
    flex: 1,
    fontFamily: "Montserrat-Regular",
    fontSize: 14,
    color: "#BDBDBD",
    padding: 0,
  },
  inputUnderline: {
    height: 1.5,
    backgroundColor: "#459B5E",
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
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: "#459B5E",
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
    borderRadius: 2, // Độ bo góc của khối đặc bên trong
    backgroundColor: "#459B5E",
  },
  checkboxLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    color: "#424242",
  },
  forgotPassword: {
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    color: "#459B5E",
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#459B5E",
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
    color: "#F8F8FF",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  switchText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: "#9E9E9E",
  },
  switchLink: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 14,
    color: "#459B5E",
  },
});
