import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SellerOrderScreen() {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Đang phát triển</Text>
        <Text style={styles.subtitle}>Tính năng Order cho người bán sẽ được cập nhật sau.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EAF9F8",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    color: "#111111",
    fontFamily: "Montserrat-ExtraBold",
    fontSize: 24,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "#65727F",
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
