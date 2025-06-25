import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar, Platform, Alert, Modal } from 'react-native';
import OpenAIService from '../../../services/OpenAIService';
import { COLORS, FONTS } from '../../../theme';
import { useNavigation } from '@react-navigation/native';
import ScoreBoard from '../GameUI/ScoreBoard';
import { UserContext } from '../../../context/UserContext';
import LoadingScreen from '../../../utils/LoadingScreen';
import { addMagnetosToUser, saveBattleModeState } from '../../../services/FirebaseDataService';

// Componente de estilos CSS para web
const WebStyles = () => {
  if (Platform.OS !== 'web') return null;
  
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        /* Estilos para el scroll personalizado */
        .battle-scroll {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: ${COLORS.primary}40 transparent;
          flex: 1; /* Ocupar el espacio del contenedor padre */
        }
        
        .battle-scroll::-webkit-scrollbar {
          width: 8px;
        }
        
        .battle-scroll::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        
        .battle-scroll::-webkit-scrollbar-thumb {
          background: ${COLORS.primary}60;
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        
        .battle-scroll::-webkit-scrollbar-thumb:hover {
          background: ${COLORS.primary}80;
        }
        
        .battle-scroll::-webkit-scrollbar-thumb:active {
          background: ${COLORS.primary};
        }
        
        /* Animaciones para las cards */
        .card-enter {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateZ(0);
          scroll-snap-align: start;
          box-shadow: 0 4px 20px ${COLORS.primary}20, 0 1px 3px ${COLORS.primary}10;
        }
        
        /* Estilos para botones con efectos */
        .option-button {
          transition: all 0.2s ease-in-out;
          cursor: pointer;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        .option-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 6px 20px ${COLORS.blue}30;
        }
        
        .option-button:active {
          transform: translateY(0px) scale(0.98);
          transition: all 0.1s ease-in-out;
        }
        
        .option-button:focus {
          outline: 2px solid ${COLORS.primary};
          outline-offset: 2px;
        }
        
        /* Animaciones para respuestas correctas e incorrectas */
        .option-correct {
          animation: correctPulse 0.6s ease-out;
          box-shadow: 0 4px 20px ${COLORS.success}50 !important;
          transform: scale(1.02) !important;
        }
        
        @keyframes correctPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); box-shadow: 0 6px 25px ${COLORS.success}60; }
          100% { transform: scale(1.02); box-shadow: 0 4px 20px ${COLORS.success}50; }
        }
        
        .option-wrong {
          animation: wrongShake 0.5s ease-out;
          box-shadow: 0 4px 20px ${COLORS.error}50 !important;
        }
        
        @keyframes wrongShake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
        
        /* Efectos para el botón principal */
        .button-ripple {
          box-shadow: 0 4px 15px ${COLORS.primary}40, 0 2px 4px ${COLORS.primary}20;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          transform: translateZ(0);
          position: relative;
          overflow: hidden;
        }
        
        .button-ripple:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 25px ${COLORS.primary}50, 0 4px 8px ${COLORS.primary}30;
        }
        
        .button-ripple:active {
          transform: translateY(-1px) scale(0.98);
          box-shadow: 0 4px 15px ${COLORS.primary}60;
          transition: all 0.1s ease-in-out;
        }
        
        .button-ripple::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .button-ripple:active::before {
          width: 300px;
          height: 300px;
        }
        
        /* Aceleración por GPU */
        .gpu-accelerated {
          transform: translateZ(0);
          will-change: transform;
        }
        
        /* Focus para accesibilidad */
        .focusable:focus {
          outline: 2px solid ${COLORS.primary};
          outline-offset: 2px;
        }
      `
    }} />
  );
};

/**
 * BattleScreen.jsx
 * -----------------
 * Pantalla para el modo de juego "Battle" de un solo jugador.
 * Se basa en preguntas de opción múltiple generadas por la IA. Mantiene siempre
 * dos preguntas en la cola. Al responder una, avanza a la siguiente y solicita
 * una nueva para re-llenar la cola. El jugador acumula puntos por respuestas correctas.
 */
const INITIAL_QUEUE_SIZE = 6;
const MIN_QUEUE_SIZE = 6;

export default function BattleScreen() {
  const navigation = useNavigation();
  const { user, battleState, setBattleState } = useContext(UserContext);

  // --- Estado del jugador (ahora persistente) ---
  const [player, setPlayer] = useState({
    name: user?.nombre || user?.username || user?.email || 'Jugador',
    score: 0
  });

  // --- Estado de preguntas ---
  const [questionQueue, setQuestionQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // --- Loader para siguiente pregunta ---
  const [waitingNextQuestion, setWaitingNextQuestion] = useState(false);

  // --- Restaurar estado de batalla desde el contexto ---
  useEffect(() => {
    console.log('[BattleScreen] useEffect[battleState]: battleState =', battleState);
    if (battleState) {
      // FIX: Si el array de preguntas está vacío, forzar nueva partida
      if (!Array.isArray(battleState.questionQueue) || battleState.questionQueue.length === 0) {
        console.warn('[BattleScreen] ADVERTENCIA: battleState restaurado con questionQueue vacío. Se fuerza nueva partida.');
        setBattleState(null);
        initializeNewBattle();
        return;
      }
      setShowRestoreModal(true);
    } else {
      initializeNewBattle();
    }
  }, [battleState]);

  // Nueva función para guardar el estado inicial de la batalla
  const saveInitialBattleState = useCallback((initialQuestions) => {
    const initialState = {
      player: {
        name: user?.nombre || user?.username || user?.email || 'Jugador',
        score: 0
      },
      questionQueue: initialQuestions,
      currentIndex: 0,
      lastUpdated: Date.now()
    };
    setBattleState(initialState);
    // Guardar explícitamente en Firebase si es nativo
    if (Platform.OS !== 'web' && user && user.uid) {
      saveBattleModeState(user.uid, initialState);
      console.log('[BattleScreen] Estado inicial de batalla guardado en Firebase:', initialState);
    }
    console.log('[BattleScreen] Estado inicial de batalla guardado:', initialState);
  }, [user, setBattleState]);

  const initializeNewBattle = useCallback(async () => {
    setIsLoading(true);
    console.log('[BattleScreen] initializeNewBattle: Iniciando nueva partida, generando preguntas...');
    try {
      const promises = Array.from({ length: INITIAL_QUEUE_SIZE }).map((_, idx) => {
        console.log(`[BattleScreen] Solicitando pregunta inicial #${idx + 1}`);
        return OpenAIService.generateBattleChallenge();
      });
      const initialQuestions = await Promise.all(promises);
      console.log('[BattleScreen] Preguntas iniciales generadas:', initialQuestions);
      setQuestionQueue(initialQuestions);
      setPlayer({
        name: user?.nombre || user?.username || user?.email || 'Jugador',
        score: 0
      });
      setCurrentIndex(0);
      // Guardar el estado inicial de la batalla
      saveInitialBattleState(initialQuestions);
    } catch (error) {
      console.error('[BattleScreen] Error cargando preguntas iniciales:', error);
    } finally {
      setIsLoading(false);
      console.log('[BattleScreen] initializeNewBattle: setIsLoading(false)');
    }
  }, [user, saveInitialBattleState]);

  const fetchAndAppendQuestion = useCallback(async () => {
    try {
      console.log('[BattleScreen] fetchAndAppendQuestion: solicitando nueva pregunta...');
      const newChallenge = await OpenAIService.generateBattleChallenge();
      console.log('[BattleScreen] Nueva pregunta generada:', newChallenge);
      setQuestionQueue((prev) => [...prev, newChallenge]);
    } catch (err) {
      console.error('[BattleScreen] Error generando nuevo reto:', err);
    }
  }, []);

  // Pre-carga preguntas en background si la cola baja de 6
  const ensureQuestionQueue = useCallback(async () => {
    if (questionQueue.length < MIN_QUEUE_SIZE) {
      const toFetch = MIN_QUEUE_SIZE - questionQueue.length;
      try {
        const newQuestions = await Promise.all(
          Array.from({ length: toFetch }).map(() => OpenAIService.generateBattleChallenge())
        );
        setQuestionQueue((prev) => [...prev, ...newQuestions]);
        console.log(`[BattleScreen] Precargadas ${newQuestions.length} preguntas para mantener la cola`);
      } catch (err) {
        console.error('[BattleScreen] Error precargando preguntas:', err);
      }
    }
  }, [questionQueue.length]);

  // Al responder, avanza y precarga si es necesario, sin loader si hay preguntas
  const handleOptionPress = async (optionIdx) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIdx);
    const currentQuestion = questionQueue[currentIndex];
    const correctIdx = typeof currentQuestion.correctAnswer === 'number'
      ? currentQuestion.correctAnswer
      : currentQuestion.options.findIndex(
          (opt) => opt.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
        );
    const wasCorrect = optionIdx === correctIdx;
    setIsCorrect(wasCorrect);
    setFeedback(currentQuestion.explanation || (wasCorrect ? '¡Respuesta correcta!' : 'Respuesta incorrecta'));
    setPlayer(prev => ({ ...prev, score: wasCorrect ? prev.score + 1 : prev.score - 1 }));
    // Pre-carga en background si hace falta
    ensureQuestionQueue();
    console.log('[BattleScreen] handleOptionPress: opción seleccionada', { optionIdx, wasCorrect, currentQuestion });
  };

  useEffect(() => {
    console.log('[BattleScreen] useEffect[player, questionQueue, currentIndex, isLoading]:', { player, questionQueue, currentIndex, isLoading });
    if (!isLoading && questionQueue.length > 0 && player.score >= 0) {
      const currentBattleState = {
        player,
        questionQueue,
        currentIndex,
        lastUpdated: Date.now()
      };
      setBattleState(currentBattleState);
      console.log('[BattleScreen] Estado de batalla guardado en contexto:', currentBattleState);
    }
  }, [player, questionQueue, currentIndex, isLoading]);

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    setFeedback('');
    setCurrentIndex((prev) => prev + 1);
    console.log('[BattleScreen] handleNextQuestion: avanzando a la siguiente pregunta');
  };

  const handleFinish = async () => {
    setBattleState(null);
    // Sumar/restar magnetos al usuario (score final, puede ser negativo)
    if (user && user.uid && player && typeof player.score === 'number' && player.score !== 0) {
      try {
        await addMagnetosToUser(user.uid, player.score);
        console.log(`[BattleScreen] Magnetos sumados al usuario: ${player.score > 0 ? '+' : ''}${player.score}`);
      } catch (e) {
        console.error('[BattleScreen] Error al sumar/restar magnetos al usuario:', e);
      }
    }
    navigation.replace('ResultsScreen', {
      players: [player],
      mode: 'battle',
      gameType: 'battle'
    });
    console.log('[BattleScreen] handleFinish: partida finalizada, score =', player.score);
  };

  const handleExitBattle = () => {
    Alert.alert(
      'Abandonar Partida',
      `¿Estás seguro que quieres abandonar? Perderás tu progreso actual (${player.score} magnetos).`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Abandonar',
          style: 'destructive',
          onPress: () => {
            setBattleState(null);
            navigation.replace('Home', { user });
            console.log('[BattleScreen] handleExitBattle: usuario abandona la partida');
          }
        }
      ]
    );
  };

  // --- Render principal ---
  // Loader solo si no hay preguntas
  if (isLoading || questionQueue.length === 0) {
    return (
      <LoadingScreen message="Cargando preguntas del modo Battle..." />
    );
  }

  if (waitingNextQuestion) {
    return <LoadingScreen message="Cargando siguiente pregunta..." />;
  }

  const currentQuestion = questionQueue[currentIndex];

  if (!currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>¡No hay más preguntas disponibles!</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleFinish}>
          <Text style={styles.backButtonText}>Ver Resultados</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <WebStyles />
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        
        <ScrollView 
          style={[styles.scrollView, Platform.OS === 'web' && styles.scrollViewWeb]} 
          contentContainerStyle={[styles.scrollContent, Platform.OS === 'web' && styles.scrollContentWeb]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          {...(Platform.OS === 'web' && { className: 'battle-scroll' })}
        >
          <ScoreBoard 
            players={[{
              uid: user?.uid || 'player1',
              nombre: player.name,
              magnetos: player.score
            }]} 
            currentTurnUid={null} 
          />
          
          <Text style={styles.title}>Modo Battle</Text>
          <View 
            style={styles.card}
            {...(Platform.OS === 'web' && { className: 'card-enter gpu-accelerated' })}
          >
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            {currentQuestion.options.map((opt, idx) => {
              const key = `${currentIndex}-${idx}-${opt.slice(0, 10)}`;
              const isSelected = selectedOption === idx;
              const isTheCorrectOne = isCorrect !== null && idx === (typeof currentQuestion.correctAnswer === 'number'
                ? currentQuestion.correctAnswer
                : currentQuestion.options.findIndex((o) => o.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()));
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionSelected,
                    isCorrect !== null && isTheCorrectOne && styles.optionCorrect,
                    isCorrect !== null && isSelected && !isTheCorrectOne && styles.optionWrong,
                  ]}
                  onPress={() => handleOptionPress(idx)}
                  disabled={selectedOption !== null}
                  {...(Platform.OS === 'web' && { 
                    className: `option-button focusable gpu-accelerated ${
                      isCorrect !== null && isTheCorrectOne ? 'option-correct' : ''
                    } ${
                      isCorrect !== null && isSelected && !isTheCorrectOne ? 'option-wrong' : ''
                    }`.trim()
                  })}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
            {selectedOption !== null && (
              <View style={styles.feedbackContainer}>
                <Text style={[styles.feedbackText, isCorrect ? styles.correctText : styles.wrongText]}>
                  {feedback}
                </Text>
                <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
                  <Text style={styles.nextButtonText}>Siguiente Pregunta</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Botón de finalizar dentro del ScrollView para evitar problemas de posicionamiento */}
          <TouchableOpacity 
            style={styles.finishButton} 
            onPress={handleFinish}
            {...(Platform.OS === 'web' && { className: 'button-ripple focusable gpu-accelerated' })}
          >
            <Text style={styles.finishButtonText}>Finalizar partida</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

// --- Estilos ---------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    ...Platform.select({
      web: {
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden', // Evita que el body tenga scroll
      }
    })
  },
  scrollView: {
    flex: 1,
  },
  scrollViewWeb: Platform.OS === 'web' ? {
    // Los estilos de scrollbar y overflow se manejan en la clase CSS
    // para mayor especificidad.
  } : {},
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40, // Espacio extra al final para el botón
  },
  scrollContentWeb: Platform.OS === 'web' ? {
    minHeight: 'calc(100vh + 1px)', // Garantiza que siempre haya scroll
    paddingTop: 20,
    paddingBottom: 60,
  } : {},
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 28,
    color: COLORS.darkBlue,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...Platform.select({
      web: {
        // Estilos básicos, los avanzados están en CSS
        scrollSnapAlign: 'start',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  questionText: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    color: COLORS.darkBlue,
    marginBottom: 16,
    textAlign: 'center',
  },
  optionButton: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.gray,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 6,
    ...Platform.select({
      web: {
        // Los efectos avanzados están en CSS
        cursor: 'pointer',
      },
      default: {
        shadowColor: COLORS.gray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  optionText: {
    fontFamily: FONTS.text,
    fontSize: 16,
    color: COLORS.darkBlue,
  },
  optionSelected: {
    borderColor: COLORS.blue,
    backgroundColor: COLORS.blue + '10',
  },
  optionCorrect: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '20',
  },
  optionWrong: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + '20',
  },
  feedbackContainer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 12,
  },
  feedbackText: {
    fontFamily: FONTS.text,
    fontSize: 16,
    textAlign: 'center',
  },
  correctText: {
    color: COLORS.success,
  },
  wrongText: {
    color: COLORS.error,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  nextButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: FONTS.text,
    fontSize: 16,
    color: COLORS.darkBlue,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  finishButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginHorizontal: 0,
    ...Platform.select({
      web: {
        // Los efectos avanzados están en CSS
        cursor: 'pointer',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  finishButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 18,
  },

});