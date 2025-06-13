import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../../theme';

const MagnetCount = ({ count }) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="magnet" size={40} color="#007AFF" />
      <Text style={styles.count}>{count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 8,
    marginBottom: 24,
  },
  count: {
    fontSize: 26,
    fontFamily: FONTS.title,
    color: COLORS.darkBlue,
    marginLeft: 8,
  },
});

export default MagnetCount; 