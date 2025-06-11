import React from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ChallengeManager from './src/components/UI/ChallengeManager';

const retoEjemplo = {
  title: 'Reto de ejemplo',
  question: '¿Cuál es la capital de Francia?',
  placeholder: 'Escribe tu respuesta aquí...'
};

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <ChallengeManager />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
