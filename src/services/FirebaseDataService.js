import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getDatabase, ref, set, push, onValue, update, get, child, remove, runTransaction } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { PLAYER_ROLES_DATA } from '../data/gameState'; // Ajusta la ruta si es necesario

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBleZuG3c2g2Mk3ZRMDqgrFSKwmCyIhfk0",
    authDomain: "innolandgame.firebaseapp.com",
    databaseURL: "https://innolandgame-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "innolandgame",
    storageBucket: "innolandgame.firebasestorage.app",
    messagingSenderId: "840018272393",
    appId: "1:840018272393:web:89e20b5bc9b17f3dd8a658",
    measurementId: "G-C9ZWE8GX56"
};

// Inicialización de Firebase y sus servicios
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

/**
 * Registra un nuevo usuario en Authentication y crea su perfil en Realtime Database.
 * @param {object} userData - Todos los datos del formulario de registro.
 * @returns {Promise<User>} El objeto de usuario de Firebase.
 */
export const registerUser = async (userData) => {
  const { email, password, nombre, apellido, username, telefono, fechaNacimiento } = userData;

  try {
    // 1. Crear el usuario en Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Actualizar el perfil básico en Authentication
    await updateProfile(user, {
      displayName: `${nombre} ${apellido}`,
    });

    // 3. Guardar el resto de la información en Realtime Database
    // Se crea una entrada en "users" con el UID del usuario como clave.
    await set(ref(database, 'users/' + user.uid), {
      username: username,
      email: user.email,
      nombre: nombre,
      apellido: apellido,
      telefono: telefono,
      fechaNacimiento: fechaNacimiento,
      magnetos_totales: 0,
      fecha_creacion: new Date().toISOString(),
    });

    return user;

  } catch (error) {
    console.error("Error en el servicio registerUser:", error);
    throw error; // Relanzamos el error para que el componente lo pueda gestionar.
  }
};

// Genera un código de sala único de 4 letras mayúsculas
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getInitialRolesObject() {
  const roles = {};
  PLAYER_ROLES_DATA.forEach(role => {
    roles[role.name] = { status: 'available' };
  });
  return roles;
}

// Utilidad mejorada para limpiar el objeto usuario antes de guardar en Firebase
function cleanUserForFirebase(user, seen = new WeakSet()) {
  if (!user || typeof user !== 'object') return user;
  if (seen.has(user)) return undefined; // Evita ciclos
  seen.add(user);
  const forbiddenKeys = [
    'proactiveRefresh', 'reloadUserInfo', 'stsTokenManager', 'apiKey', 'appName', 'metadata',
    'providerData', 'tenantId', 'refreshToken', 'accessToken', 'auth', 'toJSON', 'reloadListener',
    '_redirectEventId', '_redirectUser', '_redirectEventId', '_redirectPersistence', '_redirectResolver',
    'multiFactor', 'operationType', 'userCredential', 'providerId', 'getIdToken', 'getIdTokenResult',
    'linkWithCredential', 'reauthenticateWithCredential', 'reload', 'sendEmailVerification', 'unlink',
    'updateEmail', 'updatePassword', 'updatePhoneNumber', 'updateProfile', 'delete', 'emailVerified',
    'isAnonymous', 'phoneNumber', 'photoURL', 'providerData', 'refreshToken', 'tenantId',
    'heartbeatServiceProvider', 'component', 'instanceFactory', 'container', 'app', 'provider',
  ];
  const clean = {};
  for (const key in user) {
    if (forbiddenKeys.includes(key)) continue;
    const value = user[key];
    if (typeof value === 'function') continue;
    if (typeof value === 'object' && value !== null) {
      const cleaned = cleanUserForFirebase(value, seen);
      if (cleaned !== undefined) clean[key] = cleaned;
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

// Crea una sala y añade al usuario como anfitrión y primer jugador
export const createRoom = async (hostUser) => {
  if (!hostUser || !hostUser.uid) {
    throw new Error('El usuario debe tener un UID válido para crear una sala');
  }
  let code;
  let exists = true;
  // Asegura que el código sea único
  while (exists) {
    code = generateRoomCode();
    const snapshot = await get(ref(database, `rooms/${code}`));
    exists = snapshot.exists();
  }
  const roomRef = ref(database, `rooms/${code}`);
  const cleanHost = cleanUserForFirebase(hostUser);
  // Asegurar que el uid se mantiene después de la limpieza
  if (!cleanHost.uid) {
    cleanHost.uid = hostUser.uid;
  }
  await set(roomRef, {
    code,
    status: 'waiting',
    host: cleanHost,
    players: {
      [cleanHost.uid]: {
        ...cleanHost,
        uid: cleanHost.uid,
        joinedAt: Date.now(),
        isHost: true,
        magnetos: 0, // Inicializa el contador temporal
      },
    },
    roles: getInitialRolesObject(),
    createdAt: Date.now(),
  });
  return code;
};

// Unirse a una sala existente
export const joinRoom = async (code, user) => {
  console.log('[FirebaseDataService] joinRoom: Iniciado con code =', code, 'user =', user);
  const roomRef = ref(database, `rooms/${code}`);
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) {
    console.log('[FirebaseDataService] joinRoom: La sala no existe');
    throw new Error('La sala no existe');
  }
  const playerRef = ref(database, `rooms/${code}/players/${user.uid}`);
  const cleanUser = cleanUserForFirebase(user);
  await set(playerRef, {
    ...cleanUser,
    uid: cleanUser.uid,
    joinedAt: Date.now(),
    isHost: false,
    magnetos: 0, // Inicializa el contador temporal
  });
  console.log('[FirebaseDataService] joinRoom: Usuario añadido a la sala correctamente');
  return code;
};

// Escuchar en tiempo real los jugadores de una sala
export const listenRoomPlayers = (code, callback) => {
  const playersRef = ref(database, `rooms/${code}/players`);
  return onValue(playersRef, (snapshot) => {
    const players = snapshot.val() || {};
    callback(Object.values(players));
  });
};

// Escuchar en tiempo real el game_state de una sala
export const listenGameState = (roomCode, callback) => {
  const gameStateRef = ref(database, `rooms/${roomCode}/game_state`);
  return onValue(gameStateRef, (snapshot) => {
    callback(snapshot.val());
  });
};

// Actualizar el estado del juego (game_state) en una sala
export const updateGameState = async (roomCode, newState) => {
  const gameStateRef = ref(database, `rooms/${roomCode}/game_state`);
  await update(gameStateRef, newState);
};

// Cambiar el estado general de la sala (status: waiting, in_progress, finished)
export const updateRoomStatus = async (roomCode, status) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  await update(roomRef, { status });
};

// Escuchar todos los datos de la sala en tiempo real
export const listenToRoomData = (roomCode, callback) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  return onValue(roomRef, (snapshot) => {
    callback(snapshot.val());
  });
};

// Obtener la lista de jugadores de una sala
export const getRoomPlayers = async (roomCode) => {
  const playersRef = ref(database, `rooms/${roomCode}/players`);
  const snapshot = await get(playersRef);
  const players = snapshot.val() || {};
  return Object.values(players);
};

// Eliminar una sala completa (incluyendo game_state y jugadores)
export const deleteRoom = async (roomCode) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  await remove(roomRef);
};

export const takeRole = async (roomCode, roleName, playerUid, playerName) => {
  const db = getDatabase();
  // 1. Buscar el rol anterior del jugador
  const playerRef = ref(db, `rooms/${roomCode}/players/${playerUid}`);
  const playerSnap = await get(playerRef);
  let previousRole = null;
  if (playerSnap.exists()) {
    previousRole = playerSnap.val().role;
  }

  // 2. Liberar el rol anterior si existe y es diferente al nuevo
  if (previousRole && previousRole !== roleName) {
    const prevRoleRef = ref(db, `rooms/${roomCode}/roles/${previousRole}`);
    await update(prevRoleRef, { status: 'available', playerUid: null, playerName: null });
  }

  // 3. Tomar el nuevo rol usando transacción
  const roleRef = ref(db, `rooms/${roomCode}/roles/${roleName}`);
  return runTransaction(roleRef, (currentData) => {
    if (currentData && currentData.status === 'available') {
      return {
        status: 'taken',
        playerUid,
        playerName
      };
    }
    return currentData;
  }).then(async (result) => {
    // Si la transacción fue exitosa y el rol fue tomado, actualiza el jugador
    if (result.committed) {
      await update(playerRef, { role: roleName, isReady: true });
    }
    return result;
  });
};

// Eliminar a un jugador de la sala
export const leaveRoom = async (roomCode, playerUid) => {
  const db = getDatabase();
  const playerRef = ref(db, `rooms/${roomCode}/players/${playerUid}`);
  await remove(playerRef);
};

// Obtener un reto por código QR desde Firebase
export const getChallengeByQR = async (codigoQR) => {
  const db = getDatabase();
  const challengesRef = ref(db, 'challenges');
  const snapshot = await get(challengesRef);
  if (snapshot.exists()) {
    const challenges = snapshot.val();
    // Puede ser array o objeto
    const retos = Array.isArray(challenges) ? challenges : Object.values(challenges);
    // Buscar por el campo 'id' que coincida exactamente con el QR
    const reto = retos.find(r => r.id === codigoQR);
    return reto || null;
  }
  return null;
};

// Guarda la información de la última partida para un usuario, incluyendo el turno actual de la sala.
// @param {string} uid - UID del usuario.
// @param {string} roomCode - Código de la sala.
// @param {object} lastGameData - Objeto con los datos de la última partida (sin el turno).
export const saveLastGameWithTurn = async (uid, roomCode, lastGameData) => {
  try {
    const turnoRef = ref(database, `rooms/${roomCode}/game_state/turno`);
    const snapshot = await get(turnoRef);
    const turno = snapshot.exists() ? snapshot.val() : null;
    console.log('[saveLastGameWithTurn] Valor de turno obtenido:', turno);
    const userLastGameRef = ref(database, `users/${uid}/lastGame`);
    await set(userLastGameRef, { ...lastGameData, turno });
    console.log('[saveLastGameWithTurn] lastGame guardado para usuario', uid, { ...lastGameData, turno });
  } catch (error) {
    console.error('[saveLastGameWithTurn] Error al guardar lastGame con turno:', error);
    throw error;
  }
};

// Escucha en tiempo real la última partida de un usuario
export const listenLastGameForUser = (uid, callback) => {
  const userLastGameRef = ref(database, `users/${uid}/lastGame`);
  return onValue(userLastGameRef, (snapshot) => {
    callback(snapshot.val());
  });
};

/**
 * Suma una cantidad de magnetos al usuario de forma atómica en Firebase.
 * @param {string} uid - UID del usuario.
 * @param {number} cantidad - Cantidad de magnetos a sumar.
 * @returns {Promise<void>}
 */
export const addMagnetosToUser = async (uid, cantidad) => {
  const userRef = ref(database, `users/${uid}/magnetos_totales`);
  await runTransaction(userRef, (currentValue) => {
    return (currentValue || 0) + cantidad;
  });
};

/**
 * Obtiene los magnetos totales de varios usuarios por sus UIDs.
 * @param {string[]} uids - Array de UIDs de usuarios.
 * @returns {Promise<Object>} Objeto { [uid]: magnetos_totales }
 */
export const getUsersTotalMagnetos = async (uids) => {
  const db = getDatabase();
  const results = {};
  await Promise.all(
    uids.map(async (uid) => {
      const userRef = ref(db, `users/${uid}/magnetos_totales`);
      const snap = await get(userRef);
      results[uid] = snap.exists() ? snap.val() : 0;
    })
  );
  return results;
};

/**
 * Suma una cantidad de magnetos al usuario en la room (temporal) y al total global.
 * @param {string} roomCode - Código de la sala.
 * @param {string} uid - UID del usuario.
 * @param {number} cantidad - Cantidad de magnetos a sumar.
 * @returns {Promise<void>}
 */
export const addMagnetosToPlayerInRoom = async (roomCode, uid, cantidad) => {
  const db = getDatabase();
  // Sumar al campo temporal en la room
  const playerMagnetosRef = ref(db, `rooms/${roomCode}/players/${uid}/magnetos`);
  await runTransaction(playerMagnetosRef, (currentValue) => {
    return (currentValue || 0) + cantidad;
  });
  // Sumar al total global
  const userTotalRef = ref(db, `users/${uid}/magnetos_totales`);
  await runTransaction(userTotalRef, (currentValue) => {
    return (currentValue || 0) + cantidad;
  });
};

/**
 * Obtiene las claves de OpenAI desde la ruta /config/openai en Firebase Realtime Database.
 * @returns {Promise<{ apiKey: string, assistantId: string }>}
 */
export const getOpenAIKeys = async () => {
  const configRef = ref(database, 'config/openai');
  const snapshot = await get(configRef);
  if (!snapshot.exists()) {
    throw new Error('No se encontraron las claves de OpenAI en Firebase.');
  }
  const { apiKey, assistantId } = snapshot.val();
  if (!apiKey || !assistantId) {
    throw new Error('Faltan apiKey o assistantId en la configuración de OpenAI.');
  }
  return { apiKey, assistantId };
};

// Escuchar en tiempo real los roles de una sala
export const listenRoomRoles = (roomCode, callback) => {
  const db = getDatabase();
  const rolesRef = ref(db, `rooms/${roomCode}/roles`);
  return onValue(rolesRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
};

/**
 * Obtiene los datos completos de un usuario por su UID
 * @param {string} uid - UID del usuario
 * @returns {Promise<Object>} Datos del usuario
 */
export const getUserData = async (uid) => {
  const userRef = ref(database, `users/${uid}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) {
    throw new Error('Usuario no encontrado');
  }
  return { uid, ...snapshot.val() };
};

/**
 * Actualiza los datos básicos del perfil de usuario
 * @param {string} uid - UID del usuario
 * @param {Object} userData - Datos a actualizar
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (uid, userData) => {
  const userRef = ref(database, `users/${uid}`);
  await update(userRef, {
    ...userData,
    fecha_actualizacion: new Date().toISOString(),
  });
};

/**
 * Sube una imagen de perfil a Firebase Storage y actualiza la URL en el perfil
 * @param {string} uid - UID del usuario
 * @param {File|Blob} imageFile - Archivo de imagen
 * @returns {Promise<string>} URL de la imagen subida
 */
export const uploadProfileImage = async (uid, imageFile) => {
  try {
    // Crear referencia única para la imagen
    const imageRef = storageRef(storage, `profile-images/${uid}/${Date.now()}`);
    
    // Subir la imagen
    const snapshot = await uploadBytes(imageRef, imageFile);
    
    // Obtener la URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Actualizar la URL en el perfil del usuario
    await updateUserProfile(uid, { photoURL: downloadURL });
    
    // También actualizar en Firebase Auth si es posible
    const auth = getAuth();
    if (auth.currentUser && auth.currentUser.uid === uid) {
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
    }
    
    return downloadURL;
  } catch (error) {
    console.error('Error al subir imagen de perfil:', error);
    throw error;
  }
};

/**
 * Actualiza el email del usuario en Authentication y Database
 * @param {string} uid - UID del usuario
 * @param {string} newEmail - Nuevo email
 * @param {string} currentPassword - Contraseña actual para reautenticación
 * @returns {Promise<void>}
 */
export const updateUserEmail = async (uid, newEmail, currentPassword) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user || user.uid !== uid) {
    throw new Error('Usuario no autenticado');
  }
  
  try {
    // Reautenticar al usuario
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Actualizar email en Authentication
    await updateEmail(user, newEmail);
    
    // Actualizar email en Database
    await updateUserProfile(uid, { email: newEmail });
    
  } catch (error) {
    console.error('Error al actualizar email:', error);
    throw error;
  }
};

/**
 * Actualiza la contraseña del usuario
 * @param {string} uid - UID del usuario
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<void>}
 */
export const updateUserPassword = async (uid, currentPassword, newPassword) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user || user.uid !== uid) {
    throw new Error('Usuario no autenticado');
  }
  
  try {
    // Reautenticar al usuario
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Actualizar contraseña
    await updatePassword(user, newPassword);
    
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    throw error;
  }
};

/**
 * Elimina la imagen de perfil actual del usuario
 * @param {string} uid - UID del usuario
 * @param {string} photoURL - URL de la imagen a eliminar
 * @returns {Promise<void>}
 */
export const deleteProfileImage = async (uid, photoURL) => {
  try {
    // Eliminar imagen de Storage si existe
    if (photoURL && photoURL.includes('firebase')) {
      const imageRef = storageRef(storage, photoURL);
      await deleteObject(imageRef);
    }
    
    // Actualizar perfil para remover la URL
    await updateUserProfile(uid, { photoURL: null });
    
    // También actualizar en Firebase Auth
    const auth = getAuth();
    if (auth.currentUser && auth.currentUser.uid === uid) {
      await updateProfile(auth.currentUser, { photoURL: null });
    }
    
  } catch (error) {
    console.error('Error al eliminar imagen de perfil:', error);
    throw error;
  }
};

/**
 * Busca si un usuario está en alguna sala activa y devuelve la info de la sala y el jugador.
 * @param {string} uid - UID del usuario
 * @returns {Promise<{roomCode: string, roomData: object, playerData: object} | null>}
 */
export const getUserActiveRoom = async (uid) => {
  const db = getDatabase();
  const roomsRef = ref(db, 'rooms');
  const snapshot = await get(roomsRef);
  if (!snapshot.exists()) return null;
  const rooms = snapshot.val();
  for (const code in rooms) {
    const room = rooms[code];
    if (room.players && room.players[uid]) {
      return { roomCode: code, roomData: room, playerData: room.players[uid] };
    }
  }
  return null;
};

export { app, storage, auth };
