import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, Modal, Platform } from 'react-native';
import { COLORS, FONTS } from '../../../theme';
import { XMarkIcon } from 'react-native-heroicons/solid';

// Lista de imágenes predefinidas (rutas locales)
const AVATAR_IMAGES = [
  require('../../../../assets/roles/Agente Territorial.png'),
  require('../../../../assets/roles/Ciudadano_Innovador.png'),
  require('../../../../assets/roles/Conector del ecosistema.png'),
  require('../../../../assets/roles/Diseñador Flash.png'),
  require('../../../../assets/roles/Experto en IA.png'),
  require('../../../../assets/roles/Explorador de tendencias.png'),
  require('../../../../assets/roles/Facilitador de Innovación.png'),
  require('../../../../assets/roles/Hacker ético.png'),
  require('../../../../assets/roles/Inversor visionario.png'),
  require('../../../../assets/roles/Joven talento.png'),
];

const AvatarPicker = ({ visible, onClose, onSelectAvatar }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Elige tu avatar</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <XMarkIcon size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* Grid de avatares */}
          <FlatList
            data={AVATAR_IMAGES}
            keyExtractor={(_, idx) => idx.toString()}
            numColumns={2}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() => {
                  onSelectAvatar(item);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Image source={item} style={styles.avatarImage} />
              </TouchableOpacity>
            )}
          />
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
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      },
      default: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 16,
      },
    }),
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
  grid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    margin: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    width: 120,
    height: 120,
    backgroundColor: COLORS.white,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export { AVATAR_IMAGES };
export default AvatarPicker; 