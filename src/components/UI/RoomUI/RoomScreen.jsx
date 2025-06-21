import React, { useState, useEffect, useContext } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import RoomLobby from './RoomLobby';
import { listenToRoomData } from '../../../services/FirebaseDataService';
import { useNavigation } from '@react-navigation/native';
import { showAlert } from '../../../utils/showAlert';
import { UserContext } from '../../../context/UserContext';
import LoadingScreen from '../../../utils/LoadingScreen';

// RoomScreen.jsx
// Componente que escucha los datos de la sala y muestra el lobby con la lista de jugadores y el acceso a la sala de espera.

const RoomScreen = ({ route }) => {
  const { roomCode, user, isHost } = route.params;
  const [roomData, setRoomData] = useState(null);
  const navigation = useNavigation();
  const [timeoutError, setTimeoutError] = useState(false);
  const timerRef = React.useRef(null);
  const { setRoomCode, loading } = useContext(UserContext);

  useEffect(() => {
    if (roomCode) setRoomCode(roomCode);
    return () => setRoomCode(null);
  }, [roomCode, setRoomCode]);

  useEffect(() => {
    if (!roomCode) return;
    setTimeoutError(false);
    console.log('[RoomScreen] useEffect: Suscribiéndose a listenToRoomData con roomCode =', roomCode);
    const unsubscribe = listenToRoomData(roomCode, (data) => {
      console.log('[RoomScreen] Datos recibidos de la sala:', data);
      setRoomData(data);
      if (data && timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        console.log('[RoomScreen] Timeout limpiado al recibir datos de la sala.');
      }
      if (!data) {
        setTimeoutError(true);
        console.log('[RoomScreen] No se recibieron datos de la sala, timeoutError = true');
      }
    });
    // Si en 7 segundos no hay datos, mostrar error
    timerRef.current = setTimeout(() => {
      setTimeoutError(true);
      console.log('[RoomScreen] Timeout: No se pudo entrar a la sala.');
      showAlert('Error', 'No se pudo entrar a la sala. Verifica el código o tu conexión.');
    }, 7000);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      unsubscribe();
      console.log('[RoomScreen] useEffect: Cleanup ejecutado');
    };
  }, [roomCode]);

  if (timeoutError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', fontSize: 18, textAlign: 'center' }}>No se pudo entrar a la sala.\nVerifica el código o tu conexión.</Text>
      </View>
    );
  }

  if (loading || !roomData || !roomData.code) {
    return <LoadingScreen message="Cargando sala..." />;
  }

  // Pasar la lista de jugadores a RoomLobby
  console.log('[RoomScreen] roomData completo:', roomData);
  const players = roomData.players ? Object.values(roomData.players) : [];
  const player = roomData.players?.[user.uid];

  // Determinar dinámicamente si el usuario es host basándose en los datos de Firebase
  const isUserHost = player?.isHost || false;

  if (roomData.status === 'in_progress' && (!player || !player.role)) {
    console.log('[RoomScreen] Navegando a RolePickerScreen porque la sala está en progreso y el usuario no tiene rol.');
    navigation.replace('RolePickerScreen', {
      roomCode: roomData.code,
      user,
      onRoleSelected: (role) => {
        navigation.replace('GameScreen', {
          roomCode: roomData.code,
          user: { ...user, role },
        });
      },
    });
    return null;
  }

  return (
    <RoomLobby
      roomCode={roomData.code}
      user={user}
      isHost={isUserHost}
      players={players}
    />
  );
};

export default RoomScreen; 