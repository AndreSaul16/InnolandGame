import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';
import { showAlert } from '../../../utils/showAlert';
import { COLORS, FONTS } from '../../../theme';
import { UserContext } from '../../../context/UserContext';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user) {
      navigation.replace('Home');
    }
  }, [user, navigation]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // 1. Buscar el correo por username en la base de datos
      const db = getDatabase();
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      let userFound = null;
      if (snapshot.exists()) {
        const users = snapshot.val();
        userFound = Object.values(users).find(u => u.username === username);
      }
      if (!userFound) {
        showAlert('Error', 'Usuario no encontrado');
        setLoading(false);
        return;
      }
      // 2. Iniciar sesión con el correo y la contraseña
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, userFound.email, password);
      // 3. Navegar a HomeScreen pasando el usuario
      showAlert('Éxito', 'Inicio de sesión correcto');
      navigation.navigate('Home', { user: { ...userFound, uid: userCredential.user.uid } });
    } catch (error) {
      showAlert('Error', error.message || 'No se pudo acceder a la base de datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 16 }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../../assets/logo/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Iniciar Sesión" onPress={handleLogin} />
      <Text style={styles.registerText} onPress={() => navigation.navigate('RegisterScreen')}>
        ¿No tienes cuenta? Regístrate
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 24,
  },
  logo: {
    width: 240,
    height: 60,
    marginBottom: 32,
    marginTop: 10,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: COLORS.darkBlue,
    fontFamily: FONTS.title,
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    height: 44,
    borderColor: COLORS.gray,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 16,
    color: COLORS.darkBlue,
  },
  registerText: {
    marginTop: 16,
    color: COLORS.blue,
    textDecorationLine: 'underline',
    fontFamily: FONTS.text,
    fontSize: 16,
  },
});

export default LoginScreen;
