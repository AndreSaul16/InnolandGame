import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Modal, View, Text, Pressable } from 'react-native';
import { COLORS, FONTS } from '../../../theme';
import { getAuth, signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * LogoutButton.jsx
 * Botón flotante para cerrar sesión (logout), reutilizable.
 * Props:
 *  - onLogout: función opcional a ejecutar tras cerrar sesión correctamente
 */
const LogoutButton = ({ onLogout }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleConfirm = async () => {
    setModalVisible(false);
    try {
      const auth = getAuth();
      await signOut(auth);
      if (onLogout) onLogout();
    } catch (error) {
      // Aquí podrías mostrar un mensaje de error si lo deseas
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.logoutButton}
        activeOpacity={0.7}
        accessibilityLabel="Cerrar sesión"
      >
        <MaterialIcons name="logout" size={28} color="white" />
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cerrar sesión</Text>
            <Text style={styles.modalText}>
              ¿Seguro que quieres cerrar sesión? Tendrás que iniciar sesión de nuevo para volver a jugar.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmText}>Cerrar sesión</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    position: 'absolute',
    zIndex: 10,
    top: 56,
    left: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    // Sombra solo en móvil
    ...((typeof window === 'undefined' || window.navigator?.product !== 'ReactNativeWeb') ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 8,
    } : {}),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: FONTS.title,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    marginLeft: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontFamily: FONTS.text,
    fontSize: 16,
  },
  confirmText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontFamily: FONTS.text,
    fontSize: 16,
  },
});

export default LogoutButton; 