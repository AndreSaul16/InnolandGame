import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, FONTS } from '../../../theme';
import { XMarkIcon, CheckIcon } from 'react-native-heroicons/solid';

const PlayerSelectorModal = ({ visible, players = [], onSelect, onClose }) => {
  const [selectedUid, setSelectedUid] = useState(null);

  const handleConfirm = () => {
    const selectedPlayer = players.find(p => p.uid === selectedUid);
    if (selectedPlayer) {
      onSelect(selectedPlayer);
      setSelectedUid(null);
    }
  };

  const handleClose = () => {
    setSelectedUid(null);
    onClose && onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Selecciona al perdedor</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <XMarkIcon size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* Lista de jugadores */}
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {players.map(player => (
              <TouchableOpacity
                key={player.uid}
                style={[
                  styles.playerItem,
                  selectedUid === player.uid && styles.selectedPlayerItem
                ]}
                onPress={() => setSelectedUid(player.uid)}
                activeOpacity={0.8}
              >
                <Text style={styles.playerName}>{player.nombre || player.username || player.email}</Text>
                {selectedUid === player.uid && (
                  <CheckIcon size={20} color={COLORS.success} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Acciones */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton, !selectedUid && styles.disabledButton]}
              onPress={handleConfirm}
              disabled={!selectedUid}
            >
              <Text style={styles.confirmButtonText}>Confirmar</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
  },
  closeButton: {
    padding: 4,
  },
  list: {
    maxHeight: 260,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.gray + '10',
    marginBottom: 8,
  },
  selectedPlayerItem: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  playerName: {
    fontSize: 16,
    fontFamily: FONTS.text,
    color: COLORS.darkBlue,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.gray + '20',
  },
  cancelButtonText: {
    color: COLORS.gray,
    fontFamily: FONTS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: COLORS.gray,
  },
});

export default PlayerSelectorModal; 