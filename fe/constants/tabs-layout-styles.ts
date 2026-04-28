import { StyleSheet } from "react-native";

export const tabBarStyle = {
  backgroundColor: "#FFFFFF",
  borderTopColor: "#E9EDF2",
  height: 78,
  paddingBottom: 10,
  paddingTop: 8,
};

export const tabBarLabelStyle = {
  fontFamily: "Montserrat-Medium",
  fontSize: 13,
  marginTop: 2,
};

export const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#D0E8D6",
    justifyContent: "center",
    alignItems: "center",
  },
  centerTabButtonWrapper: {
    justifyContent: "center",
    alignItems: "center",
    top: -18,
  },
  centerTabButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#238C48",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 8,
  },
});
