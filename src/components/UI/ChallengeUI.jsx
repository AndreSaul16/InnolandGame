import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator, 
  Animated, 
  Easing, 
  Keyboard,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView
} from 'react-native';
import AudioChallenge from '../challenges/AudioChallenge';
import { validateChallengeAnswer } from '../challenges/ValidationChallenge';
import { COLORS, FONTS } from '../../theme';
import { useScreenSize, getScrollViewStyles } from '../../utils/useScreenSize';
import { useRoute, useNavigation } from '@react-navigation/native';
import { addMagnetosToPlayerInRoom, addMagnetosToUser } from '../../services/FirebaseDataService';
import {
  PaperAirplaneIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  FireIcon
} from 'react-native-heroicons/solid';

// Este componente solo muestra el reto y recoge la respuesta del usuario
const ChallengeUI = (props) => {
  const route = useRoute();
  const navigation = useNavigation();
  const screenSize = useScreenSize();
  const scrollViewStyles = getScrollViewStyles(screenSize.needsScroll);

  // Permite recibir props directos o desde navegación
  const challenge = props.challenge ?? route.params?.challenge;
  const playerRole = props.playerRole ?? route.params?.playerRole ?? 'Jugador';
  const roomCode = route.params?.roomCode;
  const user = route.params?.user;
  // Recibe el jugador en turno desde navigation
  const turnoPlayerUid = props.turnoPlayerUid ?? route.params?.turnoPlayerUid;
  const turnoPlayerNombre = props.turnoPlayerNombre ?? route.params?.turnoPlayerNombre;

  // Log para verificar los datos recibidos al montar el componente
  useEffect(() => {
    console.log(`[LOG][ChallengeUI] Componente montado. Reto: "${challenge?.title}". Jugador en turno recibido: ${turnoPlayerNombre} (UID: ${turnoPlayerUid})`);
  }, []);

  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Limpiar el input si cambia el reto
  useEffect(() => {
    setUserInput('');
    setValidationResult(null);
  }, [challenge]);

  // Animación para el resultado
  useEffect(() => {
    if (validationResult) {
      resultAnim.setValue(0);
      Animated.spring(resultAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [validationResult]);

  // Handler para enviar respuesta y validar con IA
  const handleSubmit = async (input) => {
    if (!challenge) return;
    setLoading(true);
    setValidationResult(null);
    console.log('[LOG][ChallengeUI] handleSubmit llamado', { input, challenge, playerRole, roomCode, user, turnoPlayerUid, turnoPlayerNombre });
    try {
      const result = await validateChallengeAnswer(
        challenge.criteria,
        input,
        playerRole
      );
      console.log('[LOG][ChallengeUI] Resultado de validación:', result);
      setValidationResult(result);
      // Si la respuesta es correcta, suma magnetos al jugador en turno
      if (result.isCorrect && roomCode && turnoPlayerUid) {
        try {
          console.log(`[LOG][ChallengeUI] Asignando 10 magnetos a ${turnoPlayerNombre} (UID: ${turnoPlayerUid}) en la sala ${roomCode}.`);
          await addMagnetosToPlayerInRoom(roomCode, turnoPlayerUid, 10); // Suma 10 magnetos por reto correcto en la room
          console.log('[LOG][ChallengeUI] Magnetos sumados correctamente en la room');
          await addMagnetosToUser(turnoPlayerUid, 10); // Suma 10 magnetos al usuario global
          console.log('[LOG][ChallengeUI] Magnetos sumados correctamente al usuario global');
        } catch (e) {
          console.error('[LOG][ChallengeUI] Error al sumar magnetos por reto correcto:', e);
        }
      }
    } catch (error) {
      console.error('[LOG][ChallengeUI] Error validando la respuesta:', error);
      setValidationResult({
        isCorrect: false,
        feedback: 'Error validando la respuesta. Inténtalo de nuevo.'
      });
    }
    setLoading(false);
  };

  // Handler para el botón de regresar
  const handleBack = () => {
    if (typeof props.onBack === 'function') {
      props.onBack();
    } else {
      navigation.goBack();
    }
  };

  if (!challenge) {
    return (
      <View style={[styles.loadingContainer, scrollViewStyles.container]}>
        <LightBulbIcon size={64} color={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>
          Esperando un reto para mostrar...
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.safeArea,
      Platform.OS !== 'web' && { flex: 1 },
      scrollViewStyles.container
    ]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      {Platform.OS === 'web' ? (
        <View
          style={[
            scrollViewStyles.scrollView,
            { ...styles.webScrollView },
            screenSize.isSmall && styles.smallScreenPadding
          ]}
        >
          <Animated.View style={[
            styles.container,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
          ]}>
            {/* Header del reto */}
            <View style={styles.challengeHeader}>
              <LightBulbIcon size={32} color={COLORS.primary} />
              <Text style={styles.title}>{challenge.title}</Text>
            </View>
            {/* Pregunta del reto */}
            <View style={styles.questionCard}>
              <Text style={styles.question}>{challenge.question}</Text>
            </View>
            {/* Input de respuesta */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tu respuesta:</Text>
              <TextInput
                style={styles.input}
                placeholder={challenge.placeholder || "Escribe tu respuesta aquí..."}
                value={userInput}
                onChangeText={setUserInput}
                placeholderTextColor={COLORS.gray}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
              />
            </View>
            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!userInput.trim() || loading || validationResult) && styles.submitButtonDisabled
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  handleSubmit(userInput);
                }}
                disabled={loading || !userInput.trim() || !!validationResult}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <PaperAirplaneIcon size={20} color={COLORS.white} />
                    <Text style={styles.submitButtonText}>Enviar Respuesta</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.backButton,
                  !validationResult && styles.backButtonDisabled
                ]}
                onPress={handleBack}
                disabled={!validationResult}
                activeOpacity={0.8}
              >
                <ArrowLeftIcon size={20} color={validationResult ? COLORS.blue : COLORS.gray} />
                <Text style={[
                  styles.backButtonText,
                  !validationResult && styles.backButtonTextDisabled
                ]}>
                  Regresar
                </Text>
              </TouchableOpacity>
            </View>
            {/* Resultado de validación */}
            {validationResult && (
              <Animated.View
                style={[
                  styles.resultContainer,
                  validationResult.isCorrect ? styles.successResult : styles.errorResult,
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
                  {validationResult.isCorrect ? (
                    <CheckCircleIcon size={40} color={COLORS.success} />
                  ) : (
                    <XCircleIcon size={40} color={COLORS.error} />
                  )}
                  <Text style={[
                    styles.resultTitle,
                    validationResult.isCorrect ? styles.successTitle : styles.errorTitle
                  ]}>
                    {validationResult.isCorrect ? '¡CORRECTO!' : 'INCORRECTO'}
                  </Text>
                </View>
                <Text style={styles.feedbackText}>{validationResult.feedback}</Text>
                {validationResult.isCorrect && (
                  <View style={styles.rewardContainer}>
                    <FireIcon size={20} color={COLORS.primary} />
                    <Text style={styles.rewardText}>+10 magnetos obtenidos</Text>
                  </View>
                )}
              </Animated.View>
            )}
            {/* Margen inferior para mejor scroll UX */}
            <View style={{ height: 32 }} />
          </Animated.View>
        </View>
      ) : (
        <ScrollView
          style={[styles.scrollView, scrollViewStyles.scrollView]}
          contentContainerStyle={[
            styles.scrollContent,
            scrollViewStyles.content,
            screenSize.isSmall && styles.smallScreenPadding
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[
            styles.container,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
          ]}>
            {/* Header del reto */}
            <View style={styles.challengeHeader}>
              <LightBulbIcon size={32} color={COLORS.primary} />
              <Text style={styles.title}>{challenge.title}</Text>
            </View>
            {/* Pregunta del reto */}
            <View style={styles.questionCard}>
              <Text style={styles.question}>{challenge.question}</Text>
            </View>
            {/* Input de respuesta */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tu respuesta:</Text>
              <TextInput
                style={styles.input}
                placeholder={challenge.placeholder || "Escribe tu respuesta aquí..."}
                value={userInput}
                onChangeText={setUserInput}
                placeholderTextColor={COLORS.gray}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
              />
            </View>
            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!userInput.trim() || loading || validationResult) && styles.submitButtonDisabled
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  handleSubmit(userInput);
                }}
                disabled={loading || !userInput.trim() || !!validationResult}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <PaperAirplaneIcon size={20} color={COLORS.white} />
                    <Text style={styles.submitButtonText}>Enviar Respuesta</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.backButton,
                  !validationResult && styles.backButtonDisabled
                ]}
                onPress={handleBack}
                disabled={!validationResult}
                activeOpacity={0.8}
              >
                <ArrowLeftIcon size={20} color={validationResult ? COLORS.blue : COLORS.gray} />
                <Text style={[
                  styles.backButtonText,
                  !validationResult && styles.backButtonTextDisabled
                ]}>
                  Regresar
                </Text>
              </TouchableOpacity>
            </View>
            {/* Resultado de validación */}
            {validationResult && (
              <Animated.View
                style={[
                  styles.resultContainer,
                  validationResult.isCorrect ? styles.successResult : styles.errorResult,
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
                  {validationResult.isCorrect ? (
                    <CheckCircleIcon size={40} color={COLORS.success} />
                  ) : (
                    <XCircleIcon size={40} color={COLORS.error} />
                  )}
                  <Text style={[
                    styles.resultTitle,
                    validationResult.isCorrect ? styles.successTitle : styles.errorTitle
                  ]}>
                    {validationResult.isCorrect ? '¡CORRECTO!' : 'INCORRECTO'}
                  </Text>
                </View>
                <Text style={styles.feedbackText}>{validationResult.feedback}</Text>
                {validationResult.isCorrect && (
                  <View style={styles.rewardContainer}>
                    <FireIcon size={20} color={COLORS.primary} />
                    <Text style={styles.rewardText}>+10 magnetos obtenidos</Text>
                  </View>
                )}
              </Animated.View>
            )}
            {/* Margen inferior para mejor scroll UX */}
            <View style={{ height: 32 }} />
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    paddingBottom: 32,
  },

  smallScreenPadding: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'flex-start',
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
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },

  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },

  challengeHeader: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.darkBlue,
    fontFamily: FONTS.title,
    letterSpacing: 0.5,
  },

  questionCard: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
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
    fontSize: 18,
    textAlign: 'center',
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    lineHeight: 26,
    fontWeight: '500',
  },

  inputContainer: {
    marginBottom: 32,
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
    minHeight: 120,
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

  actionButtons: {
    gap: 16,
    marginBottom: 24,
  },

  submitButton: {
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

  submitButtonDisabled: {
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

  submitButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },

  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.blue,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  backButtonDisabled: {
    borderColor: COLORS.gray,
    opacity: 0.5,
  },

  backButtonText: {
    color: COLORS.blue,
    fontFamily: FONTS.text,
    fontSize: 16,
    fontWeight: '600',
  },

  backButtonTextDisabled: {
    color: COLORS.gray,
  },

  resultContainer: {
    borderRadius: 20,
    padding: 24,
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
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: FONTS.title,
    letterSpacing: 1,
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
    marginBottom: 16,
  },

  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },

  rewardText: {
    fontFamily: FONTS.text,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  webScrollView: {
    overflowY: 'auto',
    height: '100vh',
    maxHeight: '100vh',
    WebkitOverflowScrolling: 'touch',
  },
});

export default ChallengeUI;