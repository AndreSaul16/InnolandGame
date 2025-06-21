import React, { useCallback, useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import LoginScreen from './src/components/UI/LoginUI/LoginScreen';
import HomeScreen from './src/components/UI/HomeUI/HomeScreen';
import RegisterScreen from './src/components/UI/LoginUI/RegisterScreen';
import RoomScreen from './src/components/UI/RoomUI/RoomScreen';
import GameScreen from './src/components/UI/GameUI/GameScreen';
import CameraScreen from './src/components/UI/GameUI/CameraScreen';
import ChallengeUI from './src/components/UI/ChallengeUI';
import ResultsScreen from './src/components/UI/GameUI/ResultsScreen';
import { UserProvider } from './src/context/UserContext';

const Stack = createStackNavigator();

const fetchFonts = () => {
  return Font.loadAsync({
    'DarkerGrotesque': require('./assets/fonts/Darker_Grotesque/static/DarkerGrotesque-Regular.ttf'),
    'DarkerGrotesque-Bold': require('./assets/fonts/Darker_Grotesque/static/DarkerGrotesque-Bold.ttf'),
    'DarkerGrotesque-Black': require('./assets/fonts/Darker_Grotesque/static/DarkerGrotesque-Black.ttf'),
    'DarkerGrotesque-ExtraBold': require('./assets/fonts/Darker_Grotesque/static/DarkerGrotesque-ExtraBold.ttf'),
    'DarkerGrotesque-Light': require('./assets/fonts/Darker_Grotesque/static/DarkerGrotesque-Light.ttf'),
    'DarkerGrotesque-Medium': require('./assets/fonts/Darker_Grotesque/static/DarkerGrotesque-Medium.ttf'),
    'DarkerGrotesque-SemiBold': require('./assets/fonts/Darker_Grotesque/static/DarkerGrotesque-SemiBold.ttf'),
    // Si tienes Poppins, agrégalo aquí con su ruta correcta
  });
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Evita que el splash se oculte automáticamente
  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  // Oculta el splash cuando las fuentes estén listas
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Carga las fuentes al montar
  useEffect(() => {
    fetchFonts()
      .then(() => setFontsLoaded(true))
      .catch(console.warn);
  }, []);

  return (
    <UserProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="LoginScreen" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
            <Stack.Screen name="RoomScreen" component={RoomScreen} />
            <Stack.Screen name="GameScreen" component={GameScreen} />
            <Stack.Screen name="CameraScreen" component={CameraScreen} />
            <Stack.Screen name="ChallengeUI" component={ChallengeUI} />
            <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </UserProvider>
  );
}
