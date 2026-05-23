import { router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, Trash2 } from "lucide-react-native";

import {
  deleteSellerFood,
  parseSellerTokens,
  updateSellerFood,
  type SellerFood,
} from "@/services/seller-shop";

const FOOD_IMAGE_FALLBACK = require("@/assets/images/seller/milk-tea.png");

const BLUE = "#6298E8";
const DANGER = "#E24255";
const BG = "#EAF9F8";
const LINE = "#E6ECF2";

export default function SellerEditFoodScreen() {
  const params = useLocalSearchParams<{ food?: string; focus?: string }>();
  const initialFood = useMemo(() => parseFoodParam(params.food), [params.food]);

  const [name, setName] = useState(initialFood?.name || "");
  const [description, setDescription] = useState(initialFood?.description || "");
  const [price, setPrice] = useState(formatInputPrice(initialFood?.price));
  const [specialPrice, setSpecialPrice] = useState(
    initialFood?.specialPrice ? formatInputPrice(initialFood.specialPrice) : "",
  );
  const [startTime, setStartTime] = useState(initialFood?.startTime || "");
  const [endTime, setEndTime] = useState(initialFood?.endTime || "");
  const [isAvailable, setIsAvailable] = useState(Boolean(initialFood?.isAvailble));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const imageSource: ImageSourcePropType = initialFood?.listUrlImg?.[0]
    ? { uri: initialFood.listUrlImg[0] }
    : FOOD_IMAGE_FALLBACK;

  const handleSave = async () => {
    if (!initialFood) {
      router.back();
      return;
    }

    const parsedPrice = parseMoney(price);
    const parsedSpecialPrice = specialPrice.trim() ? parseMoney(specialPrice) : null;

    if (!name.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên món ăn.");
      return;
    }

    if (!parsedPrice || parsedPrice <= 0) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập giá món ăn hợp lệ.");
      return;
    }

    try {
      setIsSaving(true);
      const tokens = parseSellerTokens(await SecureStore.getItemAsync("sellerTokens"));

      if (!tokens) {
        router.replace("/seller/signin" as any);
        return;
      }

      await updateSellerFood(tokens.accessToken, initialFood.id, {
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        specialPrice: parsedSpecialPrice,
        isAvailble: isAvailable,
        startTime: startTime.trim() || null,
        endTime: endTime.trim() || null,
      });

      router.replace("/seller" as any);
    } catch (error) {
      console.error("Failed to update food:", error);
      Alert.alert("Lỗi", "Cập nhật món ăn thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!initialFood) {
      return;
    }

    Alert.alert(
      "Xóa món ăn",
      `Bạn có chắc muốn xóa "${initialFood.name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: handleDelete,
        },
      ],
    );
  };

  const handleDelete = async () => {
    if (!initialFood) {
      return;
    }

    try {
      setIsDeleting(true);
      const tokens = parseSellerTokens(await SecureStore.getItemAsync("sellerTokens"));

      if (!tokens) {
        router.replace("/seller/signin" as any);
        return;
      }

      await deleteSellerFood(tokens.accessToken, initialFood.id);
      router.replace("/seller" as any);
    } catch (error) {
      console.error("Failed to delete food:", error);
      Alert.alert("Lỗi", "Xóa món ăn thất bại. Vui lòng thử lại.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!initialFood) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Không tìm thấy món ăn.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <ChevronRight color="#000000" size={27} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa món</Text>
          <TouchableOpacity style={styles.headerButton} onPress={confirmDelete}>
            {isDeleting ? (
              <ActivityIndicator color={DANGER} />
            ) : (
              <Trash2 color={DANGER} size={22} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.heroRow}>
              <Image source={imageSource} style={styles.foodImage} />
              <View style={styles.heroInfo}>
                <TextInput
                  maxLength={225}
                  onChangeText={setName}
                  style={styles.nameInput}
                  value={name}
                />
                <Text style={styles.categoryText}>
                  {initialFood.categoryName || "Chưa có phân loại"}
                </Text>
              </View>
            </View>

            <View style={styles.descriptionBlock}>
              <Text style={styles.rowLabel}>Mô tả</Text>
              <TextInput
                maxLength={1000}
                multiline
                onChangeText={setDescription}
                placeholder="Mô tả món ăn"
                placeholderTextColor="#8A98A8"
                style={styles.descriptionInput}
                textAlignVertical="top"
                value={description}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.rowLabel}>Trạng thái</Text>
              <View style={styles.switchSide}>
                <Text style={styles.switchLabel}>
                  {isAvailable ? "Hiện có" : "Chưa bán"}
                </Text>
                <Switch
                  onValueChange={setIsAvailable}
                  thumbColor="#FFFFFF"
                  trackColor={{ false: "#D8DEE8", true: "#9FBDF5" }}
                  value={isAvailable}
                />
              </View>
            </View>

            <SettingInput
              label="Giá cả"
              onChangeText={setPrice}
              placeholder="25.000 VNĐ"
              value={price}
            />
            <SettingInput
              label="Giá Khuyến Mãi"
              onChangeText={setSpecialPrice}
              placeholder="20.000 VNĐ"
              value={specialPrice}
            />
            <View style={styles.promoRow}>
              <Text style={styles.rowLabel}>Thời gian KM</Text>
              <View style={styles.promoInputs}>
                <TextInput
                  onChangeText={setStartTime}
                  placeholder="Start"
                  placeholderTextColor="#9CA7B8"
                  style={styles.promoInput}
                  value={startTime}
                />
                <Text style={styles.promoDash}>-</Text>
                <TextInput
                  onChangeText={setEndTime}
                  placeholder="End"
                  placeholderTextColor="#9CA7B8"
                  style={styles.promoInput}
                  value={endTime}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            disabled={isDeleting}
            onPress={confirmDelete}
            style={styles.deleteButton}
          >
            <Trash2 color="#FFFFFF" size={19} />
            <Text style={styles.deleteText}>Xóa món ăn</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            disabled={isSaving}
            onPress={handleSave}
            style={styles.saveButton}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>Cập nhật</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SettingInput({
  label,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <TextInput
        keyboardType="numeric"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA7B8"
        style={styles.priceInput}
        value={value}
      />
    </View>
  );
}

function parseFoodParam(value?: string) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as SellerFood;
  } catch {
    return null;
  }
}

function parseMoney(value: string) {
  const normalized = value.replace(/[^\d]/g, "");
  return Number(normalized);
}

function formatInputPrice(value?: number | null) {
  if (!value) {
    return "";
  }

  return Number(value).toLocaleString("vi-VN");
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG,
  },
  errorText: {
    color: DANGER,
    fontFamily: "Montserrat-Bold",
    fontSize: 15,
  },
  header: {
    height: 59,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    transform: [{ rotate: "180deg" }],
  },
  headerTitle: {
    color: "#000000",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 21,
  },
  content: {
    paddingHorizontal: 21,
    paddingBottom: 104,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  foodImage: {
    width: 74,
    height: 74,
    borderRadius: 16,
  },
  heroInfo: {
    flex: 1,
  },
  nameInput: {
    color: "#222222",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 18,
    padding: 0,
  },
  categoryText: {
    color: "#8A98A8",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    marginTop: 7,
  },
  descriptionBlock: {
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
  },
  rowLabel: {
    color: "#000000",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 17,
  },
  descriptionInput: {
    color: "#48525E",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    lineHeight: 17,
    minHeight: 68,
    padding: 0,
    marginTop: 12,
  },
  settingRow: {
    minHeight: 54,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  switchSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  switchLabel: {
    color: "#8A98A8",
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
  },
  priceInput: {
    color: "#8A98A8",
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
    minWidth: 140,
    padding: 0,
    textAlign: "right",
  },
  promoRow: {
    minHeight: 54,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  promoInputs: {
    flexDirection: "row",
    alignItems: "center",
  },
  promoInput: {
    color: "#8A98A8",
    fontFamily: "Montserrat-Medium",
    fontSize: 15,
    width: 68,
    padding: 0,
    textAlign: "center",
  },
  promoDash: {
    color: "#8A98A8",
    fontFamily: "Montserrat-Medium",
    fontSize: 15,
  },
  deleteButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: DANGER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 16,
  },
  bottomActions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#A8B5C7",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  saveButton: {
    height: 46,
    borderRadius: 100,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 16,
  },
});
