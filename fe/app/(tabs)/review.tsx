import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const posts = [
  {
    id: 1,
    name: "Minh Tuna",
    category: "Cơm gà nguyên ký",
    title: "Quán cơm gà nhưng bán bún bò khá ngon",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=900",
  },
  {
    id: 2,
    name: "Minh Tuna",
    category: "Khô gà ôi",
    title: "Sự thật về khô gà ị i có ngon như review",
    content:
      "Hiện tại, không có bằng chứng xác thực nào cho thấy sản phẩm khô gà của Đỗ Mỡi chứa thịt bẩn.",
  },
  {
    id: 3,
    name: "Minh Tuna",
    category: "Khô gà ôi",
    title: "Sự thật về khô gà ị i có ngon như review",
    content:
      "Hiện tại, không có bằng chứng xác thực nào cho thấy sản phẩm khô gà của Đỗ Mỡi chứa thịt bẩn.",
  },
];

export default function ReviewScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchBox}>
          <Feather name="search" size={22} color="#1E2E28" />
          <TextInput
            placeholder="Tìm bất cứ điều gì"
            placeholderTextColor="#6E767D"
            style={styles.searchInput}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.feed}>
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image
                  source={{ uri: "https://i.pravatar.cc/100?img=12" }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{post.name}</Text>
                  <Text style={styles.category}>{post.category}</Text>
                </View>
                <Feather name="more-horizontal" size={20} color="#1E2E28" />
              </View>

              <Text style={styles.title}>{post.title}</Text>

              {post.image ? (
                <Image source={{ uri: post.image }} style={styles.foodImage} />
              ) : (
                <Text style={styles.content}>{post.content}</Text>
              )}

              <View style={styles.actions}>
                <View style={styles.actionItem}>
                  <Feather name="message-circle" size={17} color="#1E2E28" />
                  <Text style={styles.actionText}>3</Text>
                </View>
                <View style={styles.actionItem}>
                  <Feather name="thumbs-up" size={17} color="#1E2E28" />
                  <Text style={styles.actionText}>17</Text>
                </View>
                <View style={styles.actionItem}>
                  <Feather name="bookmark" size={17} color="#1E2E28" />
                  <Text style={styles.actionText}>48</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#C5E0CD",
  },
  container: {
    flex: 1,
    backgroundColor: "#C5E0CD",
    paddingHorizontal: 12,
  },
  searchBox: {
    marginTop: 8,
    marginBottom: 12,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#223131",
  },
  categoryScroll: {
    marginTop: 12,
    maxHeight: 32,
  },
  categoryChip: {
    backgroundColor: "white",
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: "#4E5F5E",
    fontWeight: "600",
  },
  feed: {
    paddingTop: 10,
    paddingBottom: 90,
    gap: 8,
  },
  postCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 8,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  name: {
    fontSize: 11,
    fontWeight: "800",
    color: "#223131",
  },
  category: {
    fontSize: 9,
    color: "#6E767D",
  },
  title: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111",
    marginBottom: 6,
  },
  foodImage: {
    width: "100%",
    height: 190,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  content: {
    fontSize: 10,
    color: "#4E5F5E",
    lineHeight: 14,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingTop: 8,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: "#223131",
  },
  bottomBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    height: 58,
    borderRadius: 20,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    elevation: 6,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    width: 54,
  },
  tabText: {
    fontSize: 10,
    color: "#7A8380",
    marginTop: 2,
  },
  tabTextActive: {
    color: "#2E8B57",
    fontWeight: "700",
  },
  centerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3E9B5F",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    borderWidth: 4,
    borderColor: "white",
  },
});