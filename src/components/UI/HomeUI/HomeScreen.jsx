import React, { useRef, useState, useEffect, useContext } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
  TouchableOpacity,
  Text,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Platform,
} from "react-native";
import {
  PlusIcon,
  UserGroupIcon,
  XMarkIcon,
  BoltIcon,
} from "react-native-heroicons/solid";
import ProfileHeader from "./ProfileHeader";
import MagnetCount from "./MagnetCount";
import LastGameDashboard from "./LastGameDashboard";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS } from "../../../theme";
import {
  createRoom,
  getUsersTotalMagnetos,
  listenLastGameForUser,
  joinRoom,
  takeRole,
  getUserActiveRoom,
} from "../../../services/FirebaseDataService";
import { showAlert } from "../../../utils/showAlert";
import RoleList from "../RolePicker/RoleList";
import LogoutButton from "./LogoutButton";
import ProfileScreen from '../UserUI/ProfileScreen';
import { UserContext } from '../../../context/UserContext';
import LoadingScreen from '../../../utils/LoadingScreen';

// 🔥 Helper para estilos específicos de web
const getWebScrollStyles = () => {
  if (Platform.OS !== 'web') return {};
  
  return {
    container: {
      height: '100vh',
      maxHeight: '100vh',
    },
    scrollView: {
      height: '100%',
      overflow: 'scroll',
      WebkitOverflowScrolling: 'touch',
    },
    scrollContent: {
      minHeight: '100vh', // Asegurar que sea scrolleable
    },
  };
};

const HomeScreen = ({ route, user: userProp, navigation: navigationProp }) => {
  const navigation = useNavigation();
  const { user, loading } = useContext(UserContext);
  const [userToShow, setUserToShow] = useState(user);
  const [magnetos, setMagnetos] = useState(userToShow?.magnetos ?? 0);
  const [lastGame, setLastGame] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Animaciones
  const [animating, setAnimating] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Estados de modales
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingRoomData, setPendingRoomData] = useState(null);
  const [pendingRoleUser, setPendingRoleUser] = useState(null);

  // Animaciones de modales
  const joinModalAnim = useRef(new Animated.Value(0)).current;
  const joinModalScale = useRef(new Animated.Value(0.9)).current;

  // 🔥 Obtener estilos específicos para web
  const webStyles = getWebScrollStyles();

  // ... resto de tu lógica (useEffect, handlers, etc.) ...
  useEffect(() => {
    if (!user) {
      navigation.replace('LoginScreen');
      return;
    }
    setUserToShow(user);
  }, [user, navigation]);

  // Redirigir automáticamente a la sala si hay roomCode guardado
  const { roomCode } = useContext(UserContext);
  useEffect(() => {
    if (user && roomCode) {
      navigation.replace('RoomScreen', {
        roomCode,
        user,
        isHost: user.isHost || false,
      });
    }
  }, [user, roomCode, navigation]);

  useEffect(() => {
    if (!userToShow?.uid) return;

    getUsersTotalMagnetos([userToShow.uid]).then((res) => {
      setMagnetos(res[userToShow.uid] ?? 0);
    });

    const unsubscribe = listenLastGameForUser(userToShow.uid, (data) => {
      setLastGame(data);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [userToShow?.uid]);

  useEffect(() => {
    if (joinModalVisible) {
      Animated.parallel([
        Animated.timing(joinModalAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(joinModalScale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(joinModalAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(joinModalScale, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [joinModalVisible]);

  const handleStartGame = async () => {
    setAnimating(true);
    try {
      const code = await createRoom(userToShow);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: Platform.OS !== 'web',
        easing: Easing.out(Easing.cubic),
      }).start(() => {
        setAnimating(false);
        fadeAnim.setValue(1);
        navigation.navigate("RoomScreen", {
          roomCode: code,
          user: userToShow,
          isHost: true,
        });
      });
    } catch (error) {
      setAnimating(false);
      fadeAnim.setValue(1);
      console.error("Error al crear la sala:", error);
    }
  };

  const handleJoinGame = async () => {
    if (!joinCode.trim()) {
      showAlert("Error", "Por favor, ingresa el código de la sala.");
      return;
    }

    setJoinLoading(true);
    try {
      await joinRoom(joinCode.trim().toUpperCase(), userToShow);

      const db = require("firebase/database").getDatabase();
      const refRoom = require("firebase/database").ref;
      const get = require("firebase/database").get;
      const roomRef = refRoom(db, `rooms/${joinCode.trim().toUpperCase()}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        throw new Error("La sala no existe");
      }

      const roomData = snapshot.val();
      setJoinModalVisible(false);
      setJoinLoading(false);

      if (roomData.status === "in_progress") {
        setPendingRoomData({
          roomCode: joinCode.trim().toUpperCase(),
          user: userToShow,
        });
        setPendingRoleUser(userToShow);
        setShowRoleModal(true);
        return;
      }

      navigation.navigate("RoomScreen", {
        roomCode: joinCode.trim().toUpperCase(),
        user: userToShow,
        isHost: false,
      });
    } catch (error) {
      setJoinLoading(false);
      showAlert("Error", error.message || "No se pudo unir a la sala.");
    }
  };

  const handleRoleConfirmed = async (roleName) => {
    if (!pendingRoomData || !pendingRoleUser) return;
    try {
      await takeRole(
        pendingRoomData.roomCode,
        roleName,
        pendingRoleUser.uid,
        pendingRoleUser.nombre ||
          pendingRoleUser.username ||
          pendingRoleUser.email
      );
      setShowRoleModal(false);
      navigation.replace("GameScreen", {
        roomCode: pendingRoomData.roomCode,
        user: { ...pendingRoleUser, role: roleName },
      });
      setPendingRoomData(null);
      setPendingRoleUser(null);
    } catch (e) {
      showAlert("Error", "No se pudo seleccionar el rol. Intenta de nuevo.");
    }
  };

  const handleLogout = () => {
    if (navigation && navigation.replace) {
      navigation.replace("LoginScreen");
    } else if (navigationProp && navigationProp.replace) {
      navigationProp.replace("LoginScreen");
    }
  };

  const closeJoinModal = () => {
    setJoinModalVisible(false);
    setJoinCode("");
  };

  // Función para recargar los datos del usuario tras editar el perfil
  const refreshUserData = async () => {
    try {
      const { getUserData } = await import('../../../services/FirebaseDataService');
      const freshUser = await getUserData(userToShow.uid);
      setUserToShow(freshUser);
    } catch (e) {
      // fallback: no hacer nada
    }
  };

  // Redirigir automáticamente según el estado de la sala activa
  useEffect(() => {
    const checkActiveRoom = async () => {
      if (user && user.uid) {
        const activeRoom = await getUserActiveRoom(user.uid);
        if (activeRoom) {
          if (activeRoom.roomData.status === 'in_progress') {
            navigation.replace('GameScreen', {
              roomCode: activeRoom.roomCode,
              user,
            });
          } else {
            navigation.replace('RoomScreen', {
              roomCode: activeRoom.roomCode,
              user,
            });
          }
        }
      }
    };
    checkActiveRoom();
  }, [user, navigation]);

  if (loading) {
    return <LoadingScreen message="Cargando menú principal..." />;
  }

  return (
    <View style={[styles.container, webStyles.container]}>
      <Animated.View
        style={[
          styles.animatedContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        {/* Contenedor para el botón de logout arriba */}
        <View style={styles.logoutContainer}>
          <LogoutButton onLogout={handleLogout} />
        </View>

        <ScrollView
          style={[styles.scrollView, webStyles.scrollView]}
          contentContainerStyle={[styles.scrollContent, webStyles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={require("../../../../assets/logo/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <TouchableOpacity onPress={() => setShowProfileModal(true)} activeOpacity={0.8}>
            <ProfileHeader user={userToShow} />
          </TouchableOpacity>
          <MagnetCount count={magnetos} />

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, animating && { opacity: 0.7 }]}
              onPress={animating ? undefined : handleStartGame}
              activeOpacity={0.8}
              disabled={animating}
            >
              <PlusIcon size={24} color={COLORS.white} />
              <Text style={styles.primaryButtonText}>Crear Sala</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, animating && { opacity: 0.7 }]}
              onPress={() => navigation.navigate('BattleScreen')}
              activeOpacity={0.8}
              disabled={animating}
            >
              <BoltIcon size={24} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Modo Battle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, animating && { opacity: 0.7 }]}
              onPress={() => setJoinModalVisible(true)}
              activeOpacity={0.8}
              disabled={animating}
            >
              <UserGroupIcon size={24} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Unirse a Partida</Text>
            </TouchableOpacity>
          </View>

          <LastGameDashboard
            lastGame={
              lastGame
                ? {
                    score: lastGame.magnetosPartida ?? lastGame.score ?? 0,
                    turno: lastGame.turno ?? "-",
                    date: lastGame.date ?? "-",
                  }
                : null
            }
          />
        </ScrollView>

        {/* Resto de modales igual que antes... */}

        {/* Modal de perfil de usuario */}
        <Modal
          visible={showProfileModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowProfileModal(false)}
        >
          <ProfileScreen
            user={userToShow}
            onGoBack={async () => {
              setShowProfileModal(false);
              await refreshUserData();
            }}
          />
        </Modal>

        <Modal
          visible={joinModalVisible}
          transparent
          animationType="none"
          onRequestClose={closeJoinModal}
          statusBarTranslucent
        >
          <Animated.View
            style={[styles.modalOverlay, { opacity: joinModalAnim }]}
          >
            <TouchableOpacity
              style={styles.modalBackdrop}
              onPress={closeJoinModal}
              activeOpacity={1}
            />

            <Animated.View
              style={[
                styles.joinModal,
                {
                  opacity: joinModalAnim,
                  transform: [{ scale: joinModalScale }],
                },
              ]}
            >
              <View style={styles.joinModalHeader}>
                <Text style={styles.joinModalTitle}>Unirse a Partida</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeJoinModal}
                  activeOpacity={0.7}
                >
                  <XMarkIcon size={24} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              <Text style={styles.joinModalSubtitle}>
                Ingresa el código de 4 letras de la sala
              </Text>

              <TextInput
                style={styles.codeInput}
                placeholder="Ej: ABCD"
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                maxLength={4}
                placeholderTextColor={COLORS.gray}
              />

              <TouchableOpacity
                style={[
                  styles.joinButton,
                  (!joinCode.trim() || joinLoading) &&
                    styles.joinButtonDisabled,
                ]}
                onPress={handleJoinGame}
                disabled={!joinCode.trim() || joinLoading}
                activeOpacity={0.8}
              >
                {joinLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <UserGroupIcon size={20} color={COLORS.white} />
                    <Text style={styles.joinButtonText}>Unirse</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Modal>

        <Modal
          visible={showRoleModal}
          transparent
          animationType="slide"
          onRequestClose={() => {}}
          statusBarTranslucent
        >
          <View style={styles.roleModalOverlay}>
            <RoleList
              roomCode={pendingRoomData?.roomCode}
              user={pendingRoleUser}
              onRoleConfirmed={handleRoleConfirmed}
              style={styles.roleModalContent}
            />
          </View>
        </Modal>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  animatedContainer: {
    flex: 1,
  },

  logoutContainer: {
    width: '100%',
    alignItems: 'flex-end',
    paddingTop: 24,
    paddingRight: 24,
    zIndex: 10,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    paddingBottom: 50,
  },

  logo: {
    width: 260,
    height: 60,
    marginBottom: 32,
    marginTop: 10,
  },

  actionsContainer: {
    width: "100%",
    marginBottom: 32,
    gap: 16,
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: `0 4px 8px ${COLORS.primary}4D`,
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },

  primaryButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },

  secondaryButton: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: `0 2px 4px ${COLORS.darkBlue}1A`,
      },
      default: {
        shadowColor: COLORS.darkBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },

  secondaryButtonText: {
    color: COLORS.primary,
    fontFamily: FONTS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  joinModal: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    width: "90%",
    maxWidth: 360,
    ...Platform.select({
      web: {
        boxShadow: `0 8px 16px ${COLORS.black}40`,
      },
      default: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
      },
    }),
  },

  joinModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  joinModalTitle: {
    fontSize: 24,
    fontFamily: FONTS.title,
    fontWeight: "bold",
    color: COLORS.darkBlue,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray + "20",
    justifyContent: "center",
    alignItems: "center",
  },

  joinModalSubtitle: {
    fontSize: 16,
    fontFamily: FONTS.text,
    color: COLORS.blue,
    marginBottom: 24,
    opacity: 0.8,
  },

  codeInput: {
    borderWidth: 2,
    borderColor: COLORS.gray + "40",
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontFamily: FONTS.text,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.darkBlue,
    backgroundColor: COLORS.white,
    marginBottom: 24,
    letterSpacing: 4,
  },

  joinButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  joinButtonDisabled: {
    backgroundColor: COLORS.gray,
    shadowOpacity: 0,
    elevation: 0,
  },

  joinButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },

  roleModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  roleModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    maxHeight: "90%",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
});

export default HomeScreen;