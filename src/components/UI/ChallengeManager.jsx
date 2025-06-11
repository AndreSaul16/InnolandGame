import React, { useState } from 'react';
import RolePicker from './RolePicker/RolePicker';
import CameraOpener from './CameraOpener';
import ChallengeUI from './ChallengeUI';
import challengesData from '../../data/challenges.json';
import { validateChallengeAnswer } from '../challenges/ValidationChallenge';

export default function ChallengeManager() {
  const [step, setStep] = useState('ROLE_SELECTION');
  const [playerRole, setPlayerRole] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Cuando el usuario confirma el rol
  const handleRoleConfirmed = (role) => {
    setPlayerRole(role);
    setStep('SCANNING');
  };

  // Cuando se escanea un QR
  const handleBarCodeScanned = ({ data }) => {
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
    return <RolePicker onRoleConfirm={handleRoleConfirmed} />;
  }

  if (step === 'SCANNING') {
    return (
      <CameraOpener
        onBarCodeScanned={handleBarCodeScanned}
        onClose={handleBackToRole}
        isScanned={!!qrCode}
        onRetryScan={handleRetryScan}
      />
    );
  }

  if (step === 'CHALLENGE') {
    return (
      <ChallengeUI
        challenge={currentChallenge}
        playerRole={playerRole}
        onSubmit={handleValidateAnswer}
        loading={loading}
        validationResult={validationResult}
      />
    );
  }
}
