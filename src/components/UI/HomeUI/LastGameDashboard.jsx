import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { COLORS, FONTS } from '../../../theme';

const fakeLastGame = {
  score: 1200,
  duration: 15,
  date: '2024-06-13'
};

const screenWidth = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';

const LastGameDashboard = ({ lastGame }) => {
  const data = lastGame || fakeLastGame;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Última Partida</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Puntaje:</Text>
        <Text style={styles.value}>{data.score}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Duración:</Text>
        <Text style={styles.value}>{data.duration} min</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Fecha:</Text>
        <Text style={styles.value}>{data.date}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth * 0.9,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 1,
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.title,
    color: COLORS.darkBlue,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  label: {
    fontSize: 15,
    color: '#555',
  },
  value: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    fontFamily: FONTS.text,
    color: COLORS.blue,
  },
});

export default LastGameDashboard; 