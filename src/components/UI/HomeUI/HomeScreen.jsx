import React, { useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import ProfileHeader from './ProfileHeader';
import MagnetCount from './MagnetCount';
import StartGameButton from './StartGameButton';
import LastGameDashboard from './LastGameDashboard';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS } from '../../../theme';

const HomeScreen = ({ route, user, magnetCount, lastGame }) => {
  const navigation = useNavigation();
  const userFromParams = route?.params?.user;
  const userToShow = userFromParams || user;
  const magnetos = userToShow?.magnetos ?? 0;

  // Animación
  const [animating, setAnimating] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleStartGame = () => {
    setAnimating(true);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(() => {
      setAnimating(false);
      fadeAnim.setValue(1);
      navigation.navigate('ChallengeManager');
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}> 
      <Image source={require('../../../assets/iconos/logo.png')} style={styles.logo} resizeMode="contain" />
      <ProfileHeader user={userToShow} />
      <MagnetCount count={magnetos} />
      <View style={styles.startGameButton}>
        <StartGameButton onPress={animating ? undefined : handleStartGame} />
      </View>
      <View style={styles.dashboard}>
        <LastGameDashboard lastGame={lastGame} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: 260,
    height: 60,
    marginBottom: 32,
    marginTop: 10,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.title,
    color: COLORS.darkBlue,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontFamily: FONTS.text,
    color: COLORS.blue,
    marginBottom: 12,
    textAlign: 'center',
  },
  startGameButton: {
    marginBottom: 32,
  },
  dashboard: {
    marginTop: 32,
  },
});

export default HomeScreen; 