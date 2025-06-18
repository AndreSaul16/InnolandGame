import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Modal, View, Text, Pressable } from 'react-native';
import { XMarkIcon } from 'react-native-heroicons/solid';
import { COLORS, FONTS } from '../../../theme';

/**
 * EndGameButton.jsx
 * Botón flotante de cerrar/terminar partida (X), reutilizable.
 * Props:
 *  - onPress: función a ejecutar al pulsar la X
 */
const EndGameButton = ({ onPress }) => {
  const [modalVisible, setModalVisible] = useState(false);
  console.log('[EndGameButton] Renderizado');

  const handleConfirm = () => {
    setModalVisible(false);
    onPress && onPress();
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.closeButton}
        activeOpacity={0.7}
        accessibilityLabel="Terminar partida"
      >
        <XMarkIcon size={28} color="white" />
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Terminar partida</Text>
            <Text style={styles.modalText}>
              ¿Seguro que quieres terminar la partida? Esto llevará a todos a la pantalla de resultados.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmText}>Terminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
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

export default EndGameButton; 