import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, Modal, Animated, Easing, Alert } from 'react-native';
import { COLORS, FONTS } from '../../../theme';
import { listenRoomPlayers, updateRoomStatus, listenToRoomData, takeRole, leaveRoom, deleteRoom, listenRoomRoles } from '../../../services/FirebaseDataService';
import { useNavigation } from '@react-navigation/native';
import { XMarkIcon } from 'react-native-heroicons/solid';
import RoleList from '../RolePicker/RoleList';
import RoleExpandedView from '../RolePicker/RoleExpandedView';
import { getDatabase, ref, update, onValue, off } from 'firebase/database';
import { PLAYER_ROLES_DATA } from '../../../data/gameState';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// RoomLobby.jsx
// Componente de sala de espera: muestra el código de la sala, los jugadores conectados y permite al host iniciar la partida.

const RoomLobby = ({ roomCode, user, isHost, players = [], gameMode = 'classic' }) => {
  const navigation = useNavigation();
  const [roomStatus, setRoomStatus] = useState('waiting');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(gameMode !== 'battle' && !user?.role);

  // Handler para empezar la partida
  const handleStartGame = async () => {
    await updateRoomStatus(roomCode, 'in_progress');
    if (gameMode === 'battle') {
      navigation.navigate('BattleScreen', { roomCode, user: { ...user, isHost: true } });
    } else {
      navigation.navigate('GameScreen', { roomCode, user: { ...user, isHost: true } });
    }
  };

  // Handler para salir de la sala
  const handleLeaveRoom = async () => {
    setShowLeaveModal(false);
    if (isHost) {
      try {
        await deleteRoom(roomCode);
      } catch (e) {}
      if (roomStatus === 'in_progress') {
        navigation.replace('ScoreBoard', { roomCode, user });
      } else {
        navigation.replace('Home', { user });
      }
    } else {
      try {
        await leaveRoom(roomCode, user.uid);
      } catch (e) {}
      navigation.replace('Home', { user });
    }
  };

  // --- Efecto: Al entrar al lobby, asegurar que el estado es 'waiting' ---
  useEffect(() => {
    if (!roomCode) return;
    updateRoomStatus(roomCode, 'waiting');
  }, [roomCode]);

  // --- Efecto: Escuchar estado de la sala y navegar a GameScreen si in_progress ---
  useEffect(() => {
    if (!roomCode) return;
    const unsubscribe = listenToRoomData(roomCode, (roomData) => {
      if (roomData?.status) setRoomStatus(roomData.status);
      if (roomData?.status === 'in_progress') {
        navigation.replace('GameScreen', { roomCode, user });
      }
    });
    return () => unsubscribe && unsubscribe();
  }, [roomCode, user, navigation]);

  // --- Efecto: Listener para detectar cierre de sala por el host ---
  useEffect(() => {
    if (!roomCode || isHost) return;
    const unsubscribe = listenToRoomData(roomCode, (roomData) => {
      if (!roomData) {
        if (roomStatus === 'in_progress') {
          navigation.replace('ScoreBoard', { roomCode, user });
        } else {
          Alert.alert(
            'Sala cerrada',
            'El anfitrión ha cerrado la sala.',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('Home', { user })
              }
            ],
            { cancelable: false }
          );
        }
      }
    });
    return () => unsubscribe && unsubscribe();
  }, [roomCode, isHost, navigation, user, roomStatus]);

  // Log para saber si el usuario tiene rol
  useEffect(() => {
    if (gameMode === 'battle') {
      setShowRoleModal(false);
      return;
    }
    console.log('[RoomLobby] user:', user);
    if (!user?.role) {
      console.log('[RoomLobby] El usuario NO tiene rol. Mostrando modal de selección de rol.');
      setShowRoleModal(true);
    } else {
      console.log('[RoomLobby] El usuario YA tiene rol:', user.role);
      setShowRoleModal(false);
    }
  }, [user?.role, gameMode]);

  // Handler cuando el usuario confirma un rol
  const handleRoleConfirmed = (roleName) => {
    console.log('[RoomLobby] Rol confirmado por el usuario:', roleName);
    setShowRoleModal(false);
    // Aquí podrías actualizar el usuario localmente si lo necesitas
    // O recargar el usuario desde Firebase si tu flujo lo requiere
  };

  // --- Lógica para saber si todos están listos ---
  const allReady = players.length > 0 && players.every(p => p.isReady);

  // --- Renderizado ---
  return (
    <View style={styles.container}>
      {/* Modal automático de selección de rol (solo si no es battle) */}
      {gameMode !== 'battle' && (
        <Modal
          visible={showRoleModal}
          transparent
          animationType="slide"
          onRequestClose={() => {}}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <RoleList
              roomCode={roomCode}
              user={user}
              onRoleConfirmed={handleRoleConfirmed}
            />
          </View>
        </Modal>
      )}
      {/* Botón de salir sala */}
      <TouchableOpacity
        onPress={() => setShowLeaveModal(true)}
        style={styles.closeButton}
        activeOpacity={0.7}
        accessibilityLabel="Salir de la sala"
      >
        <XMarkIcon size={28} color="white" />
      </TouchableOpacity>
      {/* Modal de confirmación para salir de la sala */}
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxWidth: 340, alignItems: 'center' }]}> 
            <Text style={styles.modalTitle}>Salir de la sala</Text>
            <Text style={{ fontSize: 18, color: COLORS.black, textAlign: 'center', marginBottom: 20, fontFamily: FONTS.text }}>
              ¿Estás seguro de que quieres salir de la sala?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: COLORS.gray, flex: 1, marginRight: 8 }]}
                onPress={() => setShowLeaveModal(false)}
              >
                <Text style={[styles.startButtonText, { color: COLORS.darkBlue }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: COLORS.primary, flex: 1, marginLeft: 8 }]}
                onPress={handleLeaveRoom}
              >
                <Text style={styles.startButtonText}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.innerBox}>
        <Text style={styles.title}>Sala de Espera</Text>
        <Text style={styles.subtitle}>Comparte este código para que otros se unan:</Text>
        <Text selectable style={styles.roomCode}>{roomCode}</Text>
        <Text style={styles.subtitle}>Jugadores en la sala:</Text>
        {players.length === 0 ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <FlatList
            data={players}
            keyExtractor={item => item.uid}
            renderItem={({ item }) => (
              <Text style={[styles.player, item.isHost && styles.hostPlayer]}>
                {item.nombre || item.username || item.email}
                {item.isHost ? ' (Anfitrión)' : ''}
                {item.role ? ` - ${item.role}` : ' (Eligiendo rol...)'}
                {item.isReady ? ' ✅' : ''}
                {item.uid === user.uid && item.role && (
                  <Text
                    onPress={() => {
                      console.log('[RoomLobby] Usuario pulsa Cambiar rol');
                      setShowRoleModal(true);
                    }}
                    style={{ color: COLORS.blue, marginLeft: 8, textDecorationLine: 'underline', fontWeight: 'bold', fontFamily: FONTS.text }}
                  >
                    Cambiar rol
                  </Text>
                )}
              </Text>
            )}
            style={styles.playerList}
            contentContainerStyle={styles.playerListContent}
          />
        )}
        {isHost && (
          <TouchableOpacity style={[styles.startButton, { opacity: allReady ? 1 : 0.5 }]} onPress={handleStartGame} disabled={!allReady}>
            <Text style={styles.startButtonText}>Empezar Partida</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: 24,
  },
  closeButton: {
    position: 'absolute',
    zIndex: 10,
    top: 56,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  innerBox: {
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.title,
    color: COLORS.darkBlue,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.blue,
    fontFamily: FONTS.text,
    marginTop: 12,
    marginBottom: 4,
  },
  roomCode: {
    fontSize: 36,
    fontFamily: FONTS.title,
    color: COLORS.primary,
    letterSpacing: 6,
    marginBottom: 20,
    marginTop: 8,
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 8,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  playerList: {
    width: '100%',
    maxWidth: 380,
    marginVertical: 12,
    alignSelf: 'center',
  },
  playerListContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  player: {
    fontSize: 18,
    color: COLORS.black,
    fontFamily: FONTS.text,
    paddingVertical: 4,
    textAlign: 'center',
  },
  hostPlayer: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 24,
    alignItems: 'center',
    elevation: 2,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modalTitle: {
    fontSize: 28,
    fontFamily: FONTS.title,
    color: COLORS.darkBlue,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default RoomLobby; 