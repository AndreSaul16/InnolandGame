import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../../theme';

const ActionEventModal = ({ visible, onClose, players, magnetosToSubtract, onConfirm, event }) => {
  const [selectedUid, setSelectedUid] = useState(null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Acción: {event?.title || 'Evento de acción'}</Text>
          <Text style={styles.description}>{event?.description}</Text>
          <Text style={styles.subtitle}>Selecciona al jugador que perdió:</Text>
          <FlatList
            data={players}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.playerItem,
                  selectedUid === item.uid && styles.selectedPlayerItem,
                ]}
                onPress={() => setSelectedUid(item.uid)}
                activeOpacity={0.7}
              >
                <Text style={styles.playerName}>{item.nombre || item.username || item.email}</Text>
              </TouchableOpacity>
            )}
            style={styles.list}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, !selectedUid && { opacity: 0.5 }]}
              onPress={() => selectedUid && onConfirm(selectedUid)}
              disabled={!selectedUid}
            >
              <Text style={styles.confirmButtonText}>
                Penalizar ({magnetosToSubtract > 0 ? '-' : ''}{magnetosToSubtract} magnetos)
              </Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: 340,
    maxHeight: 500,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: FONTS.title,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.blue,
    fontFamily: FONTS.text,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  list: {
    alignSelf: 'stretch',
    marginBottom: 16,
    maxHeight: 180,
  },
  playerItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gray + '20',
    marginBottom: 8,
  },
  selectedPlayerItem: {
    backgroundColor: COLORS.primary + '30',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  playerName: {
    fontFamily: FONTS.text,
    fontSize: 16,
    color: COLORS.darkBlue,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 6,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 6,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default ActionEventModal; 