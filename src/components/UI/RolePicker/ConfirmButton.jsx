import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { CheckCircleIcon } from "react-native-heroicons/solid";
import { COLORS, FONTS } from '../../../theme';

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
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minHeight: 50,
    minWidth: 100,
    elevation: 10,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: COLORS.darkBlue,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    marginRight: 10,
    fontFamily: FONTS.text,
  },
});

export default ConfirmButton; 