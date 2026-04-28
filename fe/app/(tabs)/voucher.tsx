import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function VoucherScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voucher</Text>
      <Text style={styles.subtitle}>Danh sách ưu đãi sẽ hiển thị ở đây.</Text>
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
