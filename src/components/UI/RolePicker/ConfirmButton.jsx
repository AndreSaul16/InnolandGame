import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { CheckCircleIcon } from "react-native-heroicons/solid";

const ConfirmButton = ({ onPress, children }) => (
  <View style={styles.buttonWrapper}>
    <TouchableOpacity onPress={onPress} style={styles.confirmButton}>
      <Text style={styles.confirmButtonText}>{children}</Text>
      <CheckCircleIcon size={34} color="white" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 35,
  },
  confirmButton: {
    backgroundColor: "#10B981",
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minHeight: 50,
    minWidth: 100,
    elevation: 10,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginRight: 10,
  },
});

export default ConfirmButton; 