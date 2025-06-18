import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

const OfflineCardModal = ({ visible, onClose, onResult, playerName }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>¿Has respondido correctamente este reto?</Text>
          {playerName && (
            <Text style={styles.subtitle}>Jugador: <Text style={styles.playerName}>{playerName}</Text></Text>
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.yesButton]}
              onPress={() => { onResult(true); onClose(); }}
            >
              <Text style={styles.buttonText}>Sí</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.noButton]}
              onPress={() => { onResult(false); onClose(); }}
            >
              <Text style={styles.buttonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay || 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  title: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  playerName: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: COLORS.success,
  },
  noButton: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    color: COLORS.buttonText || '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OfflineCardModal; 