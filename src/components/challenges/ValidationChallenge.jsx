// src/components/challenges/ValidationChallenge.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView
} from 'react-native';
import OpenAIService from '../../services/OpenAIService';
import { COLORS, FONTS } from '../../theme';
import { useScreenSize, getScrollViewStyles } from '../../utils/useScreenSize';
import {
  CheckCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  PaperAirplaneIcon,
  SparklesIcon
} from 'react-native-heroicons/solid';

// El componente ahora recibe 'challenge' y 'playerRole' como props
const ValidationChallenge = ({ challenge, playerRole }) => {
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Hook para detectar tamaño de pantalla
  const screenSize = useScreenSize();
  const scrollViewStyles = getScrollViewStyles(screenSize.needsScroll);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  // EFECTO SECUNDARIO: Limpiar el estado cuando cambia el reto.
  // Esto evita que se muestre la respuesta de un reto anterior al cargar uno nuevo.
  useEffect(() => {
    setUserInput('');
    setResult(null);
  }, [challenge]);

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, [challenge]);

  // Animación para el resultado
  useEffect(() => {
    if (result) {
      resultAnim.setValue(0);
      Animated.spring(resultAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [result]);

  const handleSubmit = async () => {
    // Usamos el 'challenge' y el 'playerRole' que vienen de los props
    if (!userInput.trim() || !challenge || !playerRole) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // CORRECCIÓN: Pasamos el rol dinámico en lugar de uno fijo.
      const evaluation = await OpenAIService.evaluateAnswer(
        challenge.criteria,
        userInput,
        playerRole
      );

      setResult(evaluation);
    } catch (error) {
      console.error('Error en validación:', error);
      setResult({
        isCorrect: false,
        feedback: 'Error al validar la respuesta. Por favor, intenta de nuevo.'
      });
    }

    setLoading(false);
  };

  // Si el componente padre no nos pasa un reto, mostramos un mensaje.
  if (!challenge) {
    return (
      <View style={[styles.waitingContainer, scrollViewStyles.container]}>
        <SparklesIcon size={48} color={COLORS.primary} />
        <Text style={styles.waitingText}>Esperando un reto de validación...</Text>
      </View>
    );
  }

  // CORRECCIÓN: Usamos 'challenge' en lugar de 'currentChallenge' en la UI.
  return (
    <View style={[styles.wrapper, scrollViewStyles.container]}>
      <ScrollView 
        style={[styles.scrollView, scrollViewStyles.scrollView]}
        contentContainerStyle={[
          styles.scrollContainer, 
          scrollViewStyles.content,
          // Añadir padding extra en pantallas pequeñas
          screenSize.isSmall && styles.smallScreenPadding
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          {/* Header del reto */}
          <View style={styles.challengeHeader}>
            <LightBulbIcon size={28} color={COLORS.primary} />
            <Text style={[
              styles.title,
              screenSize.isSmall && styles.smallTitle
            ]}>
              {challenge.title}
            </Text>
          </View>

          {/* Pregunta del reto */}
          <View style={styles.questionCard}>
            <Text style={[
              styles.question,
              screenSize.isSmall && styles.smallQuestion
            ]}>
              {challenge.question}
            </Text>
          </View>
          
          {/* Input de respuesta */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tu respuesta:</Text>
            <TextInput
              style={[
                styles.input,
                screenSize.isSmall && styles.smallInput
              ]}
              placeholder={challenge.placeholder || "Escribe tu respuesta aquí..."}
              value={userInput}
              onChangeText={setUserInput}
              placeholderTextColor={COLORS.gray}
              multiline
              textAlignVertical="top"
              numberOfLines={screenSize.isSmall ? 2 : 3}
            />
          </View>
          
          {/* Botón de validación */}
          <TouchableOpacity
            style={[
              styles.validateButton,
              (!userInput.trim() || loading) && styles.validateButtonDisabled,
              screenSize.isSmall && styles.smallButton
            ]}
            onPress={handleSubmit}
            disabled={loading || !userInput.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <PaperAirplaneIcon size={20} color={COLORS.white} />
                <Text style={[
                  styles.validateButtonText,
                  screenSize.isSmall && styles.smallButtonText
                ]}>
                  Validar Respuesta
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Resultado de validación */}
          {result && (
            <Animated.View
              style={[
                styles.resultContainer,
                result.isCorrect ? styles.successResult : styles.errorResult,
                screenSize.isSmall && styles.smallResult,
                {
                  opacity: resultAnim,
                  transform: [{
                    scale: resultAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  }]
                }
              ]}
            >
              <View style={styles.resultHeader}>
                {result.isCorrect ? (
                  <CheckCircleIcon 
                    size={screenSize.isSmall ? 28 : 36} 
                    color={COLORS.success} 
                  />
                ) : (
                  <XCircleIcon 
                    size={screenSize.isSmall ? 28 : 36} 
                    color={COLORS.error} 
                  />
                )}
                <Text style={[
                  styles.resultTitle,
                  result.isCorrect ? styles.successTitle : styles.errorTitle,
                  screenSize.isSmall && styles.smallResultTitle
                ]}>
                  {result.isCorrect ? '¡CORRECTO!' : 'INCORRECTO'}
                </Text>
              </View>

              <Text style={[
                styles.feedbackText,
                screenSize.isSmall && styles.smallFeedback
              ]}>
                {result.feedback}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollView: {
    flex: 1,
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },

  smallScreenPadding: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  container: {
    padding: 20,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },

  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  waitingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    textAlign: 'center',
    fontWeight: '500',
  },

  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.darkBlue,
    fontFamily: FONTS.title,
  },

  smallTitle: {
    fontSize: 20,
  },

  questionCard: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: `0 4px 12px ${COLORS.primary}20`,
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

  question: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    lineHeight: 24,
    fontWeight: '500',
  },

  smallQuestion: {
    fontSize: 14,
    lineHeight: 20,
  },

  inputContainer: {
    marginBottom: 24,
  },

  inputLabel: {
    fontSize: 16,
    fontFamily: FONTS.text,
    fontWeight: '600',
    color: COLORS.darkBlue,
    marginBottom: 12,
  },

  input: {
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: FONTS.text,
    backgroundColor: COLORS.white,
    minHeight: 100,
    ...Platform.select({
      web: {
        boxShadow: `0 2px 8px ${COLORS.gray}20`,
        outlineStyle: 'none',
      },
      default: {
        shadowColor: COLORS.gray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },

  smallInput: {
    minHeight: 80,
    padding: 12,
    fontSize: 14,
  },

  validateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
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

  smallButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },

  validateButtonDisabled: {
    backgroundColor: COLORS.gray,
    ...Platform.select({
      web: {
        boxShadow: 'none',
      },
      default: {
        shadowOpacity: 0,
        elevation: 0,
      },
    }),
  },

  validateButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },

  smallButtonText: {
    fontSize: 16,
  },

  resultContainer: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: `0 8px 24px rgba(0,0,0,0.15)`,
      },
      default: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
      },
    }),
  },

  smallResult: {
    padding: 16,
    borderRadius: 16,
  },

  successResult: {
    backgroundColor: COLORS.success + '15',
    borderColor: COLORS.success,
  },

  errorResult: {
    backgroundColor: COLORS.error + '15',
    borderColor: COLORS.error,
  },

  resultHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: FONTS.title,
    letterSpacing: 1,
  },

  smallResultTitle: {
    fontSize: 18,
  },

  successTitle: {
    color: COLORS.success,
  },

  errorTitle: {
    color: COLORS.error,
  },

  feedbackText: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    lineHeight: 24,
  },

  smallFeedback: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ValidationChallenge;

/**
 * Valida la respuesta de un usuario para un reto usando la API de OpenAI.
 * @param {string} challengeCriteria - Criterios de evaluación del reto.
 * @param {string} userAnswer - Respuesta del usuario.
 * @param {string} playerRole - Rol del jugador.
 * @returns {Promise<{isCorrect: boolean, feedback: string}>}
 */
export async function validateChallengeAnswer(challengeCriteria, userAnswer, playerRole) {
  return await OpenAIService.evaluateAnswer(challengeCriteria, userAnswer, playerRole);
}