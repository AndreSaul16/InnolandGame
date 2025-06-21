import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Animated,
  Easing,
  Platform,
  StatusBar,
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
import { getDatabase, ref, get, set, onValue } from "firebase/database";
import ChallengeUI from "../ChallengeUI";
import CameraOpener from "../CameraOpener";
import { useRoute, useNavigation } from "@react-navigation/native";
import ScoreBoard from "./ScoreBoard";
import { COLORS, FONTS } from "../../../theme";
import { useScreenSize, getScrollViewStyles } from "../../../utils/useScreenSize";
import {
  XMarkIcon,
  QrCodeIcon,
  UserGroupIcon,
  PlayIcon,
  StopIcon,
  ClockIcon,
} from "react-native-heroicons/solid";
import EndGameButton from "./EndGameButton";
import ValidationChallenge, {
  validateChallengeAnswer,
} from "../../challenges/ValidationChallenge";
import GameEventModal from "./GameEventModal";
import { PLAYER_ROLES_DATA } from "../../../data/gameState";
import RoleList from "../RolePicker/RoleList";
import OfflineCardModal from "./OfflineCardModal";
import ActionEventModal from "./ActionEventModal";

// GameScreen.jsx
// Componente principal de la partida: escucha el estado del juego en tiempo real, inicializa el juego si es host y gestiona toda la UI y lógica de la partida en curso.

// Función para obtener todos los eventos desde Firebase
const fetchGameEvents = async () => {
  // Obtiene la referencia a la base de datos de Firebase
  const db = getDatabase();
  const eventsRef = ref(db, "gameEvents");
  // Obtiene el snapshot de los eventos
  const snapshot = await get(eventsRef);
  console.log(
    "[LOG][GameEvent] fetchGameEvents: snapshot.exists =",
    snapshot.exists()
  );
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  console.log("[LOG][GameEvent] fetchGameEvents: data =", data);
  // Si es un array, lo devolvemos tal cual, si es un objeto, lo convertimos a array
  if (Array.isArray(data)) return data;
  return Object.values(data);
};

const GameScreen = (props) => {
  // Render principal del componente
  console.log("[GameScreen] Render principal");
  const route = useRoute(); // Hook para obtener la ruta actual
  const navigation = useNavigation(); // Hook para navegación
  const { roomCode, user } = route.params || props; // Obtiene el código de sala y usuario desde navegación o props

  // Hook para detectar tamaño de pantalla
  const screenSize = useScreenSize();
  const scrollViewStyles = getScrollViewStyles(screenSize.needsScroll);

  // LOGS de depuración para roles
  console.log("[GameScreen] user:", user);
  console.log("[GameScreen] isHost:", user?.isHost);
  console.log("[GameScreen] roomCode:", roomCode);

  // Definición de estados locales para controlar la UI y la lógica del juego
  const [gameState, setGameState] = useState(null); // Estado del juego en tiempo real
  const [loading, setLoading] = useState(true); // Estado de carga
  const [scanning, setScanning] = useState(false); // Estado de escaneo QR
  const [challengeAnswering, setChallengeAnswering] = useState(false); // Estado de respuesta de reto
  const [showLeaveModal, setShowLeaveModal] = useState(false); // Modal para salir de la partida
  const [showPlayersModal, setShowPlayersModal] = useState(false); // Modal para ver jugadores
  const [showPlayerJoined, setShowPlayerJoined] = useState(false); // Animación de nuevo jugador
  const [newPlayerName, setNewPlayerName] = useState(""); // Nombre del nuevo jugador
  const [challengeData, setChallengeData] = useState(null); // Datos del reto actual
  const [challengeError, setChallengeError] = useState(null); // Error al buscar reto
  const [showChallengeErrorModal, setShowChallengeErrorModal] = useState(false); // Modal de error de reto
  const [showChallengeModal, setShowChallengeModal] = useState(false); // Modal de reto
  const [challengeValidationResult, setChallengeValidationResult] =
    useState(null); // Resultado de validación de reto
  const [challengeLoading, setChallengeLoading] = useState(false); // Estado de carga de reto
  const [magnetos, setMagnetos] = useState(user?.magnetos_totales ?? 0); // Magnetos del usuario
  const [roomPlayers, setRoomPlayers] = useState([]); // Lista de jugadores en la sala
  const [eventModalVisible, setEventModalVisible] = useState(false); // Modal de evento aleatorio
  const [currentEvent, setCurrentEvent] = useState(null); // Evento actual
  const [showOfflineModal, setShowOfflineModal] = useState(false); // Modal de carta offline
  const [offlineModalResult, setOfflineModalResult] = useState(null); // Resultado de carta offline
  const [pendingOfflineModal, setPendingOfflineModal] = useState(false); // Estado pendiente de carta offline
  const [gameEvents, setGameEvents] = useState([]); // Lista de eventos de juego
  const [lastEventTurn, setLastEventTurn] = useState(null); // Último turno en el que se mostró un evento
  const [showActionEventModal, setShowActionEventModal] = useState(false); // Modal para eventos de acción
  const [pendingActionEvent, setPendingActionEvent] = useState(null); // Evento de acción pendiente

  // Animación para modales y botones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  // Escuchar el estado del juego en tiempo real desde Firebase
  useEffect(() => {
    if (!roomCode) return;

    // Suscribe a los cambios del estado del juego
    const unsubscribe = listenGameState(roomCode, async (state) => {
      // Si la partida ha terminado, navega a la pantalla de resultados
      if (state?.status === "finished") {
        console.log(
          "[LOG][GameScreen] Partida finalizada, navegando a resultados..."
        );
        navigation.replace("ResultsScreen", { roomCode, user });
        return;
      }

      if (state) {
        console.log(
          `[LOG][GameScreen] gameState actualizado. Turno de: ${state.turn_of}, Turno número: ${state.turno}`
        );
        setGameState(state); // Actualiza el estado local
        setLoading(false);
      } else if (user.isHost) {
        // Si no hay estado y eres host, inicializa el juego
        console.log("[LOG][GameScreen] Inicializando nuevo estado de juego...");
        const players = await getRoomPlayers(roomCode);
        const firstPlayer = players?.[0] || user;
        const now = Date.now();
        const initialGameState = {
          status: "in_progress",
          turn_of: firstPlayer.uid, // El primer turno es del primer jugador
          scores: {},
          current_challenge: null,
          players: players.map((p) => ({
            uid: p.uid,
            nombre: p.nombre || p.email,
          })),
          turno: 1,
          turnStartTimestamps: { 1: now }, // Marca el inicio del primer turno
          turnDurations: {},
        };
        await updateGameState(roomCode, initialGameState);
      } else {
        setLoading(true);
      }
    });

    return () => {
      console.log("[LOG][GameScreen] Desmontando listener de gameState.");
      unsubscribe(); // Limpia el listener al desmontar
    };
  }, [roomCode, user, navigation]);

  // Sincronizar jugadores de la sala con gameState.players (incluyendo cambios en magnetos)
  useEffect(() => {
    if (!roomCode) return;
    // Escucha cambios en los jugadores de la sala
    const unsubscribe = listenRoomPlayers(roomCode, async (playersList) => {
      // Actualiza siempre el campo players en gameState, aunque solo cambien los magnetos
      if (!gameState) return;
      const updatedPlayers = playersList.map((p) => ({
        uid: p.uid,
        nombre: p.nombre || p.username || p.email,
        role: p.role || null,
        magnetos: p.magnetos ?? 0,
        isHost: p.isHost,
      }));
      // Solo actualiza si hay algún cambio real
      const hasChanged =
        JSON.stringify(gameState.players) !== JSON.stringify(updatedPlayers);
      if (hasChanged) {
        console.log(
          "[LOG][GameScreen] Detectado cambio en jugadores, actualizando gameState.players..."
        );
        await updateGameState(roomCode, {
          ...gameState,
          players: updatedPlayers,
        });
      }
      setRoomPlayers(playersList);
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

  // 1. Carga de eventos desde Firebase
  useEffect(() => {
    let isMounted = true;
    fetchGameEvents()
      .then((events) => {
        if (isMounted) {
          setGameEvents(events);
          console.log(
            "[LOG][GameEvent][PASO 1] Eventos cargados correctamente:",
            events
          );
        }
      })
      .catch((err) => {
        console.error(
          "[LOG][GameEvent][PASO 1][ERROR] Error al cargar eventos:",
          err
        );
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Refuerzo: determinar si el usuario es host usando roomPlayers si es necesario
  let isHost = user.isHost;
  if (typeof isHost === "undefined" && Array.isArray(roomPlayers)) {
    const found = roomPlayers.find((p) => p.uid === user.uid);
    isHost = found?.isHost || false;
  }
  // Refuerzo: siempre que usemos user, aseguramos el flag isHost
  const userWithHostFlag = { ...user, isHost };

  // Handler para escanear QR (solo si es el turno del usuario o si es host)
  const handleBarCodeScanned = useCallback(
    async ({ data }) => {
      // Lógica que se ejecuta al escanear un QR
      console.log("[GameScreen] handleBarCodeScanned llamado con data:", data);
      // LOGS DETALLADOS PARA DEPURACIÓN DE TURNO
      console.log(
        "[GameScreen][DEBUG] user.uid:",
        userWithHostFlag?.uid,
        "| gameState.turn_of:",
        gameState?.turn_of
      );
      console.log(
        "[GameScreen][DEBUG] typeof user.uid:",
        typeof userWithHostFlag?.uid,
        "| typeof gameState.turn_of:",
        typeof gameState?.turn_of
      );
      console.log(
        "[GameScreen][DEBUG] user.uid === gameState.turn_of:",
        userWithHostFlag?.uid === gameState?.turn_of
      );
      console.log("[GameScreen][DEBUG] user.isHost:", userWithHostFlag?.isHost);
      if (!gameState) {
        console.log("[GameScreen] gameState no disponible");
        return;
      }
      // Refuerzo: solo bloquea a los invitados fuera de turno
      if (
        !userWithHostFlag.isHost &&
        gameState.turn_of !== userWithHostFlag.uid
      ) {
        console.log("[GameScreen] No es el turno del usuario (y no es host)");
        return;
      }
      // Detectar si es una carta offline
      let isOfflineCard = false;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "offline") isOfflineCard = true;
      } catch (e) {
        if (
          data.trim().toLowerCase() === "offline" ||
          data.startsWith("offline")
        ) {
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
        console.log("[GameScreen] Buscando reto en Firebase para QR:", data);
        const reto = await getChallengeByQR(data);
        if (reto) {
          console.log("[GameScreen] Reto encontrado en Firebase:", reto);
          console.log(
            "[GameScreen] Navegando a ChallengeUI con reto:",
            reto,
            "y user:",
            userWithHostFlag
          );
          // Obtener el jugador en turno
          const turnoPlayer = gameState.players?.find(
            (p) => p.uid === gameState.turn_of
          ); // <--- Jugador en turno
          console.log(
            `[LOG][GameScreen] PRE-NAVEGACIÓN a ChallengeUI. Jugador en turno detectado: ${turnoPlayer?.nombre} (UID: ${turnoPlayer?.uid})`
          );
          if (!turnoPlayer) {
            console.error(
              "[ERROR][GameScreen] No se pudo encontrar al jugador del turno actual en la lista de jugadores. gameState.turn_of:",
              gameState.turn_of
            );
          }
          navigation.navigate("ChallengeUI", {
            challenge: reto,
            user: { ...userWithHostFlag },
            roomCode,
            turnoPlayerUid: turnoPlayer?.uid, // <--- UID del jugador en turno
            turnoPlayerNombre: turnoPlayer?.nombre, // <--- Nombre del jugador en turno
          });
          // Actualiza el estado del juego con el QR escaneado
          await updateGameState(roomCode, {
            current_challenge: {
              ...gameState.current_challenge,
              qr_id: data,
              status: "pending_answer",
            },
          });
          console.log(
            "[GameScreen] Estado del juego actualizado con QR escaneado"
          );
        } else {
          console.log("[GameScreen] Reto NO encontrado para este QR:", data);
          setChallengeError("Reto no encontrado para este QR.");
          setShowChallengeErrorModal(true);
        }
      } catch (err) {
        console.log("[GameScreen] Error buscando el reto en Firebase:", err);
        setChallengeError("Error buscando el reto en Firebase.");
        setShowChallengeErrorModal(true);
      }
      setChallengeAnswering(true);
    },
    [gameState, roomCode, userWithHostFlag, navigation]
  );

  // Handler para responder el reto y validar con IA
  const handleChallengeAnswered = useCallback(
    async (userInput) => {
      console.log(
        "[GameScreen] handleChallengeAnswered llamado. userInput:",
        userInput
      );
      if (
        !gameState ||
        gameState.turn_of !== userWithHostFlag.uid ||
        !challengeData
      )
        return;
      setChallengeLoading(true);
      setChallengeValidationResult(null);
      try {
        console.log("[GameScreen] Validando respuesta con OpenAI...");
        // Validar usando la IA
        const result = await validateChallengeAnswer(
          challengeData.criteria,
          userInput,
          userWithHostFlag.rol || userWithHostFlag.role || "Jugador"
        );
        setChallengeValidationResult(result);
        console.log("[GameScreen] Resultado de validación OpenAI:", result);
        // Actualizar puntuación solo si es correcto
        const scoreDelta = result.isCorrect ? challengeData.score || 1 : 0;
        const answeredUid = gameState.turn_of; // El UID del jugador que está en turno
        const newScores = {
          ...gameState.scores,
          [answeredUid]: (gameState.scores?.[answeredUid] || 0) + scoreDelta,
        };
        await updateGameState(roomCode, {
          ...gameState,
          current_challenge: {
            ...gameState.current_challenge,
            status: result.isCorrect
              ? "answered_correctly"
              : "answered_incorrectly",
          },
          scores: newScores,
        });
        console.log(
          "[GameScreen] Estado del juego actualizado tras responder reto. scoreDelta:",
          scoreDelta
        );
      } catch (e) {
        setChallengeValidationResult({
          isCorrect: false,
          feedback: "Error validando con IA.",
        });
        console.log("[GameScreen] Error al validar con OpenAI:", e);
      }
      setChallengeLoading(false);
    },
    [gameState, roomCode, userWithHostFlag, challengeData]
  );

  // Handler para terminar la partida (solo host)
  const handleEndGame = async () => {
    console.log("[GameScreen] handleEndGame llamado");
    try {
      await updateRoomStatus(roomCode, "finished");
      // Obtener los jugadores actualizados con sus magnetos
      const players = await getRoomPlayers(roomCode);
      // Guardar el estado final de la partida incluyendo los jugadores
      await updateGameState(roomCode, {
        ...gameState,
        status: "finished",
        players,
      });
      console.log(
        "[GameScreen] Estado de sala y game_state actualizado a finished"
      );
      navigation.replace("ResultsScreen", { roomCode, user });
    } catch (error) {
      console.error("[GameScreen] Error al terminar la partida:", error);
      alert("Error al terminar la partida: " + error.message);
    }
  };

  // Handler para salir de la partida (invitado)
  const handleLeaveGame = async () => {
    setShowLeaveModal(false);
    // 1. Eliminar al jugador de la sala en Firebase
    await leaveRoom(roomCode, userWithHostFlag.uid);
    // 2. Actualizar el gameState eliminando al jugador de la lista y pasando el turno si era necesario
    if (gameState && gameState.players) {
      const updatedPlayers = gameState.players.filter(
        (p) => p.uid !== userWithHostFlag.uid
      );
      let newTurnOf = gameState.turn_of;
      // Si el turno era del jugador que se va, pasar el turno al siguiente
      if (
        gameState.turn_of === userWithHostFlag.uid &&
        updatedPlayers.length > 0
      ) {
        // Buscar el índice del jugador que se va
        const idx = gameState.players.findIndex(
          (p) => p.uid === userWithHostFlag.uid
        );
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
    navigation.replace("Home", { user });
  };

  // Handler para terminar turno (solo si es mi turno o si es host)
  const handleEndTurn = async () => {
    console.log(
      "[GameScreen][handleEndTurn] user.isHost:",
      userWithHostFlag.isHost,
      "| user.uid:",
      userWithHostFlag.uid,
      "| turn_of:",
      gameState?.turn_of
    );
    if (!gameState) return;
    // Refuerzo: solo bloquea a los invitados fuera de turno
    if (
      !userWithHostFlag.isHost &&
      gameState.turn_of !== userWithHostFlag.uid
    ) {
      console.log(
        "[GameScreen][handleEndTurn] No es el turno del usuario (y no es host)"
      );
      return;
    }
    const players = gameState.players || [];
    if (players.length === 0) {
      console.warn(
        "[LOG][GameScreen][handleEndTurn] No hay jugadores en la lista para cambiar de turno."
      );
      return;
    }
    const currentIndex = players.findIndex((p) => p.uid === gameState.turn_of);
    if (currentIndex === -1) {
      console.warn(
        `[LOG][GameScreen][handleEndTurn] El jugador del turno actual (${gameState.turn_of}) no se encuentra en la lista de jugadores. Asignando al primero.`
      );
      const nextPlayerUid = players[0]?.uid;
      if (nextPlayerUid) {
        await updateGameState(roomCode, {
          ...gameState,
          turn_of: nextPlayerUid,
        });
      }
      return;
    }
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayerUid = players[nextIndex].uid;

    // --- REGISTRO DE TIEMPOS DE TURNO ---
    const now = Date.now();
    const turnoActual = gameState.turno || 1;
    // Copias defensivas para no mutar el estado original
    const turnStartTimestamps = { ...(gameState.turnStartTimestamps || {}) };
    const turnDurations = { ...(gameState.turnDurations || {}) };
    // Logs de depuración
    console.log("[DEBUG][TURNO] handleEndTurn ejecutado");
    console.log("[DEBUG][TURNO] turnStartTimestamps:", turnStartTimestamps);
    console.log("[DEBUG][TURNO] turnoActual:", turnoActual);
    console.log("[DEBUG][TURNO] now:", now);
    // Si existe timestamp de inicio para el turno actual, calculamos duración
    let mostrarEventoDetrimental = false;
    if (turnStartTimestamps[turnoActual]) {
      turnDurations[turnoActual] = now - turnStartTimestamps[turnoActual];
      // Formatear tiempo
      const duracionMs = turnDurations[turnoActual];
      const minutos = Math.floor(duracionMs / 60000);
      const segundos = Math.floor((duracionMs % 60000) / 1000);
      const milisegundos = duracionMs % 1000;
      // Obtener nombre del jugador
      const jugador = (gameState.players || []).find(
        (p) => p.uid === gameState.turn_of
      );
      const nombreJugador = jugador
        ? jugador.nombre || jugador.username || jugador.email || "Desconocido"
        : "Desconocido";
      // Log legible
      console.log(
        `[TURNO] El jugador ${nombreJugador} (${gameState.turn_of}) tardó ${
          minutos > 0 ? minutos + " min, " : ""
        }${segundos} seg y ${milisegundos} ms en el turno ${turnoActual}`
      );
      // Si el turno duró más de 5 minutos, marcar para mostrar evento detrimental
      if (duracionMs > 300000) {
        mostrarEventoDetrimental = true;
      }
    } else {
      console.log(
        `[TURNO] No se encontró timestamp de inicio para el turno ${turnoActual}`
      );
    }
    // Guardamos el timestamp de inicio para el nuevo turno
    const nextTurnNumber = turnoActual + 1;
    turnStartTimestamps[nextTurnNumber] = now;
    // --- FIN REGISTRO DE TIEMPOS ---

    // Mostrar evento detrimental si corresponde
    if (mostrarEventoDetrimental && gameEvents && Array.isArray(gameEvents)) {
      const detrimentalEvents = gameEvents.filter(
        (ev) => ev.type === "detrimental"
      );
      if (detrimentalEvents.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * detrimentalEvents.length
        );
        setCurrentEvent(detrimentalEvents[randomIndex]);
        setEventModalVisible(true);
        console.log(
          "[EVENTO] Mostrando evento detrimental por turno largo:",
          detrimentalEvents[randomIndex]
        );
      } else {
        console.log("[EVENTO] No hay eventos de tipo detrimental disponibles.");
      }
    }

    console.log(
      `[LOG][GameScreen] Cambiando de turno. Jugador actual: ${gameState.players[currentIndex]?.nombre} (${gameState.turn_of}). Próximo jugador: ${players[nextIndex]?.nombre} (${nextPlayerUid})`
    );
    await updateGameState(roomCode, {
      ...gameState,
      turn_of: nextPlayerUid,
      current_challenge: null, // Opcional: limpia el reto actual
      turno: nextTurnNumber,
      turnStartTimestamps,
      turnDurations,
    });
  };

  // Listener para navegar a ResultsScreen si el estado es 'finished'
  useEffect(() => {
    console.log(
      "[GameScreen] useEffect de gameState/status",
      gameState?.status
    );
    if (gameState && gameState.status === "finished") {
      console.log("[GameScreen] Navegando a ResultsScreen");
      navigation.replace("ResultsScreen", {
        roomCode,
        user,
        players: roomPlayers,
      });
    }
  }, [gameState, navigation, roomCode, user, roomPlayers]);

  // Listener en tiempo real para magnetos_totales
  useEffect(() => {
    console.log("[Magnetos][useEffect] user:", user);
    if (!user?.uid) {
      console.warn(
        "[Magnetos][useEffect] UID no definido, no se monta el listener"
      );
      return;
    }
    const db = getDatabase();
    const userRef = ref(db, `users/${user.uid}/magnetos_totales`);
    console.log(
      `[Magnetos][useEffect] Montando listener para UID: ${user.uid}`
    );
    const unsubscribe = onValue(userRef, (snapshot) => {
      const value = snapshot.val();
      console.log(
        `[Magnetos][onValue] Valor recibido de Firebase para UID ${user.uid}:`,
        value
      );
      setMagnetos(value ?? 0);
    });
    return () => {
      console.log(
        `[Magnetos][useEffect] Desmontando listener para UID: ${user.uid}`
      );
      unsubscribe();
    };
  }, [user?.uid]);

  // 4. Lógica para disparar eventos aleatorios (solo host)
  useEffect(() => {
    console.log(
      "[GameEvent] useEffect: gameEvents.length =",
      gameEvents.length,
      ", roomPlayers.length =",
      roomPlayers.length,
      ", gameState =",
      !!gameState,
      ", isHost =",
      userWithHostFlag.isHost
    );
    if (
      !userWithHostFlag.isHost ||
      !gameState ||
      !roomPlayers.length ||
      !gameEvents.length
    ) {
      console.log(
        "[LOG][GameEvent] No se cumplen condiciones para disparar evento aleatorio"
      );
      return;
    }
    let timeoutId;
    let availableEvents = [...gameEvents]; // Copia local para no repetir

    const triggerRandomEvent = async () => {
      try {
        // Si se han mostrado todos, reiniciar el ciclo
        if (availableEvents.length === 0) {
          availableEvents = [...gameEvents];
        }
        // Seleccionar un evento aleatorio y eliminarlo de la copia local
        const total = availableEvents.length;
        const randomIndex = Math.floor(Math.random() * total);
        const event = availableEvents[randomIndex];
        availableEvents.splice(randomIndex, 1); // Eliminar el evento ya mostrado
        setCurrentEvent(event);
        setEventModalVisible(true);
        console.log(
          "[LOG][GameEvent] Evento aleatorio disparado:", event
        );
      } catch (err) {
        console.error(
          "[LOG][GameEvent][ERROR] Error al disparar evento aleatorio:",
          err
        );
      }
    };
    // Programar eventos cada 3-4 minutos de forma aleatoria
    const scheduleEvent = () => {
      const delay = 60000 + Math.random() * 60000; // 1-2 minutos
      console.log(
        "[LOG][GameEvent] Programando próximo evento en",
        Math.round(delay / 1000),
        "segundos"
      );
      timeoutId = setTimeout(async () => {
        await triggerRandomEvent();
        scheduleEvent(); // Programar el siguiente evento
      }, delay);
    };
    scheduleEvent();
    return () => clearTimeout(timeoutId);
  }, [userWithHostFlag.isHost, gameState, roomPlayers.length, gameEvents]);

  // 5. Al cerrar el modal, aplicar el efecto del evento
  const handleCloseEventModal = async () => {
    try {
      setEventModalVisible(false);
      if (currentEvent) {
        if (currentEvent.specialLogic === "minMagnetos") {
          // Lógica especial: penalizar al jugador (o jugadores) con menos magnetos
          const minMagnetos = Math.min(...roomPlayers.map(p => p.magnetos ?? 0));
          const perdedores = roomPlayers.filter(p => (p.magnetos ?? 0) === minMagnetos);
          const magnetos = typeof currentEvent.magnetos === 'number' ? currentEvent.magnetos : -2;
          const { addMagnetosToPlayerInRoom } = require("../../../services/FirebaseDataService");
          await Promise.all(
            perdedores.map(async (p) => {
              await addMagnetosToPlayerInRoom(roomCode, p.uid, magnetos);
            })
          );
          console.log(`[LOG][GameEvent][PASO 4][minMagnetos] Penalizados jugadores con menos magnetos:`, perdedores.map(p => p.nombre || p.uid));
        } else if (currentEvent.type === "detrimental") {
          const {
            addMagnetosToPlayerInRoom,
          } = require("../../../services/FirebaseDataService");
          await Promise.all(
            roomPlayers.map(async (p) => {
              await addMagnetosToPlayerInRoom(roomCode, p.uid, -5);
            })
          );
          console.log(
            "[LOG][GameEvent][PASO 4] Efecto detrimental aplicado correctamente a todos los jugadores."
          );
        } else if (currentEvent.type === "beneficial") {
          const {
            addMagnetosToPlayerInRoom,
          } = require("../../../services/FirebaseDataService");
          await Promise.all(
            roomPlayers.map(async (p) => {
              await addMagnetosToPlayerInRoom(roomCode, p.uid, 5);
            })
          );
          console.log(
            "[LOG][GameEvent][PASO 4] Efecto beneficial aplicado correctamente a todos los jugadores."
          );
        } else if (currentEvent.type === "action") {
          // Si magnetos es 0, no mostramos la lista de jugadores ni penalizamos
          if (typeof currentEvent.magnetos === 'number' && currentEvent.magnetos === 0) {
            setCurrentEvent(null);
            return;
          }
          // Mostrar el modal de selección de jugador para penalizar
          setPendingActionEvent(currentEvent);
          setShowActionEventModal(true);
          setCurrentEvent(null);
          return; // No limpiar el estado aún, se hace tras penalizar
        } else {
          console.log(
            "[LOG][GameEvent][PASO 4] Tipo de evento no reconocido, no se aplica efecto."
          );
        }
      }
      setCurrentEvent(null);
      console.log(
        "[LOG][GameEvent][PASO 4] Modal cerrado y estado limpiado correctamente."
      );
    } catch (err) {
      console.error(
        "[LOG][GameEvent][PASO 4][ERROR] Error al aplicar el efecto del evento o cerrar el modal:",
        err
      );
    }
  };

  // Handler para penalizar al jugador seleccionado en eventos de acción
  const handleActionEventPenalty = async (uid) => {
    if (!pendingActionEvent || !uid) return;
    try {
      const { addMagnetosToPlayerInRoom } = require("../../../services/FirebaseDataService");
      // Usar siempre el campo magnetos
      const magnetos = typeof pendingActionEvent.magnetos === 'number' ? pendingActionEvent.magnetos : 0;
      await addMagnetosToPlayerInRoom(roomCode, uid, magnetos);
      setShowActionEventModal(false);
      setPendingActionEvent(null);
      // Opcional: mostrar feedback visual o toast
    } catch (err) {
      console.error("[ActionEventModal][ERROR] Error al penalizar jugador:", err);
      setShowActionEventModal(false);
      setPendingActionEvent(null);
    }
  };

  // Mostrar el modal de carta offline al volver de la cámara
  useEffect(() => {
    if (pendingOfflineModal) {
      console.log(
        "[GameScreen] useEffect pendingOfflineModal: activando showOfflineModal"
      );
      setShowOfflineModal(true);
      setPendingOfflineModal(false);
    }
  }, [pendingOfflineModal]);

  if (loading) {
    return (
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando partida...</Text>
        </View>
      </Animated.View>
    );
  }

  if (!gameState) {
    return (
      <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
        <View style={styles.errorContent}>
          <StopIcon size={64} color={COLORS.error} />
          <Text style={styles.errorText}>
            Error: No se pudo cargar el estado del juego
          </Text>
        </View>
      </Animated.View>
    );
  }

  // Obtener el nombre del jugador actual
  const currentPlayer = gameState.players?.find(
    (p) => p.uid === gameState.turn_of
  );
  const currentPlayerName = currentPlayer ? currentPlayer.nombre : "Jugador";
  const isMyTurn = gameState.turn_of === userWithHostFlag.uid;
  // LOGS DETALLADOS EN EL RENDER
  console.log(
    "[GameScreen][RENDER][DEBUG] user.uid:",
    userWithHostFlag?.uid,
    "| gameState.turn_of:",
    gameState?.turn_of
  );
  console.log(
    "[GameScreen][RENDER][DEBUG] typeof user.uid:",
    typeof userWithHostFlag?.uid,
    "| typeof gameState.turn_of:",
    typeof gameState?.turn_of
  );
  console.log(
    "[GameScreen][RENDER][DEBUG] user.uid === gameState.turn_of:",
    userWithHostFlag?.uid === gameState?.turn_of
  );

  // --- Lógica para el contenido del Modal ---
  const modalTitle = isHost ? "Terminar Partida" : "Salir de la Partida";
  const modalText = isHost
    ? "¿Seguro que quieres terminar la partida para todos? Esto llevará a la pantalla de resultados."
    : "¿Seguro que quieres abandonar la partida?";
  const onConfirmAction = isHost ? handleEndGame : handleLeaveGame;

  // --- NUEVO: Renderizado condicional para host/invitado ---
  if (!isHost) {
    // Vista para jugadores que NO son host (invitados)
    return (
      <View style={[styles.container, scrollViewStyles.container]}>
        <Animated.View
          style={[
            styles.animatedWrapper,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

          {/* Header con sala */}
          <View style={styles.guestHeader}>
            <Text style={[
              styles.roomCodeText,
              screenSize.isSmall && styles.smallText
            ]}>
              Sala: {roomCode}
            </Text>
            <TouchableOpacity
              onPress={() => setShowLeaveModal(true)}
              style={[
                styles.leaveButton,
                screenSize.isSmall && styles.smallButton
              ]}
              activeOpacity={0.7}
              accessibilityLabel="Salir de la partida"
            >
              <XMarkIcon size={20} color={COLORS.white} />
              <Text style={[
                styles.leaveButtonText,
                screenSize.isSmall && styles.smallButtonText
              ]}>
                Salir
              </Text>
            </TouchableOpacity>
          </View>

          {screenSize.needsScroll ? (
            <ScrollView
              style={[styles.guestScrollView, scrollViewStyles.scrollView]}
              contentContainerStyle={[
                styles.guestScrollContent,
                scrollViewStyles.content
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Indicador de turno */}
              <View style={[
                styles.turnIndicator,
                screenSize.isSmall && styles.smallTurnIndicator
              ]}>
                <ClockIcon size={24} color={COLORS.primary} />
                <Text style={[
                  styles.turnText,
                  screenSize.isSmall && styles.smallTurnText
                ]}>
                  Turno de:{" "}
                  <Text style={styles.currentPlayerName}>{currentPlayerName}</Text>
                </Text>
              </View>

              {/* Scoreboard */}
              <View style={styles.scoreboardContainer}>
                <ScoreBoard
                  players={roomPlayers}
                  currentTurnUid={gameState.turn_of}
                />
              </View>
            </ScrollView>
          ) : (
            <>
              {/* Indicador de turno */}
              <View style={styles.turnIndicator}>
                <ClockIcon size={24} color={COLORS.primary} />
                <Text style={styles.turnText}>
                  Turno de:{" "}
                  <Text style={styles.currentPlayerName}>{currentPlayerName}</Text>
                </Text>
              </View>

              {/* Scoreboard */}
              <View style={styles.scoreboardContainer}>
                <ScoreBoard
                  players={roomPlayers}
                  currentTurnUid={gameState.turn_of}
                />
              </View>
            </>
          )}
        </Animated.View>

        {/* Modal de salir */}
        <Modal
          visible={showLeaveModal}
          transparent
          animationType="none"
          onRequestClose={() => setShowLeaveModal(false)}
        >
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <Animated.View
              style={[
                styles.modernModal,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <View style={styles.modalHeader}>
                <StopIcon size={32} color={COLORS.error} />
                <Text style={styles.modalTitle}>Salir de la Partida</Text>
              </View>
              <Text style={styles.modalDescription}>
                ¿Seguro que quieres abandonar la partida?
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowLeaveModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleLeaveGame}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmButtonText}>Salir</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        </Modal>
      </View>
    );
  }

  // Vista para el host (tablero completo)
  return (
    <View style={[styles.container, scrollViewStyles.container]}>
      <Animated.View
        style={[
          styles.animatedWrapper,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        {/* Header del host */}
        <View style={styles.hostHeader}>
          <TouchableOpacity
            style={[
              styles.playersButton,
              screenSize.isSmall && styles.smallIconButton
            ]}
            onPress={() => setShowPlayersModal(true)}
            activeOpacity={0.8}
          >
            <UserGroupIcon size={20} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[
              styles.roomCodeText,
              screenSize.isSmall && styles.smallText
            ]}>
              Sala: {roomCode}
            </Text>
            <Text style={[
              styles.gameStateText,
              screenSize.isSmall && styles.smallSubText
            ]}>
              Turno {gameState.turno || 1}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowLeaveModal(true)}
            style={[
              styles.endGameButton,
              screenSize.isSmall && styles.smallIconButton
            ]}
            activeOpacity={0.7}
          >
            <StopIcon size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {screenSize.needsScroll ? (
          <ScrollView
            style={[styles.hostScrollView, scrollViewStyles.scrollView]}
            contentContainerStyle={[
              styles.hostScrollContent,
              scrollViewStyles.content
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Indicador de turno */}
            <Animated.View
              style={[
                styles.turnCard, 
                screenSize.isSmall && styles.smallTurnCard,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <PlayIcon size={24} color={COLORS.primary} />
              <Text style={[
                styles.turnText,
                screenSize.isSmall && styles.smallTurnText
              ]}>
                Es el turno de:{" "}
                <Text style={styles.currentPlayerName}>{currentPlayerName}</Text>
              </Text>
            </Animated.View>

            {/* Botones de acción */}
            <View style={[
              styles.actionButtons,
              screenSize.isSmall && styles.smallActionButtons
            ]}>
              {!gameState.current_challenge?.qr_id && (
                <TouchableOpacity
                  style={[
                    styles.scanButton,
                    screenSize.isSmall && styles.smallScanButton
                  ]}
                  onPress={() => {
                    navigation.navigate("CameraScreen", {
                      onBarCodeScanned: handleBarCodeScanned,
                      user: userWithHostFlag,
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <QrCodeIcon size={24} color={COLORS.white} />
                  <Text style={[
                    styles.scanButtonText,
                    screenSize.isSmall && styles.smallButtonText
                  ]}>
                    Escanear QR
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.endTurnButton,
                  screenSize.isSmall && styles.smallEndTurnButton
                ]}
                onPress={handleEndTurn}
                activeOpacity={0.8}
              >
                <ClockIcon size={20} color={COLORS.white} />
                <Text style={[
                  styles.endTurnButtonText,
                  screenSize.isSmall && styles.smallButtonText
                ]}>
                  Terminar Turno
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scoreboard */}
            <View style={styles.scoreboardContainer}>
              <ScoreBoard players={roomPlayers} currentTurnUid={gameState.turn_of} />
            </View>
          </ScrollView>
        ) : (
          <>
            {/* Indicador de turno */}
            <Animated.View
              style={[styles.turnCard, { transform: [{ scale: scaleAnim }] }]}
            >
              <PlayIcon size={24} color={COLORS.primary} />
              <Text style={styles.turnText}>
                Es el turno de:{" "}
                <Text style={styles.currentPlayerName}>{currentPlayerName}</Text>
              </Text>
            </Animated.View>

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              {!gameState.current_challenge?.qr_id && (
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => {
                    navigation.navigate("CameraScreen", {
                      onBarCodeScanned: handleBarCodeScanned,
                      user: userWithHostFlag,
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <QrCodeIcon size={24} color={COLORS.white} />
                  <Text style={styles.scanButtonText}>Escanear QR</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.endTurnButton}
                onPress={handleEndTurn}
                activeOpacity={0.8}
              >
                <ClockIcon size={20} color={COLORS.white} />
                <Text style={styles.endTurnButtonText}>Terminar Turno</Text>
              </TouchableOpacity>
            </View>

            {/* Scoreboard */}
            <View style={styles.scoreboardContainer}>
              <ScoreBoard players={roomPlayers} currentTurnUid={gameState.turn_of} />
            </View>
          </>
        )}
      </Animated.View>

      {/* Modal terminar partida */}
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View
            style={[styles.modernModal, { transform: [{ scale: scaleAnim }] }]}
          >
            <View style={styles.modalHeader}>
              <StopIcon size={32} color={COLORS.error} />
              <Text style={styles.modalTitle}>Terminar Partida</Text>
            </View>
            <Text style={styles.modalDescription}>
              ¿Seguro que quieres terminar la partida para todos? Esto llevará a
              la pantalla de resultados.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLeaveModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onConfirmAction}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Terminar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Modal jugadores */}
      <Modal
        visible={showPlayersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlayersModal(false)}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View
            style={[styles.playersModal, { transform: [{ scale: scaleAnim }] }]}
          >
            <View style={styles.modalHeader}>
              <UserGroupIcon size={32} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Jugadores en la partida</Text>
            </View>
            <ScrollView
              style={styles.playersScrollView}
              showsVerticalScrollIndicator={false}
            >
              {(roomPlayers || []).map((p) => (
                <View key={p.uid} style={styles.playerItem}>
                  <View style={styles.playerInfo}>
                    <Text
                      style={[
                        styles.playerName,
                        p.uid === userWithHostFlag.uid &&
                          styles.currentUserName,
                      ]}
                    >
                      {p.nombre || p.username || p.email}
                    </Text>
                    {p.role && <Text style={styles.playerRole}>{p.role}</Text>}
                  </View>
                  {p.uid === userWithHostFlag.uid && (
                    <View style={styles.hostBadge}>
                      <Text style={styles.hostBadgeText}>TÚ</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.cancelButton, { marginTop: 16 }]}
              onPress={() => setShowPlayersModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Modal error reto no encontrado */}
      <Modal
        visible={showChallengeErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChallengeErrorModal(false)}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View
            style={[styles.modernModal, { transform: [{ scale: scaleAnim }] }]}
          >
            <View style={styles.modalHeader}>
              <XMarkIcon size={32} color={COLORS.error} />
              <Text style={styles.modalTitle}>Reto no encontrado</Text>
            </View>
            <Text style={styles.modalDescription}>
              No se ha encontrado un reto para el QR escaneado. Por favor,
              intenta con otro QR.
            </Text>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => {
                setShowChallengeErrorModal(false);
                setChallengeError(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Modal evento aleatorio */}
      <GameEventModal
        visible={eventModalVisible}
        event={currentEvent}
        onClose={() => handleCloseEventModal()}
      />

      {/* Modal carta offline */}
      {showOfflineModal && (
        <OfflineCardModal
          visible={showOfflineModal}
          onClose={() => {
            setShowOfflineModal(false);
            setScanning(false);
          }}
          onResult={async (wasCorrect) => {
            setOfflineModalResult(wasCorrect);
            const playerInTurnUid = gameState?.turn_of;
            if (wasCorrect && playerInTurnUid && roomCode) {
              try {
                console.log(
                  `[LOG][OfflineCard] Asignando 10 magnetos al jugador ${playerInTurnUid} por carta offline.`
                );
                await addMagnetosToPlayerInRoom(roomCode, playerInTurnUid, 10);
              } catch (e) {
                console.error("Error al sumar magnetos por carta offline:", e);
              }
            }
          }}
          playerName={currentPlayerName}
        />
      )}

      {/* Modal acción para eventos de tipo 'action' */}
      <ActionEventModal
        visible={showActionEventModal}
        onClose={() => {
          setShowActionEventModal(false);
          setPendingActionEvent(null);
        }}
        players={roomPlayers}
        magnetosToSubtract={
          typeof pendingActionEvent?.magnetos === 'number'
            ? pendingActionEvent.magnetos
            : 0
        }
        onConfirm={handleActionEventPenalty}
        event={pendingActionEvent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
  },

  // Estados de carga y error
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },

  loadingContent: {
    alignItems: "center",
    padding: 32,
  },

  loadingText: {
    marginTop: 16,
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    fontSize: 18,
    fontWeight: "500",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 32,
  },

  errorContent: {
    alignItems: "center",
  },

  errorText: {
    marginTop: 16,
    color: COLORS.error,
    fontFamily: FONTS.text,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Header para invitados
  guestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.primary + "10",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + "20",
  },

  // Header para host
  hostHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.primary + "10",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + "20",
  },

  headerCenter: {
    alignItems: "center",
    flex: 1,
  },

  roomCodeText: {
    fontFamily: FONTS.title,
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.darkBlue,
  },

  gameStateText: {
    fontFamily: FONTS.text,
    fontSize: 14,
    color: COLORS.blue,
    marginTop: 2,
  },

  playersButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    padding: 12,
    ...Platform.select({
      web: {
        boxShadow: `0 2px 4px ${COLORS.blue}40`,
      },
      default: {
        shadowColor: COLORS.blue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },

  endGameButton: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    padding: 12,
    ...Platform.select({
      web: {
        boxShadow: `0 2px 4px ${COLORS.error}40`,
      },
      default: {
        shadowColor: COLORS.error,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },

  leaveButton: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  leaveButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 14,
    fontWeight: "600",
  },

  // Indicador de turno
  turnIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },

  turnCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: `0 4px 12px ${COLORS.darkBlue}1A`,
      },
      default: {
        shadowColor: COLORS.darkBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
    borderWidth: 1,
    borderColor: COLORS.primary + "20",
  },

  turnText: {
    fontFamily: FONTS.text,
    fontSize: 18,
    color: COLORS.darkBlue,
    fontWeight: "500",
  },

  currentPlayerName: {
    fontFamily: FONTS.title,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  // Botones de acción
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },

  scanButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: `0 4px 8px ${COLORS.primary}40`,
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },

  scanButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 18,
    fontWeight: "bold",
  },

  endTurnButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: `0 2px 6px ${COLORS.blue}40`,
      },
      default: {
        shadowColor: COLORS.blue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
      },
    }),
  },

  endTurnButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 16,
    fontWeight: "bold",
  },

  // Scoreboard
  scoreboardContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Modales modernos
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modernModal: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    ...Platform.select({
      web: {
        boxShadow: `0 8px 24px ${COLORS.black}40`,
      },
      default: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 12,
      },
    }),
  },

  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },

  modalTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.darkBlue,
    textAlign: "center",
  },

  modalDescription: {
    fontFamily: FONTS.text,
    fontSize: 16,
    color: COLORS.blue,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    opacity: 0.8,
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 16,
    fontWeight: "bold",
  },

  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: `0 2px 4px ${COLORS.primary}40`,
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },

  confirmButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 16,
    fontWeight: "bold",
  },

  // Modal de jugadores
  playersModal: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    ...Platform.select({
      web: {
        boxShadow: `0 8px 24px ${COLORS.black}40`,
      },
      default: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 12,
      },
    }),
  },

  playersScrollView: {
    maxHeight: 300,
    marginBottom: 16,
  },

  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 12,
    marginBottom: 8,
  },

  playerInfo: {
    flex: 1,
  },

  playerName: {
    fontFamily: FONTS.text,
    fontSize: 16,
    color: COLORS.darkBlue,
    fontWeight: "500",
  },

  currentUserName: {
    color: COLORS.primary,
    fontWeight: "bold",
  },

  playerRole: {
    fontFamily: FONTS.text,
    fontSize: 14,
    color: COLORS.blue,
    marginTop: 2,
    opacity: 0.8,
  },

  hostBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  hostBadgeText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 12,
    fontWeight: "bold",
  },

  // Estilos para pantallas pequeñas
  animatedWrapper: {
    flex: 1,
  },

  guestScrollView: {
    flex: 1,
  },

  guestScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  hostScrollView: {
    flex: 1,
  },

  hostScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  smallText: {
    fontSize: 16,
  },

  smallSubText: {
    fontSize: 12,
  },

  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  smallButtonText: {
    fontSize: 12,
  },

  smallIconButton: {
    padding: 8,
  },

  smallTurnIndicator: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  smallTurnText: {
    fontSize: 16,
  },

  smallTurnCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginVertical: 12,
  },

  smallActionButtons: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },

  smallScanButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },

  smallEndTurnButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 6,
  },
});

export default GameScreen;
