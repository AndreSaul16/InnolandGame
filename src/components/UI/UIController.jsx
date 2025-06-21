// UIController.jsx
// Componente que gestiona la selección de rol, escaneo de QR y retos individuales ANTES de que la sala entre en modo partida (in_progress). Si la sala está en progreso, no navega automáticamente.

import React, { useState, useEffect } from 'react';
import CameraOpener from './CameraOpener';
import ChallengeUI from './ChallengeUI';
import challengesData from '../../data/challenges.json';
import { validateChallengeAnswer } from '../challenges/ValidationChallenge';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getDatabase, ref, onValue } from 'firebase/database';
import { View } from 'react-native';
import OfflineCardModal from './GameUI/OfflineCardModal';
import { addMagnetosToPlayerInRoom } from '../../services/FirebaseDataService';

export default function UIController() {
  const route = useRoute();
  const navigation = useNavigation();
  const user = route?.params?.user;
  const roomCode = route?.params?.roomCode;
  const [step, setStep] = useState('ROLE_SELECTION');
  const [playerRole, setPlayerRole] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [roomStatus, setRoomStatus] = useState(null);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineModalResult, setOfflineModalResult] = useState(null);

  // Si hay roomCode, escuchamos el status de la sala
  useEffect(() => {
    if (!roomCode) return;
    const db = getDatabase();
    const statusRef = ref(db, `rooms/${roomCode}/status`);
    const unsubscribe = onValue(statusRef, (snapshot) => {
      setRoomStatus(snapshot.val());
    });
    return () => unsubscribe();
  }, [roomCode]);

  // Eliminar navegación automática aquí
  // if (roomCode && roomStatus === 'in_progress') {
  //   navigation.replace('Game', { roomCode, user });
  //   return null;
  // }

  // Cuando el usuario confirma el rol
  const handleRoleConfirmed = (role) => {
    setPlayerRole(role);
    setStep('SCANNING');
  };

  // Cuando se escanea un QR
  const handleBarCodeScanned = ({ data }) => {
    // Detectar si es una carta offline
    let isOfflineCard = false;
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'offline') isOfflineCard = true;
    } catch (e) {
      if (data.trim().toLowerCase() === 'offline' || data.startsWith('offline')) {
        isOfflineCard = true;
      }
    }
    if (isOfflineCard) {
      setShowOfflineModal(true);
      setQrCode(data);
      setCurrentChallenge(null);
      setValidationResult(null);
      setStep('OFFLINE_MODAL');
      return;
    }
    setQrCode(data);
    // Buscar el reto correspondiente en challenges.json
    const challenge = challengesData.find((ch) => ch.id === data);
    setCurrentChallenge(challenge || null);
    setValidationResult(null);
    setStep('CHALLENGE');
  };

  // Volver a la selección de rol
  const handleBackToRole = () => {
    setStep('ROLE_SELECTION');
    setPlayerRole(null);
    setQrCode(null);
    setCurrentChallenge(null);
    setValidationResult(null);
  };

  // Volver a escanear
  const handleRetryScan = () => {
    setStep('SCANNING');
    setQrCode(null);
    setCurrentChallenge(null);
    setValidationResult(null);
  };

  // Nuevo handler para regresar a la cámara
  const handleBackToScan = () => {
    setStep('SCANNING');
    setQrCode(null);
    setCurrentChallenge(null);
    setValidationResult(null);
  };

  // Validar la respuesta del usuario
  const handleValidateAnswer = async (userInput) => {
    if (!currentChallenge || !playerRole) return;
    setLoading(true);
    setValidationResult(null);
    try {
      const result = await validateChallengeAnswer(
        currentChallenge.criteria,
        userInput,
        playerRole
      );
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isCorrect: false,
        feedback: 'Error validando la respuesta. Inténtalo de nuevo.'
      });
    }
    setLoading(false);
  };

  if (step === 'ROLE_SELECTION') {
    return (
      <View style={{ flex: 1 }}>
        {/* Placeholder for RolePicker component */}
      </View>
    );
  }

  if (step === 'SCANNING') {
    return (
      <View style={{ flex: 1 }}>
        <CameraOpener
          user={user}
          onBarCodeScanned={handleBarCodeScanned}
          onClose={handleBackToRole}
          isScanned={!!qrCode}
          onRetryScan={handleRetryScan}
        />
      </View>
    );
  }

  if (step === 'CHALLENGE') {
    return (
      <View style={{ flex: 1 }}>
        <ChallengeUI
          user={user}
          challenge={currentChallenge}
          playerRole={playerRole}
          onSubmit={handleValidateAnswer}
          loading={loading}
          validationResult={validationResult}
          onBack={handleBackToScan}
        />
      </View>
    );
  }

  if (step === 'OFFLINE_MODAL') {
    return (
      <OfflineCardModal
        visible={showOfflineModal}
        onClose={() => {
          setShowOfflineModal(false);
          setStep('SCANNING'); // Volver a escanear después del modal
        }}
        onResult={async (wasCorrect) => {
          setOfflineModalResult(wasCorrect);
          if (wasCorrect && user?.uid && roomCode) {
            try {
              await addMagnetosToPlayerInRoom(roomCode, user.uid, 10); // Suma 10 magnetos
              // Aquí podrías mostrar un feedback visual si lo deseas
            } catch (e) {
              console.error('Error al sumar magnetos por carta offline:', e);
            }
          }
        }}
        playerName={user?.nombre || user?.username || user?.email}
      />
    );
  }
}
