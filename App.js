import React, { useCallback, useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import LoginScreen from './src/components/UI/LoginUI/LoginScreen';
import RegisterScreen from './src/components/UI/LoginUI/RegisterScreen';
import ChallengeManager from './src/components/UI/ChallengeManager';
import HomeScreen from './src/components/UI/HomeUI/HomeScreen';
import userDemo from './src/data/userDemo.json';

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
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          <Stack.Screen name="ChallengeManager">
            {props => <ChallengeManager {...props} user={userDemo} />}
          </Stack.Screen>
          <Stack.Screen 
            name="Home" 
            children={props => <HomeScreen {...props} user={userDemo} />}
            initialParams={{ user: userDemo }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
