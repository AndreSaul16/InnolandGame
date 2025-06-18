import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { listenGameState, getUsersTotalMagnetos } from '../../../services/FirebaseDataService';
import ScoreBoard from './ScoreBoard';
import { COLORS, FONTS } from '../../../theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { saveLastGameForUser } from '../../../services/FirebaseDataService';
import { getAuth } from 'firebase/auth';

// ResultsScreen.jsx
// Muestra las puntuaciones finales y el ganador. Permite volver al menú principal.
const ResultsScreen = (props) => {
  console.log('[ResultsScreen] Render principal');
  const route = useRoute();
  const navigation = useNavigation();
  const { roomCode, user, players: passedPlayers } = route.params || props;
  const [gameState, setGameState] = useState(null);
  const [lastGameSaved, setLastGameSaved] = useState(false);
  const [totalMagnetos, setTotalMagnetos] = useState({});

  useEffect(() => {
    console.log('[ResultsScreen] useEffect montado, roomCode:', roomCode);
    if (!roomCode) return;
    const unsubscribe = listenGameState(roomCode, (state) => {
      console.log('[ResultsScreen] Estado de juego recibido:', state);
      setGameState(state);
    });
    return () => unsubscribe();
  }, [roomCode]);

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
    saveLastGameForUser(uid, lastGameData)
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

  if (!gameState) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Cargando resultados...</Text>
      </View>
    );
  }

  // Calcular ranking y ganador usando el campo magnetos de cada jugador
  const players = gameState.players || [];
  const sortedPlayers = [...players].sort((a, b) => (b.magnetos || 0) - (a.magnetos || 0));
  const winner = sortedPlayers[0];
  const winnerScore = winner.magnetos || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Partida finalizada!</Text>
      <Text style={styles.winnerText}>
        Ganador: <Text style={styles.winnerName}>{winner.nombre}</Text> 🏆
      </Text>
      <Text style={styles.winnerScore}>Magnetos en partida: {winnerScore}</Text>
      <ScoreBoard
        players={players}
        currentTurnUid={null}
      />
      <Button
        title="Volver al menú principal"
        color={COLORS.primary}
        onPress={() => {
          console.log('[ResultsScreen] Botón volver al menú principal pulsado');
          navigation.replace('Home', { user });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: FONTS.title,
    marginBottom: 16,
    textAlign: 'center',
  },
  winnerText: {
    fontSize: 20,
    color: COLORS.success,
    fontFamily: FONTS.title,
    marginBottom: 4,
    textAlign: 'center',
  },
  winnerName: {
    fontWeight: 'bold',
    color: COLORS.darkBlue,
  },
  winnerScore: {
    fontSize: 18,
    color: COLORS.blue,
    fontFamily: FONTS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
  },
});

export default ResultsScreen; 