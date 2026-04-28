import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function CartScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giỏ hàng</Text>
      <Text style={styles.subtitle}>Các món đã chọn sẽ hiển thị tại đây.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#CFE9D7",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    color: "#1E1E1E",
    fontFamily: "Montserrat-Bold",
  },
  subtitle: {
    marginTop: 10,
    color: "#4E4E4E",
    textAlign: "center",
    fontFamily: "Montserrat-Medium",
  },
});
