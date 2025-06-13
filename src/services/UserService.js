// Este archivo ahora es tu "apiService.js" o "userService.js" en React Native

import axios from 'axios';
import { Platform } from 'react-native';
import { AZURE_FUNCTION_URL } from '@env';

// Preferir la variable de entorno compatible con web si existe
const API_URL = process.env.REACT_APP_AZURE_FUNCTION_URL || AZURE_FUNCTION_URL;

// ======================================================================
// ✅ PASO DE DEPURACIÓN:
// Este console.log nos mostrará en la consola del navegador la URL exacta que se está usando.
// Después de arreglar tu archivo .env, aquí deberías ver la URL limpia, sin el '?'.
console.log('---[UserService DEBUG]---');
console.log('Plataforma detectada:', Platform.OS);
console.log('URL de la API en uso:', API_URL);
console.log('-------------------------');
// ======================================================================


// --- PASO 2: Transformación de tus Funciones ---
// Cada función ahora hará una petición POST a tu API, enviando una "action" y un "payload".

/**
 * Registra un nuevo usuario llamando a la Azure Function.
 * @param {object} userData - El objeto completo del usuario (email, username, password, etc.).
 */
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(API_URL, {
      action: 'register',
      payload: userData
    });
    // La Azure Function devuelve el usuario recién creado.
    return response.data;
  } catch (error) {
    // Si la API devuelve un error (ej: "El usuario ya existe"), lo lanzamos para que la pantalla lo pueda mostrar.
    throw new Error(error.response?.data || 'Error al registrar el usuario.');
  }
};

/**
 * Inicia sesión llamando a la Azure Function.
 * @param {string} username - El nombre de usuario.
 * @param {string} password - La contraseña.
 */
export const findUserByCredentials = async (username, password) => {
  try {
    const response = await axios.post(API_URL, {
      action: 'login',
      payload: { username, password }
    });
    // La Azure Function devuelve los datos del usuario (sin la contraseña).
    return response.data;
  } catch (error) {
    // Si la API devuelve 404, lanzamos el error.
    throw new Error(error.response?.data || 'Error de conexión o credenciales incorrectas.');
  }
};

/**
 * Obtiene la lista de todos los usuarios.
 */
export const getAllUsers = async () => {
  try {
    const response = await axios.post(API_URL, {
      action: 'getAllUsers',
      payload: {} // No necesitamos enviar datos para esta acción
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data || 'Error al obtener los usuarios.');
  }
};

/**
 * Actualiza los magnetos de un usuario.
 * @param {string} username - El username del usuario a actualizar.
 * @param {number} newMagnetos - La nueva cantidad de magnetos.
 */
export const updateUserMagnetos = async (username, newMagnetos) => {
  try {
    const response = await axios.post(API_URL, {
      action: 'updateMagnetos',
      payload: { username, newMagnetos }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data || 'Error al actualizar los magnetos.');
  }
};
