import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import RoomLobby from './RoomLobby';
import { listenToRoomData } from '../../../services/FirebaseDataService';
import { useNavigation } from '@react-navigation/native';

// RoomScreen.jsx
// Componente que escucha los datos de la sala y muestra el lobby con la lista de jugadores y el acceso a la sala de espera.

const RoomScreen = ({ route }) => {
  const { roomCode, user, isHost } = route.params;
  const [roomData, setRoomData] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (!roomCode) return;
    const unsubscribe = listenToRoomData(roomCode, (data) => {
      setRoomData(data);
      // --- ELIMINADO: navegación automática a GameScreen ---
      // if (data && data.status === 'in_progress') {
      //   navigation.replace('Game', { roomCode: data.code, user, isHost });
      // }
    });
    return () => unsubscribe();
  }, [roomCode]);

  if (!roomData || !roomData.code) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Entrando a la sala...</Text>
      </View>
    );
  }

  // Pasar la lista de jugadores a RoomLobby
  const players = roomData.players ? Object.values(roomData.players) : [];

  return (
    <RoomLobby
      roomCode={roomData.code}
      user={user}
      isHost={isHost}
      players={players}
    />
  );
};

export default RoomScreen; 