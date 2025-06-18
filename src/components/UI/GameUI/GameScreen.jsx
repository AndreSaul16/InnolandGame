import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import {
  listenGameState,
  updateGameState,
  getRoomPlayers,
  deleteRoom,
  updateRoomStatus,
  listenRoomPlayers,
  getChallengeByQR,
  listenLastGameForUser,
  takeRole,
  addMagnetosToUser,
  leaveRoom,
  addMagnetosToPlayerInRoom,
} from "../../../services/FirebaseDataService";
import { getDatabase, ref, get, set, onValue } from 'firebase/database';
import ChallengeUI from "../ChallengeUI";
import CameraOpener from "../CameraOpener";
import { useRoute, useNavigation } from "@react-navigation/native";
import ScoreBoard from "./ScoreBoard";
import { COLORS, FONTS } from '../../../theme';
import { XMarkIcon } from "react-native-heroicons/solid";
import EndGameButton from "./EndGameButton";
import ValidationChallenge, { validateChallengeAnswer } from '../../challenges/ValidationChallenge';
import GameEventModal from './GameEventModal';
import { PLAYER_ROLES_DATA } from '../../../data/gameState';
import RoleList from '../RolePicker/RoleList';

// GameScreen.jsx
// Componente principal de la partida: escucha el estado del juego en tiempo real, inicializa el juego si es host y gestiona toda la UI y lógica de la partida en curso.

// Función para obtener todos los eventos desde Firebase
const fetchGameEvents = async () => {
  const db = getDatabase();
  const eventsRef = ref(db, 'gameEvents');
  const snapshot = await get(eventsRef);
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  // Si es un array, lo devolvemos tal cual, si es un objeto, lo convertimos a array
  if (Array.isArray(data)) return data;
  return Object.values(data);
};

const GameScreen = (props) => {
  console.log('[GameScreen] Render principal');
  const route = useRoute();
  const navigation = useNavigation();
  const { roomCode, user } = route.params || props;

  // LOGS de depuración para roles
  console.log('[GameScreen] user:', user);
  console.log('[GameScreen] isHost:', user?.isHost);
  console.log('[GameScreen] roomCode:', roomCode);

  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [challengeAnswering, setChallengeAnswering] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [showPlayerJoined, setShowPlayerJoined] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [challengeData, setChallengeData] = useState(null);
  const [challengeError, setChallengeError] = useState(null);
  const [showChallengeErrorModal, setShowChallengeErrorModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeValidationResult, setChallengeValidationResult] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [magnetos, setMagnetos] = useState(user?.magnetos_totales ?? 0);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineModalResult, setOfflineModalResult] = useState(null);
  const [pendingOfflineModal, setPendingOfflineModal] = useState(false);
  const [gameEvents, setGameEvents] = useState([]);

  // Escuchar el estado del juego en tiempo real
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = listenGameState(roomCode, async (state) => {
      // Si el estado de la partida es 'finished', navegamos y no hacemos nada más.
      if (state?.status === 'finished') {
        navigation.replace('ResultsScreen', { roomCode, user });
        return;
      }

      if (state) {
        setGameState(state);
        setLoading(false);
      } else if (user.isHost) {
        setLoading(true);
        const players = await getRoomPlayers(roomCode);
        const firstPlayer = players?.[0] || user;
        const initialGameState = {
          status: "in_progress",
          turn_of: firstPlayer.uid,
          scores: {},
          current_challenge: null,
          players: players.map((p) => ({ uid: p.uid, nombre: p.nombre || p.email })),
        };
        await updateGameState(roomCode, initialGameState);
      } else {
        setLoading(true);
      }
    });

    return () => unsubscribe();
  }, [roomCode, user, navigation]);

  // Sincronizar jugadores de la sala con gameState.players
  useEffect(() => {
    if (!roomCode || !gameState) return;
    const unsubscribe = listenRoomPlayers(roomCode, async (playersList) => {
      // Si hay jugadores nuevos que no están en gameState.players, los agregamos
      const currentUids = (gameState.players || []).map(p => p.uid);
      const newPlayers = playersList.filter(p => !currentUids.includes(p.uid));
      // --- NUEVO: Si hay jugadores que ya no están en playersList, los eliminamos de gameState.players ---
      const updatedPlayers = playersList.map(p => ({
        uid: p.uid,
        nombre: p.nombre || p.username || p.email,
        role: p.role,
      }));
      if (
        newPlayers.length > 0 ||
        (gameState.players && gameState.players.length !== updatedPlayers.length)
      ) {
        // Mostrar animación para el primer nuevo jugador
        if (newPlayers.length > 0) {
          setNewPlayerName(newPlayers[0].nombre || newPlayers[0].username || newPlayers[0].email);
          setShowPlayerJoined(true);
          setTimeout(() => setShowPlayerJoined(false), 2000);
        }
        // Actualizar gameState.players para reflejar la lista real
        await updateGameState(roomCode, { ...gameState, players: updatedPlayers });
      }
    });
    return () => unsubscribe && unsubscribe();
  }, [roomCode, gameState]);

  // Escuchar en tiempo real los cambios en los jugadores de la room (incluido magnetos)
  useEffect(() => {
    if (!roomCode) return;
    const unsubscribe = listenRoomPlayers(roomCode, (players) => {
      setRoomPlayers(players);
    });
    return () => unsubscribe && unsubscribe();
  }, [roomCode]);

  // Al montar, obtener los eventos de la base de datos
  useEffect(() => {
    let isMounted = true;
    fetchGameEvents().then(events => {
      if (isMounted) setGameEvents(events);
    });
    return () => { isMounted = false; };
  }, []);

  // Handler para escanear QR (solo si es el turno del usuario)
  const handleBarCodeScanned = useCallback(
    async ({ data }) => {
      console.log('[GameScreen] handleBarCodeScanned llamado con data:', data);
      if (!gameState || gameState.turn_of !== user.uid) {
        console.log('[GameScreen] No es el turno del usuario o gameState no disponible');
        return;
      }
      // Detectar si es una carta offline
      let isOfflineCard = false;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'offline') isOfflineCard = true;
      } catch (e) {
        if (data.trim().toLowerCase() === 'offline' || data.startsWith('offline')) {
          isOfflineCard = true;
        }
      }
      if (isOfflineCard) {
        setPendingOfflineModal(true); // Marcar que hay que mostrar el modal
        navigation.goBack(); // Cerrar la cámara
        return;
      }
      setChallengeData(null);
      setChallengeError(null);
      try {
        console.log('[GameScreen] Buscando reto en Firebase para QR:', data);
        const reto = await getChallengeByQR(data);
        if (reto) {
          console.log('[GameScreen] Reto encontrado en Firebase:', reto);
          console.log('[GameScreen] Navegando a ChallengeUI con reto:', reto, 'y user:', user);
          navigation.navigate('ChallengeUI', {
            challenge: reto,
            user: { ...user, roomCode },
          });
          // Actualiza el estado del juego con el QR escaneado
          await updateGameState(roomCode, {
            current_challenge: {
              ...gameState.current_challenge,
              qr_id: data,
              status: "pending_answer",
            },
          });
          console.log('[GameScreen] Estado del juego actualizado con QR escaneado');
        } else {
          console.log('[GameScreen] Reto NO encontrado para este QR:', data);
          setChallengeError('Reto no encontrado para este QR.');
          setShowChallengeErrorModal(true);
        }
      } catch (err) {
        console.log('[GameScreen] Error buscando el reto en Firebase:', err);
        setChallengeError('Error buscando el reto en Firebase.');
        setShowChallengeErrorModal(true);
      }
      setChallengeAnswering(true);
    },
    [gameState, roomCode, user, navigation]
  );

  // Handler para responder el reto y validar con IA
  const handleChallengeAnswered = useCallback(
    async (userInput) => {
      console.log('[GameScreen] handleChallengeAnswered llamado. userInput:', userInput);
      if (!gameState || gameState.turn_of !== user.uid || !challengeData) return;
      setChallengeLoading(true);
      setChallengeValidationResult(null);
      try {
        console.log('[GameScreen] Validando respuesta con OpenAI...');
        // Validar usando la IA
        const result = await validateChallengeAnswer(
          challengeData.criteria,
          userInput,
          user.rol || user.role || 'Jugador'
        );
        setChallengeValidationResult(result);
        console.log('[GameScreen] Resultado de validación OpenAI:', result);
        // Actualizar puntuación solo si es correcto
        const scoreDelta = result.isCorrect ? (challengeData.score || 1) : 0;
        const newScores = {
          ...gameState.scores,
          [user.uid]: (gameState.scores?.[user.uid] || 0) + scoreDelta,
        };
        await updateGameState(roomCode, {
          current_challenge: {
            ...gameState.current_challenge,
            status: result.isCorrect ? "answered_correctly" : "answered_incorrectly",
          },
          scores: newScores,
        });
        console.log('[GameScreen] Estado del juego actualizado tras responder reto. scoreDelta:', scoreDelta);
      } catch (e) {
        setChallengeValidationResult({ isCorrect: false, feedback: 'Error validando con IA.' });
        console.log('[GameScreen] Error al validar con OpenAI:', e);
      }
      setChallengeLoading(false);
    },
    [gameState, roomCode, user, challengeData]
  );

  // Handler para terminar la partida (solo host)
  const handleEndGame = async () => {
    console.log('[GameScreen] handleEndGame llamado');
    try {
      await updateRoomStatus(roomCode, 'finished');
      // Obtener los jugadores actualizados con sus magnetos
      const players = await getRoomPlayers(roomCode);
      // Guardar el estado final de la partida incluyendo los jugadores
      await updateGameState(roomCode, { ...gameState, status: 'finished', players });
      console.log('[GameScreen] Estado de sala y game_state actualizado a finished');
      navigation.replace('ResultsScreen', { roomCode, user });
    } catch (error) {
      console.error('[GameScreen] Error al terminar la partida:', error);
      alert('Error al terminar la partida: ' + error.message);
    }
  };

  // Handler para salir de la partida (invitado)
  const handleLeaveGame = async () => {
    setShowLeaveModal(false);
    // 1. Eliminar al jugador de la sala en Firebase
    await leaveRoom(roomCode, user.uid);
    // 2. Actualizar el gameState eliminando al jugador de la lista y pasando el turno si era necesario
    if (gameState && gameState.players) {
      const updatedPlayers = gameState.players.filter(p => p.uid !== user.uid);
      let newTurnOf = gameState.turn_of;
      // Si el turno era del jugador que se va, pasar el turno al siguiente
      if (gameState.turn_of === user.uid && updatedPlayers.length > 0) {
        // Buscar el índice del jugador que se va
        const idx = gameState.players.findIndex(p => p.uid === user.uid);
        // El siguiente jugador (circular)
        const nextIdx = idx % updatedPlayers.length;
        newTurnOf = updatedPlayers[nextIdx].uid;
      }
      await updateGameState(roomCode, {
        ...gameState,
        players: updatedPlayers,
        turn_of: newTurnOf,
      });
    }
    navigation.replace('Home', { user });
  };

  // Handler para terminar turno (solo si es mi turno)
  const handleEndTurn = async () => {
    if (!gameState || !isMyTurn) return;
    const players = gameState.players || [];
    const currentIndex = players.findIndex(p => p.uid === user.uid);
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayerUid = players[nextIndex].uid;
    console.log('[GameScreen] Cambiando de turno. Turno actual:', user.uid, 'Siguiente turno:', nextPlayerUid);
    await updateGameState(roomCode, {
      ...gameState,
      turn_of: nextPlayerUid,
      current_challenge: null, // Opcional: limpia el reto actual
    });
  };

  // Listener para navegar a ResultsScreen si el estado es 'finished'
  useEffect(() => {
    console.log('[GameScreen] useEffect de gameState/status', gameState?.status);
    if (gameState && gameState.status === 'finished') {
      console.log('[GameScreen] Navegando a ResultsScreen');
      navigation.replace('ResultsScreen', { roomCode, user, players: roomPlayers });
    }
  }, [gameState, navigation, roomCode, user, roomPlayers]);

  // Listener en tiempo real para magnetos_totales
  useEffect(() => {
    console.log('[Magnetos][useEffect] user:', user);
    if (!user?.uid) {
      console.warn('[Magnetos][useEffect] UID no definido, no se monta el listener');
      return;
    }
    const db = getDatabase();
    const userRef = ref(db, `users/${user.uid}/magnetos_totales`);
    console.log(`[Magnetos][useEffect] Montando listener para UID: ${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const value = snapshot.val();
      console.log(`[Magnetos][onValue] Valor recibido de Firebase para UID ${user.uid}:`, value);
      setMagnetos(value ?? 0);
    });
    return () => {
      console.log(`[Magnetos][useEffect] Desmontando listener para UID: ${user.uid}`);
      unsubscribe();
    };
  }, [user?.uid]);

  // 4) Lógica para disparar eventos aleatorios (solo host)
  useEffect(() => {
    if (!user?.isHost || !gameState || !roomPlayers.length || !gameEvents.length) return;
    let timeoutId;
    const triggerRandomEvent = async () => {
      // Elegir evento aleatorio de la base de datos
      const total = gameEvents.length;
      const randomFloat = Math.random() * total;
      const randomIndex = Math.floor(randomFloat);
      const event = gameEvents[randomIndex];
      setCurrentEvent(event);
      setEventModalVisible(true);
    };
    // Disparar evento cada 2-3 minutos (aleatorio)
    const scheduleEvent = () => {
      const delay = 120000 + Math.random() * 60000; // 2-3 minutos
      timeoutId = setTimeout(() => {
        triggerRandomEvent();
      }, delay);
    };
    scheduleEvent();
    return () => clearTimeout(timeoutId);
  }, [user?.isHost, gameState, roomPlayers.length, gameEvents]);

  // 5) Al cerrar el modal, aplicar el efecto del evento
  const handleCloseEventModal = async () => {
    setEventModalVisible(false);
    if (currentEvent) {
      // Lógica dinámica según el tipo de evento
      if (currentEvent.type === 'detrimental') {
        // Ejemplo: restar 5 magnetos a todos los jugadores
        const { addMagnetosToPlayerInRoom } = require('../../../services/FirebaseDataService');
        await Promise.all(
          roomPlayers.map(async (p) => {
            await addMagnetosToPlayerInRoom(roomCode, p.uid, -5);
          })
        );
      } else if (currentEvent.type === 'beneficial') {
        // Ejemplo: sumar 5 magnetos a todos los jugadores
        const { addMagnetosToPlayerInRoom } = require('../../../services/FirebaseDataService');
        await Promise.all(
          roomPlayers.map(async (p) => {
            await addMagnetosToPlayerInRoom(roomCode, p.uid, 5);
          })
        );
      }
      // Aquí puedes añadir más tipos de eventos y su lógica
    }
    setCurrentEvent(null);
  };

  // Mostrar el modal de carta offline al volver de la cámara
  useEffect(() => {
    if (pendingOfflineModal) {
      console.log('[GameScreen] useEffect pendingOfflineModal: activando showOfflineModal');
      setShowOfflineModal(true);
      setPendingOfflineModal(false);
    }
  }, [pendingOfflineModal]);

  if (loading) {
    console.log('[GameScreen] Renderizando: loading...');
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.darkBlue, fontFamily: FONTS.text }}>Cargando partida...</Text>
      </View>
    );
  }

  if (!gameState) {
    console.log('[GameScreen] Renderizando: gameState no disponible');
    return (
      <View style={styles.centered}>
        <Text style={{ color: COLORS.error, fontWeight: "bold", fontFamily: FONTS.text }}>
          Error: No se pudo cargar el estado del juego.
        </Text>
      </View>
    );
  }

  // Obtener el nombre del jugador actual
  const currentPlayer = gameState.players?.find(p => p.uid === gameState.turn_of);
  const currentPlayerName = currentPlayer ? currentPlayer.nombre : 'Jugador';
  const isMyTurn = gameState.turn_of === user.uid;
  console.log('[GameScreen] Render: isMyTurn =', isMyTurn, ', current_challenge?.qr_id =', gameState.current_challenge?.qr_id, ', challengeData =', challengeData, ', challengeError =', challengeError);

  // --- Lógica para el contenido del Modal ---
  const isHost = user.isHost;
  const modalTitle = isHost ? "Terminar Partida" : "Salir de la Partida";
  const modalText = isHost
    ? "¿Seguro que quieres terminar la partida para todos? Esto llevará a la pantalla de resultados."
    : "¿Seguro que quieres abandonar la partida?";
  const onConfirmAction = isHost ? handleEndGame : handleLeaveGame;

  // --- NUEVO: Renderizado condicional para host/invitado ---
  if (!isHost) {
    // Vista para jugadores que NO son host
    return (
      <View style={styles.container}>
        {/* Botón de salir */}
        <TouchableOpacity
          onPress={() => setShowLeaveModal(true)}
          style={styles.closeButton}
          activeOpacity={0.7}
          accessibilityLabel="Salir de la partida"
        >
          <XMarkIcon size={28} color="white" />
        </TouchableOpacity>

        <Modal
          visible={showLeaveModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLeaveModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Salir de la Partida</Text>
              <Text style={styles.modalText}>¿Seguro que quieres abandonar la partida?</Text>
              <View style={styles.modalButtons}>
                <Pressable style={styles.cancelButton} onPress={() => setShowLeaveModal(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.confirmButton} onPress={handleLeaveGame}>
                  <Text style={styles.confirmText}>Salir</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Mensaje de sala */}
        <Text style={{ marginTop: 60, fontSize: 20, color: COLORS.darkBlue, fontFamily: FONTS.title, textAlign: 'center', marginBottom: 16 }}>
          Estás jugando en la sala {roomCode}
        </Text>
        {/* Scoreboard */}
        <ScoreBoard
          players={roomPlayers}
          currentTurnUid={gameState.turn_of}
        />
      </View>
    );
  }

  // Vista para el host (tablero completo)
  return (
    <View style={styles.container}>
      {/* ===== UN SOLO BOTÓN Y UN SOLO MODAL PARA TODOS ===== */}
      <TouchableOpacity
        onPress={() => {
          console.log('[GameScreen] Botón cerrar/terminar partida pulsado');
          setShowLeaveModal(true);
        }}
        style={styles.closeButton}
        activeOpacity={0.7}
        accessibilityLabel={isHost ? "Terminar la partida" : "Salir de la partida"}
      >
        <XMarkIcon size={28} color="white" />
      </TouchableOpacity>

      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalText}>{modalText}</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setShowLeaveModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={onConfirmAction}>
                <Text style={styles.confirmText}>{isHost ? "Terminar" : "Salir"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* ===== FIN DEL BLOQUE UNIFICADO ===== */}

      <Text style={styles.turnText}>
        Es el turno de: <Text style={styles.currentPlayer}>{currentPlayerName}</Text>
      </Text>
      {/* El host siempre ve los botones, sin importar el turno */}
      {!gameState.current_challenge?.qr_id && (
        <Button color={COLORS.primary} title="Escanear QR" onPress={() => {
          console.log('[GameScreen] Botón Escanear QR pulsado. Navegando a CameraScreen con user:', user);
          navigation.navigate('CameraScreen', {
            onBarCodeScanned: handleBarCodeScanned,
            user,
          });
        }} />
      )}
      {/* Mostrar puntuaciones con ScoreBoard */}
      <ScoreBoard
        players={roomPlayers}
        currentTurnUid={gameState.turn_of}
      />
      {/* Botón de terminar turno (el host siempre lo ve) */}
      <TouchableOpacity
        style={styles.endTurnButton}
        onPress={handleEndTurn}
        activeOpacity={0.8}
      >
        <Text style={styles.endTurnButtonText}>Terminar turno</Text>
      </TouchableOpacity>

      {/* ===== BOTÓN FLOTANTE PARA VER JUGADORES ===== */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          left: 20,
          top: 56,
          backgroundColor: COLORS.blue,
          borderRadius: 9999,
          width: 48,
          height: 48,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
          elevation: 8,
        }}
        onPress={() => setShowPlayersModal(true)}
        accessibilityLabel="Ver jugadores"
        activeOpacity={0.8}
      >
        <Text style={{ color: COLORS.white, fontSize: 24, fontWeight: 'bold' }}>👥</Text>
      </TouchableOpacity>

      {/* ===== MODAL DE JUGADORES ===== */}
      <Modal
        visible={showPlayersModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlayersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { width: 340, maxHeight: 420 }]}> 
            <Text style={styles.modalTitle}>Jugadores en la partida</Text>
            <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center' }}>
              {(roomPlayers || []).map((p) => (
                <Text
                  key={p.uid}
                  style={{
                    fontSize: 18,
                    color: p.uid === user.uid ? COLORS.primary : COLORS.darkBlue,
                    fontWeight: p.uid === user.uid ? 'bold' : 'normal',
                    fontFamily: FONTS.text,
                    marginVertical: 6,
                  }}
                >
                  {p.nombre || p.username || p.email} {p.uid === user.uid ? '(Tú)' : ''}
                  {p.role ? `  ·  ${p.role}` : ''}
                </Text>
              ))}
            </ScrollView>
            <Pressable style={[styles.cancelButton, { marginTop: 16 }]} onPress={() => setShowPlayersModal(false)}>
              <Text style={styles.cancelText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ANIMACIÓN: Nuevo jugador se ha unido */}
      <Modal
        visible={showPlayerJoined}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlayerJoined(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { alignItems: 'center', justifyContent: 'center', width: 260, height: 160 }]}> 
            <Text style={{ fontSize: 22, color: COLORS.primary, fontFamily: FONTS.title, marginBottom: 12, textAlign: 'center' }}>
              ¡Nuevo jugador se ha unido!
            </Text>
            <Text style={{ fontSize: 20, color: COLORS.blue, fontFamily: FONTS.text, fontWeight: 'bold', textAlign: 'center' }}>
              {newPlayerName}
            </Text>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ERROR DE RETO NO ENCONTRADO */}
      <Modal
        visible={showChallengeErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChallengeErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { alignItems: 'center', justifyContent: 'center', width: 280 }]}> 
            <Text style={{ fontSize: 20, color: COLORS.error, fontFamily: FONTS.title, marginBottom: 16, textAlign: 'center' }}>
              Reto no encontrado
            </Text>
            <Text style={{ fontSize: 16, color: COLORS.darkBlue, fontFamily: FONTS.text, textAlign: 'center', marginBottom: 20 }}>
              No se ha encontrado un reto para el QR escaneado. Por favor, intenta con otro QR.
            </Text>
            <Pressable style={styles.confirmButton} onPress={() => { setShowChallengeErrorModal(false); setChallengeError(null); }}>
              <Text style={styles.confirmText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL DE EVENTO ALEATORIO */}
      <GameEventModal
        visible={eventModalVisible}
        event={currentEvent}
        onClose={handleCloseEventModal}
      />

      {/* Mostrar el modal de carta offline como overlay */}
      {showOfflineModal && (
        <OfflineCardModalLocal
          visible={showOfflineModal}
          onClose={() => {
            setShowOfflineModal(false);
            setScanning(false);
          }}
          onResult={async (wasCorrect) => {
            setOfflineModalResult(wasCorrect);
            if (wasCorrect && user?.uid && roomCode) {
              try {
                await addMagnetosToPlayerInRoom(roomCode, user.uid, 10);
              } catch (e) {
                console.error('Error al sumar magnetos por carta offline:', e);
              }
            }
          }}
          playerName={user?.nombre || user?.username || user?.email}
        />
      )}
    </View>
  );
};

const OfflineCardModalLocal = ({ visible, onClose, onResult, playerName }) => {
  React.useEffect(() => {
    console.log('[OfflineCardModalLocal] visible:', visible);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: 320, alignItems: 'center', elevation: 8 }}>
          <Text style={{ color: COLORS.primary, fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
            ¿Has respondido correctamente este reto?
          </Text>
          {playerName && (
            <Text style={{ color: COLORS.text, fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
              Jugador: <Text style={{ color: COLORS.secondary, fontWeight: 'bold' }}>{playerName}</Text>
            </Text>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <TouchableOpacity
              style={{ flex: 1, marginHorizontal: 8, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.success }}
              onPress={() => { onResult(true); onClose(); }}
            >
              <Text style={{ color: COLORS.buttonText || '#fff', fontSize: 16, fontWeight: 'bold' }}>Sí</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, marginHorizontal: 8, paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.error }}
              onPress={() => { onResult(false); onClose(); }}
            >
              <Text style={{ color: COLORS.buttonText || '#fff', fontSize: 16, fontWeight: 'bold' }}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
  },
  closeButton: {
    position: 'absolute',
    zIndex: 10,
    top: 56,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    // Sombra solo en móvil
    ...((typeof window === 'undefined' || window.navigator?.product !== 'ReactNativeWeb') ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 8,
    } : {}),
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  turnText: {
    fontSize: 20,
    marginBottom: 16,
    color: COLORS.darkBlue,
    fontFamily: FONTS.title,
    textAlign: 'center',
  },
  currentPlayer: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontFamily: FONTS.title,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: FONTS.title,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    marginLeft: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontFamily: FONTS.text,
    fontSize: 16,
  },
  confirmText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontFamily: FONTS.text,
    fontSize: 16,
  },
  endTurnButton: {
    marginTop: 16,
    backgroundColor: COLORS.blue,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    elevation: 2,
  },
  endTurnButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
  },
});

export default GameScreen; 
