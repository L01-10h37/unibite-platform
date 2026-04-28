import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";

// Định nghĩa kiểu dữ liệu cho mỗi Slide
interface SlideItem {
  key: string;
  title: string;
  text: string;
  image: ImageSourcePropType;
  backgroundColor: string;
}

// Định nghĩa kiểu dữ liệu cho Props của component
interface OnboardingProps {
  onDone: () => void;
}

const slides: SlideItem[] = [
  {
    key: "s1",
    title: "Chào mừng đến với UniBite",
    text: "UniBite giúp bạn dễ dàng khám phá những món ăn ngon quanh khuôn viên trường nhanh chóng, tiện lợi và đáng tin cậy.",
    image: require("@/assets/images/screen1.png"),
    backgroundColor: "#DAF2DB",
  },
  {
    key: "s2",
    title: "Khám phá quán ăn quanh bạn",
    text: "Tìm kiếm và khám phá những quán ăn ngon gần bạn với chỉ một chạm.",
    image: require("@/assets/images/screen2.png"),
    backgroundColor: "#DAF2DB",
  },
  {
    key: "s3",
    title: "Đặt món thật dễ dàng",
    text: "Thêm món ăn yêu thích vào giỏ và đặt hàng chỉ với vài thao tác. Trải nghiệm đặt đồ ăn nhanh chóng, tiện lợi và rõ ràng hơn bao giờ hết.",
    image: require("@/assets/images/screen3.png"),
    backgroundColor: "#DAF2DB",
  },
  {
    key: "s4",
    title: "Đánh giá & tin cậy",
    text: "Xem nhận xét và đánh giá chân thực từ các sinh viên khác để chọn món ăn phù hợp. Không còn phải tìm kiếm thông tin rời rạc trên mạng xã hội.",
    image: require("@/assets/images/screen4.png"),
    backgroundColor: "#DAF2DB",
  },
];

const OnboardingScreen: React.FC<OnboardingProps> = ({ onDone }) => {
  const sliderRef = useRef<AppIntroSlider<SlideItem> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === slides.length - 1;

  const handleNextOrDone = () => {
    if (isLastSlide) {
      onDone();
      return;
    }
    sliderRef.current?.goToSlide(activeIndex + 1, true);
  };

  const renderItem = ({ item }: { item: SlideItem }) => (
    <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      <Text style={styles.title}>{item.title}</Text>
      <Image source={item.image} style={styles.image} />
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );

  return (
    <AppIntroSlider
      ref={sliderRef}
      renderItem={renderItem}
      data={slides}
      onDone={onDone}
      onSlideChange={(index) => setActiveIndex(index)}
      renderPagination={() => (
        <View pointerEvents="box-none" style={styles.paginationOverlay}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.skipButton}
            onPress={onDone}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.fabButton}
            onPress={handleNextOrDone}
          >
            <Ionicons
              name={isLastSlide ? "checkmark" : "arrow-forward"}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      )}
    />
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 96,
  },
  image: {
    width: 320,
    height: 320,
    marginVertical: 32,
  },
  text: {
    color: "#6D5A5A",
    textAlign: "center",
    paddingHorizontal: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 26,
    color: "#3E8C55",
    fontWeight: "bold",
    textAlign: "center",
  },
  paginationOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  skipButton: {
    position: "absolute",
    top: 52,
    left: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 16,
    color: "#4A4A4A",
    fontWeight: "600",
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#238C48",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 20,
    bottom: 34,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 6,
  },
});
