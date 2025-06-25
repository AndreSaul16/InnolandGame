import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Platform,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import { listenGameState, getUsersTotalMagnetos, deleteRoom } from '../../../services/FirebaseDataService';
import ScoreBoard from './ScoreBoard';
import { COLORS, FONTS } from '../../../theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { saveLastGameWithTurn } from '../../../services/FirebaseDataService';
import { getAuth } from 'firebase/auth';
import {
  TrophyIcon,
  HomeIcon,
  StarIcon,
  FireIcon
} from 'react-native-heroicons/solid';
import useScreenSize, { getScrollViewStyles } from '../../../utils/useScreenSize';
import { useContext } from 'react';
import { UserContext } from '../../../context/UserContext';

// ResultsScreen.jsx
// Muestra las puntuaciones finales y el ganador. Permite volver al menú principal.
const ResultsScreen = (props) => {
  console.log('[ResultsScreen] Render principal');
  const route = useRoute();
  const navigation = useNavigation();
  const { roomCode, user, players: passedPlayers, mode } = route.params || props;
  const [gameState, setGameState] = useState(null);
  const [lastGameSaved, setLastGameSaved] = useState(false);
  const [totalMagnetos, setTotalMagnetos] = useState({});
  const screenData = useScreenSize();
  const scrollStyles = getScrollViewStyles(screenData.needsScroll);
  const { setRoomCode, setUserRole } = useContext(UserContext);
  const [wasGameState, setWasGameState] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const trophyRotateAnim = useRef(new Animated.Value(0)).current;

  // Solo escuchar gameState si no es modo battle
  useEffect(() => {
    if (mode === 'battle') return;
    console.log('[ResultsScreen] useEffect montado, roomCode:', roomCode);
    if (!roomCode) return;
    const unsubscribe = listenGameState(roomCode, (state) => {
      console.log('[ResultsScreen] Estado de juego recibido:', state);
      setGameState(state);
      if (state) setWasGameState(true);
      // Si la sala fue eliminada y ya habíamos recibido gameState antes, redirigir a Home
      if (!state && wasGameState) {
        Alert.alert(
          'Partida finalizada',
          'El anfitrión ha cerrado la sala. Serás redirigido al menú principal.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Home', { user })
            }
          ],
          { cancelable: false }
        );
      }
    });
    return () => unsubscribe();
  }, [roomCode, navigation, user, wasGameState, mode]);

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();

    // Animación del trofeo
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyRotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(trophyRotateAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  // Guardar la última partida automáticamente cuando gameState esté disponible
  useEffect(() => {
    if (!gameState || lastGameSaved) return;
    // Obtener UID del usuario autenticado
    let uid = null;
    if (user && user.uid) {
      uid = user.uid;
    } else {
      const auth = getAuth();
      if (auth.currentUser) {
        uid = auth.currentUser.uid;
      }
    }
    if (!uid) {
      console.warn('[ResultsScreen] No se encontró UID de usuario, no se guarda la última partida.');
      return;
    }
    // Calcular datos de la última partida
    const scores = gameState.scores || {};
    const players = gameState.players || [];
    const myScore = scores[uid] || 0;
    const duration = gameState.duration || null; // Ajusta si tienes duración
    const date = new Date().toLocaleDateString();
    // Obtener el contador de magnetos de la partida para el usuario
    const myPlayer = players.find(p => p.uid === uid);
    const magnetosPartida = myPlayer && myPlayer.magnetos !== undefined ? myPlayer.magnetos : null;
    const lastGameData = {
      score: myScore,
      duration: duration,
      date: date,
      roomCode: roomCode,
      magnetosPartida: magnetosPartida,
      // Puedes añadir más campos si lo deseas
    };
    saveLastGameWithTurn(uid, roomCode, lastGameData)
      .then(() => {
        setLastGameSaved(true);
        console.log('[ResultsScreen] Última partida guardada correctamente:', lastGameData);
      })
      .catch((error) => {
        console.error('[ResultsScreen] Error al guardar la última partida:', error);
      });
  }, [gameState, user, lastGameSaved, roomCode]);

  // Obtener los magnetos totales de todos los jugadores cuando gameState esté disponible
  useEffect(() => {
    if (!gameState || !gameState.players) return;
    const uids = (gameState.players || []).map(p => p.uid);
    getUsersTotalMagnetos(uids).then(setTotalMagnetos);
  }, [gameState]);

  // Si es modo battle y recibimos players por props, mostrar resultado directamente
  if (mode === 'battle' && passedPlayers) {
    const sortedPlayers = [...passedPlayers].sort((a, b) => (b.score || 0) - (a.score || 0));
    const winner = sortedPlayers[0];
    const winnerScore = winner?.score || 0;
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.outerWebContainer}>
          <View style={styles.scrollWebContent}>
            {/* Header celebratorio */}
            <View style={styles.celebrationHeader}>
              <TrophyIcon size={80} color={COLORS.primary} />
              <Text style={styles.celebrationTitle}>¡Partida Finalizada!</Text>
            </View>
            
            {/* Resultado del jugador */}
            <View style={styles.winnerCard}>
              <Text style={styles.winnerName}>{winner?.name || winner?.nombre}</Text>
              <View style={styles.winnerScoreContainer}>
                <FireIcon size={24} color={COLORS.primary} />
                <Text style={styles.winnerScore}>{winnerScore} puntos</Text>
              </View>
            </View>

          </View>
          {/* Botón de regreso */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => {
                setRoomCode(null);
                setUserRole(null);
                navigation.replace('Home', { user });
              }}
              activeOpacity={0.8}
            >
              <HomeIcon size={24} color={COLORS.white} />
              <Text style={styles.homeButtonText}>Volver al Menú</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!gameState) {
    return (
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <View style={styles.loadingContent}>
          <TrophyIcon size={64} color={COLORS.primary} />
          <Text style={styles.loadingText}>Calculando resultados...</Text>
        </View>
      </Animated.View>
    );
  }

  // Calcular ranking y ganador usando el campo magnetos de cada jugador
  const players = gameState.players || [];
  const sortedPlayers = [...players].sort((a, b) => (b.magnetos || 0) - (a.magnetos || 0));
  const winner = sortedPlayers[0];
  const winnerScore = winner.magnetos || 0;

  // Interpolación para rotación del trofeo
  const trophyRotation = trophyRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  // Botón de volver al menú como componente reutilizable
  const ReturnHomeButton = ({ onPress }) => (
    <TouchableOpacity
      style={styles.homeButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <HomeIcon size={24} color={COLORS.white} />
      <Text style={styles.homeButtonText}>Volver al Menú</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.outerWebContainer}>
        <View style={styles.scrollWebContent}>
          {/* Header celebratorio */}
          <Animated.View style={[
            styles.celebrationHeader,
            { transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
          ]}>
            <View style={styles.confetti}>
              <StarIcon size={20} color={COLORS.primary} />
              <StarIcon size={16} color={COLORS.blue} />
              <StarIcon size={18} color={COLORS.primary} />
            </View>
            <Animated.View style={{ transform: [{ rotate: trophyRotation }] }}>
              <TrophyIcon size={80} color={COLORS.primary} />
            </Animated.View>
            <Text style={styles.celebrationTitle}>¡Partida Finalizada!</Text>
            <View style={styles.confetti}>
              <StarIcon size={18} color={COLORS.blue} />
              <StarIcon size={16} color={COLORS.primary} />
              <StarIcon size={20} color={COLORS.blue} />
            </View>
          </Animated.View>
          {/* Resultado del jugador */}
          <Animated.View style={[
            styles.winnerCard,
            { transform: [{ scale: scaleAnim }] }
          ]}>
            <Text style={styles.winnerName}>{winner.nombre}</Text>
            <View style={styles.winnerScoreContainer}>
              <FireIcon size={24} color={COLORS.primary} />
              <Text style={styles.winnerScore}>{winnerScore} magnetos</Text>
            </View>
          </Animated.View>
          {/* Scoreboard */}
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <ScoreBoard
              players={players}
              currentTurnUid={null}
            />
          </Animated.View>
        </View>
        {/* Botón de regreso siempre visible al final */}
        <Animated.View style={[
          styles.buttonContainer,
          { transform: [{ translateY: slideAnim }] }
        ]}>
          <ReturnHomeButton
            onPress={async () => {
              console.log('[ResultsScreen] Botón volver al menú principal pulsado');
              if (roomCode) {
                try {
                  await deleteRoom(roomCode);
                } catch (e) {
                  console.warn('No se pudo eliminar la sala:', e);
                }
              }
              setRoomCode(null);
              setUserRole(null);
              navigation.replace('Home', { user });
            }}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },

  loadingContent: {
    alignItems: 'center',
    padding: 32,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    fontWeight: '500',
  },

  celebrationHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },

  confetti: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  celebrationTitle: {
    fontSize: 32,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 1,
  },

  winnerCard: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: `0 8px 24px ${COLORS.primary}30`,
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 8,
      },
    }),
  },

  winnerName: {
    fontSize: 28,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    textAlign: 'center',
    marginBottom: 16,
  },

  winnerScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: `0 4px 12px ${COLORS.primary}20`,
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },

  winnerScore: {
    fontSize: 20,
    fontFamily: FONTS.text,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: COLORS.white,
    ...Platform.select({
      web: {
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      },
    }),
  },

  homeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: `0 4px 12px ${COLORS.primary}40`,
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },

  homeButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },

  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentArea: {
    flex: 1,
  },

  outerWebContainer: {
    flex: 1,
    ...Platform.select({
      web: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      },
    }),
  },
  scrollWebContent: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        maxHeight: 'calc(100vh - 96px)',
        paddingBottom: 32,
      },
    }),
  },
});

export default ResultsScreen;