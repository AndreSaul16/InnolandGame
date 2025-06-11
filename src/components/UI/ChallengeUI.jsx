import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Animated, Easing, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AudioChallenge from '../challenges/AudioChallenge';

// Este componente solo muestra el reto y recoge la respuesta del usuario
const ChallengeUI = ({ challenge, onSubmit, loading, validationResult }) => {
  const [userInput, setUserInput] = useState('');
  const animValue = useRef(new Animated.Value(0)).current;

  // Limpiar el input si cambia el reto
  useEffect(() => {
    setUserInput('');
  }, [challenge]);

  // Animación para el resultado
  useEffect(() => {
    if (validationResult) {
      animValue.setValue(0);
      Animated.spring(animValue, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [validationResult]);

  if (!challenge) {
    return <Text>Esperando un reto para mostrar...</Text>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.question}>{challenge.question}</Text>
        <TextInput
          style={[styles.input, { minHeight: 60, fontSize: 18 }]}
          placeholder={challenge.placeholder}
          value={userInput}
          onChangeText={setUserInput}
          placeholderTextColor="#b0b0b0"
          multiline
        />
        <View style={styles.buttonContainer}>
          <Button
            title="Enviar Respuesta"
            onPress={() => {
              Keyboard.dismiss();
              onSubmit(userInput);
            }}
            disabled={loading || !userInput}
            color="#4F8EF7"
          />
        </View>
        {loading && <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#4F8EF7" />}
        {validationResult && (
          <Animated.View
            style={[
              styles.resultBox,
              {
                backgroundColor: validationResult.isCorrect ? '#d4edda' : '#f8d7da',
                borderColor: validationResult.isCorrect ? '#28a745' : '#dc3545',
                shadowColor: validationResult.isCorrect ? '#28a745' : '#dc3545',
                transform: [
                  {
                    scale: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1],
                    }),
                  },
                  {
                    rotate: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-10deg', '0deg'],
                    }),
                  },
                ],
                opacity: animValue,
              },
            ]}
          >
            <Text style={[styles.resultTitle, { color: validationResult.isCorrect ? '#155724' : '#721c24' }]}> 
              {validationResult.isCorrect ? '¡CORRECTO!' : 'INCORRECTO'}
            </Text>
            <Text style={styles.feedbackText}>{validationResult.feedback}</Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#22223b',
    letterSpacing: 1,
  },
  question: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    color: '#4F8EF7',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#4F8EF7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    fontSize: 17,
    width: '100%',
    backgroundColor: '#fff',
    shadowColor: '#4F8EF7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContainer: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#4F8EF7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  resultBox: {
    marginTop: 28,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  feedbackText: {
    fontSize: 17,
    textAlign: 'center',
  },
});

export default ChallengeUI;
