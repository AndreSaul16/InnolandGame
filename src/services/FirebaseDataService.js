import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getDatabase, ref, set, push, onValue, update, get, child, remove, runTransaction } from 'firebase/database';
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

// Crea una sala y añade al usuario como anfitrión y primer jugador
export const createRoom = async (hostUser) => {
  let code;
  let exists = true;
  // Asegura que el código sea único
  while (exists) {
    code = generateRoomCode();
    const snapshot = await get(ref(database, `rooms/${code}`));
    exists = snapshot.exists();
  }
  const roomRef = ref(database, `rooms/${code}`);
  await set(roomRef, {
    code,
    status: 'waiting',
    host: hostUser,
    players: {
      [hostUser.uid]: {
        ...hostUser,
        uid: hostUser.uid,
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
  const roomRef = ref(database, `rooms/${code}`);
  const snapshot = await get(roomRef);
  if (!snapshot.exists()) {
    throw new Error('La sala no existe');
  }
  const playerRef = ref(database, `rooms/${code}/players/${user.uid}`);
  await set(playerRef, {
    ...user,
    uid: user.uid,
    joinedAt: Date.now(),
    isHost: false,
    magnetos: 0, // Inicializa el contador temporal
  });
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

// Guarda la información de la última partida para un usuario
export const saveLastGameForUser = async (uid, lastGameData) => {
  const userLastGameRef = ref(database, `users/${uid}/lastGame`);
  await set(userLastGameRef, lastGameData);
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

export { app };
