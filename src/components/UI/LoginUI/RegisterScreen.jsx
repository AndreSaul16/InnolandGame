import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { registerUser } from '../../../services/UserService';
import { showAlert } from '../../../utils/showAlert';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    email: '',
    telefono: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    username: '',
    password: '',
    magnetos: 0,
  });

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleRegister = async () => {
    if (Object.values(form).some((v) => !v && v !== 0)) {
      showAlert('Error', 'Por favor, completa todos los campos');
      return;
    }
    try {
      await registerUser(form);
      showAlert('Éxito', 'Usuario registrado correctamente', [
        { text: 'OK', onPress: () => navigation.navigate('LoginScreen') }
      ]);
    } catch (error) {
      showAlert('Error', error.message || 'No se pudo guardar el usuario');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={(v) => handleChange('email', v)} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Teléfono" value={form.telefono} onChangeText={(v) => handleChange('telefono', v)} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Nombre" value={form.nombre} onChangeText={(v) => handleChange('nombre', v)} />
      <TextInput style={styles.input} placeholder="Apellido" value={form.apellido} onChangeText={(v) => handleChange('apellido', v)} />
      <TextInput style={styles.input} placeholder="Fecha de nacimiento (YYYY-MM-DD)" value={form.fechaNacimiento} onChangeText={(v) => handleChange('fechaNacimiento', v)} />
      <TextInput style={styles.input} placeholder="Username" value={form.username} onChangeText={(v) => handleChange('username', v)} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Contraseña" value={form.password} onChangeText={(v) => handleChange('password', v)} secureTextEntry />
      <Button title="Registrarse" onPress={handleRegister} />
      <Text style={styles.loginText} onPress={() => navigation.navigate('LoginScreen')}>
        ¿Ya tienes cuenta? Inicia sesión
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  loginText: {
    marginTop: 16,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen; 