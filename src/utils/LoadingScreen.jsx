import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS } from '../theme';

const LoadingScreen = ({ message = 'Cargando...' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 24,
    minHeight: Platform.OS === 'web' ? '100vh' : undefined,
  },
  text: {
    marginTop: 20,
    fontSize: 20,
    color: COLORS.primary,
    fontFamily: FONTS.text,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LoadingScreen; 