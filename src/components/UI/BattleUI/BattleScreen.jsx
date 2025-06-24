import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar, Platform } from 'react-native';
import OpenAIService from '../../../services/OpenAIService';
import { COLORS, FONTS } from '../../../theme';
import { useNavigation } from '@react-navigation/native';
import ScoreBoard from '../GameUI/ScoreBoard';
import { UserContext } from '../../../context/UserContext';

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
          height: 100vh !important;
          max-height: 100vh !important;
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
const INITIAL_QUEUE_SIZE = 2;

export default function BattleScreen() {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  
  // --- Estado del jugador ---
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

  // --- Inicialización de preguntas ---

  // --- Preguntas ---
  const fetchAndAppendQuestion = useCallback(async () => {
    try {
      const newChallenge = await OpenAIService.generateBattleChallenge();
      setQuestionQueue((prev) => [...prev, newChallenge]);
    } catch (err) {
      console.error('[BattleScreen] Error generando nuevo reto:', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const promises = Array.from({ length: INITIAL_QUEUE_SIZE }).map(() =>
          OpenAIService.generateBattleChallenge()
        );
        const initialQuestions = await Promise.all(promises);
        setQuestionQueue(initialQuestions);
      } catch (error) {
        console.error('[BattleScreen] Error cargando preguntas iniciales:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // --- Selección de respuesta ---
  const handleOptionPress = (optionIdx) => {
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
    
    // Actualizar puntuación del jugador
    if (wasCorrect) {
      setPlayer(prev => ({ ...prev, score: prev.score + 1 }));
    }
    
    // Precargar siguiente pregunta
    fetchAndAppendQuestion();
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    setFeedback('');
    setCurrentIndex((prev) => prev + 1);
  };

  // --- Finalizar partida ---
  const handleFinish = () => {
    navigation.replace('ResultsScreen', {
      players: [player],
      mode: 'battle',
      gameType: 'battle'
    });
  };



  // --- Render principal ---
  if (isLoading || questionQueue.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando preguntas del modo Battle...</Text>
      </View>
    );
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
          
          {/* Espacio adicional para testing del scroll */}
          {Platform.OS === 'web' && (
            <View style={{ height: 300, backgroundColor: 'transparent' }}>
              <Text style={{ textAlign: 'center', color: COLORS.gray, opacity: 0.5, marginTop: 100 }}>
                Área de scroll - puedes hacer scroll hacia abajo
              </Text>
            </View>
          )}
          
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
  },
  scrollView: {
    flex: 1,
  },
  scrollViewWeb: Platform.OS === 'web' ? {
    // Estilos básicos para web, los avanzados están en el CSS
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    overscrollBehavior: 'contain',
  } : {},
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40, // Espacio extra al final para el botón
  },
  scrollContentWeb: Platform.OS === 'web' ? {
    minHeight: 'calc(100vh + 200px)', // Forzar que sea más alto que la ventana
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