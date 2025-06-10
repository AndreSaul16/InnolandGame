import React, { useState, useEffect } from 'react';
import { View, Text, Button, Vibration, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Importamos todos los componentes que usaremos en las diferentes etapas.
import RolePicker from '../utils/RolePicker';
import CameraOpener from './CameraOpener';
import ValidationChallenge from '../challenges/ValidationChallenge';

// Importamos los datos del juego.
import challenges from '../../data/challenges.json';
import { PLAYER_ROLES, currentUser } from '../../data/gameState';

export default function ChallengeScreen() {
  // Estado para controlar en qué paso del flujo estamos.
  const [step, setStep] = useState('ROLE_SELECTION'); // Los pasos son: ROLE_SELECTION, SCANNING, CHALLENGE_VIEW
  
  // Estados para guardar la información del juego.
  const [playerRole, setPlayerRole] = useState(currentUser.defaultRole);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [isScanned, setIsScanned] = useState(false); // Estado para la cámara

  // Lógica para la versión web.
  useEffect(() => {
    if (Platform.OS === 'web') {
      setStep('CHALLENGE_VIEW');
      setCurrentChallenge(challenges.find(c => c.type === 'validation'));
    }
  }, []);


  // --- MANEJADORES DE EVENTOS ---

  // Se ejecuta cuando se confirma un rol, para pasar al escáner.
  const handleRoleConfirmed = (role) => {
    setPlayerRole(role);
    setStep('SCANNING');
  };
  
  // Se ejecuta cuando la cámara escanea un código QR.
  const handleBarCodeScanned = ({ data }) => {
    if (isScanned) return;
    setIsScanned(true);
    Vibration.vibrate();
    
    const foundChallenge = challenges.find(c => c.id === data);
    
    if (foundChallenge) {
      setCurrentChallenge(foundChallenge);
      setStep('CHALLENGE_VIEW'); // Pasamos a la vista del reto.
    } else {
      alert(`Código QR con valor "${data}" no es un reto válido.`);
      setTimeout(() => setIsScanned(false), 2000);
    }
  };

  // Resetea el estado para volver a la pantalla de escaneo.
  const handleScanAnother = () => {
    setCurrentChallenge(null);
    setIsScanned(false);
    setStep('SCANNING');
  };

  // --- RENDERIZADO CONDICIONAL BASADO EN EL PASO ACTUAL ---

  // PASO 1: Selección de Rol
  if (step === 'ROLE_SELECTION') {
    return <RolePicker onRoleConfirm={handleRoleConfirmed} />;
  }

  // PASO 2: Escaneo de QR
  if (step === 'SCANNING') {
    return (
      <CameraOpener 
        onBarCodeScanned={handleBarCodeScanned}
        isScanned={isScanned}
        onRetryScan={() => setIsScanned(false)}
        // Si el usuario cierra la cámara, vuelve a la selección de rol.
        onClose={() => setStep('ROLE_SELECTION')}
      />
    );
  }

  // PASO 3: Vista del Reto
  if (step === 'CHALLENGE_VIEW') {
    return (
      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 10 }}>
        <StatusBar style="dark" />
        {/* Aquí podrías volver a mostrar el rol seleccionado si quieres */}
        <Text className="text-center text-gray-500 mb-4">Rol seleccionado: {playerRole}</Text>
        
        <View className="border border-gray-200 rounded-lg p-2.5 min-h-[300px]">
          {currentChallenge ? (
            <ValidationChallenge challenge={currentChallenge} playerRole={playerRole} />
          ) : (
            <Text className="text-center italic text-gray-500 p-5">
              Cargando reto...
            </Text>
          )}
        </View>

        {Platform.OS !== 'web' && (
          <View className="mt-4 pb-5">
            <Button title="Escanear Otro Reto" onPress={handleScanAnother} />
          </View>
        )}
      </ScrollView>
    );
  }

  // Fallback por si algo sale mal.
  return <Text>Cargando aplicación...</Text>;
}
