// src/components/challenges/ValidationChallenge.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import OpenAIService from '../../services/OpenAIService';

// El componente ahora recibe 'challenge' y 'playerRole' como props
const ValidationChallenge = ({ challenge, playerRole }) => {
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // EFECTO SECUNDARIO: Limpiar el estado cuando cambia el reto.
  // Esto evita que se muestre la respuesta de un reto anterior al cargar uno nuevo.
  useEffect(() => {
    setUserInput('');
    setResult(null);
  }, [challenge]);

  const handleSubmit = async () => {
    // Usamos el 'challenge' y el 'playerRole' que vienen de los props
    if (!userInput || !challenge || !playerRole) {
      return;
    }

    setLoading(true);
    setResult(null);

    // CORRECCIÓN: Pasamos el rol dinámico en lugar de uno fijo.
    const evaluation = await OpenAIService.evaluateAnswer(
      challenge.criteria,
      userInput,
      playerRole
    );

    setResult(evaluation);
    setLoading(false);
  };

  // Si el componente padre no nos pasa un reto, mostramos un mensaje.
  if (!challenge) {
    return <Text>Esperando un reto de validación...</Text>;
  }

  // CORRECCIÓN: Usamos 'challenge' en lugar de 'currentChallenge' en la UI.
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.question}>{challenge.question}</Text>
      
      <TextInput
        style={styles.input}
        placeholder={challenge.placeholder}
        value={userInput}
        onChangeText={setUserInput}
      />
      
      <Button title="Validar Respuesta" onPress={handleSubmit} disabled={loading} />

      {loading && <ActivityIndicator style={{ marginTop: 20 }} size="large" />}

      {result && (
        <View style={[styles.resultBox, { backgroundColor: result.isCorrect ? '#d4edda' : '#f8d7da' }]}>
          <Text style={[styles.resultTitle, { color: result.isCorrect ? '#155724' : '#721c24' }]}>
            {result.isCorrect ? '¡CORRECTO!' : 'INCORRECTO'}
          </Text>
          <Text style={styles.feedbackText}>{result.feedback}</Text>
        </View>
      )}
    </View>
  );
};

// --- Los estilos se mantienen igual ---
const styles = StyleSheet.create({
  container: {
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  question: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6c757d',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 16,
  },
  resultBox: {
    marginTop: 20,
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  feedbackText: {
    fontSize: 16,
  },
});

export default ValidationChallenge;
