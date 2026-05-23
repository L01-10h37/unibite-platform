import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, ImagePlus, X } from "lucide-react-native";

import {
  createSellerFood,
  getFoodCategories,
  parseSellerTokens,
  uploadSellerFoodImages,
  type SellerCategory,
} from "@/services/seller-shop";

const BLUE = "#6298E8";
const BG = "#EAF9F8";
const LINE = "#E6ECF2";

type PickedImage = ImagePicker.ImagePickerAsset;

type CategoryChoice = {
  id: string;
  name: string;
  path: string;
};

export default function SellerCreateFoodScreen() {
  const [images, setImages] = useState<PickedImage[]>([]);
  const [categories, setCategories] = useState<SellerCategory[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<SellerCategory[]>([]);
  const [categoryPath, setCategoryPath] = useState<SellerCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryChoice | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [specialPrice, setSpecialPrice] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getFoodCategories();
        setCategories(data);
        setCategoryOptions(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    loadCategories();
  }, []);

  const resetForm = () => {
    setImages([]);
    setCategoryPath([]);
    setSelectedCategory(null);
    setCategoryOptions(categories);
    setShowCategories(false);
    setName("");
    setDescription("");
    setPrice("");
    setSpecialPrice("");
    setStartTime("");
    setEndTime("");
    setIsAvailable(true);
  };

  const handleBack = () => {
    resetForm();
    router.back();
  };

  const categoryPathText = useMemo(() => {
    if (selectedCategory) {
      return selectedCategory.path;
    }

    if (categoryPath.length > 0) {
      return categoryPath.map((category) => category.name).join(" > ");
    }

    return "Chọn phân loại";
  }, [categoryPath, selectedCategory]);

  const handlePickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Thiếu quyền", "Vui lòng cấp quyền truy cập ảnh để thêm ảnh món ăn.");
      return;
    }

    const remain = 8 - images.length;

    if (remain <= 0) {
      Alert.alert("Đã đủ ảnh", "Bạn chỉ có thể thêm tối đa 8 ảnh sản phẩm.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images"],
      quality: 0.85,
      selectionLimit: remain,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets].slice(0, 8));
    }
  };

  const handleRemoveImage = (uri: string) => {
    setImages(images.filter((image) => image.uri !== uri));
  };

  const handleSelectCategory = async (category: SellerCategory) => {
    const nextPath = [...categoryPath, category];
    const children = category.child || category.children || [];

    setCategoryPath(nextPath);
    setSelectedCategory(null);

    if (children.length > 0) {
      setCategoryOptions(children);
      return;
    }

    setSelectedCategory({
      id: category.id,
      name: category.name,
      path: nextPath.map((item) => item.name).join(" > "),
    });
    setShowCategories(false);
  };

  const resetCategoryPicker = () => {
    setCategoryPath([]);
    setSelectedCategory(null);
    setCategoryOptions(categories);
    setShowCategories(true);
  };

  const handleSubmit = async (isDraft: boolean) => {
    const trimmedName = name.trim();
    const parsedPrice = parseMoney(price);
    const parsedSpecialPrice = specialPrice.trim() ? parseMoney(specialPrice) : null;

    if (!trimmedName) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên món ăn.");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn phân loại món ăn.");
      return;
    }

    if (!parsedPrice || parsedPrice <= 0) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập giá món ăn hợp lệ.");
      return;
    }

    try {
      setIsSubmitting(true);
      const tokens = parseSellerTokens(await SecureStore.getItemAsync("sellerTokens"));

      if (!tokens) {
        router.replace("/seller/signin" as any);
        return;
      }

      const food = await createSellerFood(tokens.accessToken, {
        name: trimmedName,
        description: description.trim(),
        category: selectedCategory.id,
        price: parsedPrice,
        specialPrice: parsedSpecialPrice,
        isAvailble: isAvailable,
        isDraft,
        startTime: startTime.trim() || null,
        endTime: endTime.trim() || null,
      });

      if (images.length > 0) {
        await uploadSellerFoodImages(
          tokens.accessToken,
          food.id,
          images.map((image) => ({
            uri: image.uri,
            fileName: image.fileName,
            mimeType: image.mimeType,
          })),
        );
      }

      resetForm();
      router.replace("/seller" as any);
    } catch (error) {
      console.error("Failed to create food:", error);
      Alert.alert("Lỗi", "Không thể thêm món ăn. Vui lòng kiểm tra thông tin và thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <ChevronRight color="#000000" size={27} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thêm món mới</Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Ảnh sản phẩm <Text style={styles.counter}>({images.length}/8)</Text>
            </Text>
            <View style={styles.imageRow}>
              {images.map((image) => (
                <View key={image.uri} style={styles.imageThumbWrap}>
                  <Image source={{ uri: image.uri }} style={styles.imageThumb} />
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(image.uri)}
                    style={styles.removeImageButton}
                  >
                    <X color="#000000" size={12} />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 8 ? (
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={handlePickImages}
                  style={styles.addImageButton}
                >
                  <ImagePlus color="#26343D" size={31} />
                </TouchableOpacity>
              ) : null}
            </View>

            <InfoRow
              label="Tên món ăn"
              meta={`(${name.length}/225)`}
              onPress={undefined}
            >
              <TextInput
                maxLength={225}
                onChangeText={setName}
                placeholder="Trà sữa ô long đường đen"
                placeholderTextColor="#8A98A8"
                style={styles.inlineInput}
                value={name}
              />
            </InfoRow>

            <InfoRow
              label="Phân loại"
              rightText={categoryPathText}
              onPress={() => {
                if (showCategories) {
                  setShowCategories(false);
                  return;
                }
                resetCategoryPicker();
              }}
            />

            {showCategories ? (
              <View style={styles.categoryList}>
                {categoryPath.length > 0 ? (
                  <View style={styles.categoryPathHeader}>
                    <Text style={styles.categoryPathText}>
                      {categoryPath.map((category) => category.name).join(" > ")}
                    </Text>
                    <TouchableOpacity onPress={resetCategoryPicker}>
                      <Text style={styles.categoryResetText}>Chọn lại</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {categoryOptions.length > 0 ? (
                  categoryOptions.map((category) => (
                    <Pressable
                      key={category.id}
                      onPress={() => handleSelectCategory(category)}
                      style={styles.categoryItem}
                    >
                      <Text style={styles.categoryText}>{category.name}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#9CA7B8" />
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.emptyCategoryText}>Chưa có phân loại</Text>
                )}
              </View>
            ) : null}

            <View style={styles.descriptionBlock}>
              <Text style={styles.rowLabel}>
                Mô tả <Text style={styles.counter}>({description.length}/1000)</Text>
              </Text>
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
              <Text style={styles.rowLabel}>Hiện có</Text>
              <Switch
                onValueChange={setIsAvailable}
                thumbColor="#FFFFFF"
                trackColor={{ false: "#D8DEE8", true: "#9FBDF5" }}
                value={isAvailable}
              />
            </View>
            <SettingInput label="Giá cả" onChangeText={setPrice} placeholder="25.000 VNĐ" value={price} />
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
        </ScrollView>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            disabled
            style={[styles.draftButton, styles.draftButtonDisabled]}
          >
            <Text style={styles.draftText}>Lưu bản nháp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isSubmitting}
            onPress={() => handleSubmit(false)}
            style={styles.publishButton}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.publishText}>Đăng bán</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({
  children,
  label,
  meta,
  onPress,
  rightText,
}: {
  children?: React.ReactNode;
  label: string;
  meta?: string;
  onPress?: () => void;
  rightText?: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
      onPress={onPress}
      style={styles.infoRow}
    >
      <View style={styles.infoLeft}>
        <Text style={styles.rowLabel}>
          {label} {meta ? <Text style={styles.counter}>{meta}</Text> : null}
        </Text>
        {children}
      </View>
      {rightText ? (
        <Text style={styles.rowRightText} numberOfLines={1}>
          {rightText}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={17} color="#9CA7B8" />
    </TouchableOpacity>
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

function parseMoney(value: string) {
  const normalized = value.replace(/[^\d]/g, "");
  return Number(normalized);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  keyboardView: {
    flex: 1,
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
    paddingTop: 16,
  },
  sectionTitle: {
    color: "#000000",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 17,
    marginBottom: 14,
    paddingHorizontal: 22,
  },
  counter: {
    color: "#8A98A8",
    fontFamily: "Montserrat-Medium",
  },
  imageRow: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 24,
    paddingBottom: 11,
  },
  imageThumbWrap: {
    position: "relative",
  },
  imageThumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  removeImageButton: {
    position: "absolute",
    right: -4,
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#000000",
  },
  addImageButton: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#65727F",
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    minHeight: 70,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  infoLeft: {
    flex: 1,
    gap: 9,
  },
  rowLabel: {
    color: "#000000",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 17,
  },
  inlineInput: {
    color: "#48525E",
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    padding: 0,
  },
  rowRightText: {
    color: "#5E6670",
    fontFamily: "Montserrat-Medium",
    fontSize: 15,
    maxWidth: 170,
    marginRight: 6,
  },
  categoryList: {
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingHorizontal: 22,
    paddingVertical: 8,
    gap: 8,
  },
  categoryPathHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingBottom: 8,
  },
  categoryPathText: {
    color: "#8A98A8",
    flex: 1,
    fontFamily: "Montserrat-Medium",
    fontSize: 12,
    paddingRight: 12,
  },
  categoryResetText: {
    color: BLUE,
    fontFamily: "Montserrat-Bold",
    fontSize: 12,
  },
  categoryLoader: {
    paddingVertical: 12,
  },
  categoryItem: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
  },
  categoryText: {
    color: "#48525E",
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
  },
  emptyCategoryText: {
    color: "#9CA7B8",
    fontFamily: "Montserrat-Medium",
    fontSize: 13,
    paddingVertical: 8,
  },
  descriptionBlock: {
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 18,
  },
  descriptionInput: {
    color: "#48525E",
    fontFamily: "Montserrat-Medium",
    fontSize: 11,
    lineHeight: 16,
    minHeight: 56,
    padding: 0,
    marginTop: 12,
  },
  settingRow: {
    minHeight: 52,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
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
    minHeight: 52,
    borderTopWidth: 1,
    borderTopColor: LINE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
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
  bottomActions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 74,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#A8B5C7",
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 20,
  },
  draftButton: {
    flex: 1,
    height: 46,
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#9DC2F8",
    alignItems: "center",
    justifyContent: "center",
  },
  draftButtonDisabled: {
    opacity: 0.45,
  },
  draftText: {
    color: "#9DC2F8",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 16,
  },
  publishButton: {
    flex: 1,
    height: 46,
    borderRadius: 100,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  publishText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 16,
  },
});
