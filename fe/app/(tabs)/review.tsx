import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#1EA64A";
const BG = "#F7F9F7";
const CARD_BG = "#FFFFFF";
const BORDER = "#E8EFE9";

const TAGS = ["Sạch sẽ", "Đóng gói tốt", "Giá cả phù hợp", "Thức ăn ngon miệng", "Giao hàng nhanh", "Phục vụ tốt"];

const STAR_LABELS: Record<number, string> = {
  1: "Tệ",
  2: "Không tốt",
  3: "Bình thường",
  4: "Tốt",
  5: "Xuất sắc",
};

export default function WriteReviewScreen() {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Đóng gói tốt", "Giá cả phù hợp", "Thức ăn ngon miệng"]);
  const [reviewText, setReviewText] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Viết đánh giá</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Product Card */}
        <View style={styles.productCard}>
          <View style={styles.productImageWrapper}>
            <Image
              source={{ uri: "https://file.hstatic.net/200000700229/article/bun-bo-hue-1_da318989e7c2493f9e2c3e010e722466.jpg" }}
              style={styles.productImage}
            />
          </View>
          <Text style={styles.productName}>Hồng trà Ngô Gia</Text>
          <View style={styles.verifiedRow}>
            <MaterialCommunityIcons name="check-decagram" size={16} color={PRIMARY} />
            <Text style={styles.verifiedText}>Đã xác minh mua hàng</Text>
          </View>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setRating(s)} activeOpacity={0.8}>
                <MaterialCommunityIcons
                  name={s <= rating ? "star" : "star-outline"}
                  size={38}
                  color={s <= rating ? "#F7B500" : "#D0D5D2"}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{STAR_LABELS[rating]}</Text>
          )}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bạn cảm thấy thế nào?</Text>
          <View style={styles.tagsWrap}>
            {TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.8}
                  style={[styles.tag, active && styles.tagActive]}
                >
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Review Text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nhận xét chi tiết</Text>
          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textArea}
              placeholder="Bạn thích hoặc không thích điều gì về sản phẩm này? (Bắt buộc)"
              placeholderTextColor="#A8B4AA"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={reviewText}
              onChangeText={setReviewText}
            />
            <Text style={styles.charCount}>{reviewText.length}/500</Text>
          </View>
        </View>

        {/* Media Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thêm hình ảnh / video</Text>
          <TouchableOpacity style={styles.mediaUpload} activeOpacity={0.8}>
            <MaterialCommunityIcons name="camera-plus-outline" size={26} color="#7A9E82" />
            <Text style={styles.mediaText}>Thêm ảnh hoặc video</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.btnSecondary} activeOpacity={0.8}>
          <Text style={styles.btnSecondaryText}>Về trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>Gửi đánh giá</Text>
          <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Montserrat-Bold",
    color: "#1A1A1A",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  productCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  productImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: PRIMARY + "33",
    marginBottom: 12,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productName: {
    fontSize: 18,
    fontFamily: "Montserrat-Bold",
    color: "#1A1A1A",
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontFamily: "Montserrat-Medium",
    color: "#6B9E77",
  },
  starsRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 4,
  },
  ratingLabel: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
    color: "#F7B500",
  },
  section: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Montserrat-SemiBold",
    color: "#3A3A3A",
    marginBottom: 12,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F4F6F4",
    borderWidth: 1.5,
    borderColor: "#DDE8DF",
  },
  tagActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  tagText: {
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
    color: "#5A6E5E",
  },
  tagTextActive: {
    color: "#fff",
  },
  textAreaWrapper: {
    borderRadius: 14,
    backgroundColor: "#F7F9F7",
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 12,
  },
  textArea: {
    minHeight: 100,
    fontSize: 14,
    fontFamily: "Montserrat-Regular",
    color: "#1A1A1A",
  },
  charCount: {
    textAlign: "right",
    fontSize: 11,
    fontFamily: "Montserrat-Regular",
    color: "#A0A0A0",
    marginTop: 4,
  },
  mediaUpload: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderStyle: "dashed",
    backgroundColor: "#F0F7F2",
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  mediaText: {
    fontSize: 14,
    fontFamily: "Montserrat-Medium",
    color: "#7A9E82",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  btnSecondary: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#C8D5CA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F6F4",
  },
  btnSecondaryText: {
    fontSize: 15,
    fontFamily: "Montserrat-SemiBold",
    color: "#4A6E50",
  },
  btnPrimary: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontFamily: "Montserrat-Bold",
    color: "#fff",
  },
});
