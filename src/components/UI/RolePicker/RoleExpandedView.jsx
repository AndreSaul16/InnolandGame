import React, { useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Animated,
  StatusBar,
  ScrollView,
} from "react-native";
import { XMarkIcon, CheckIcon, UserCircleIcon } from "react-native-heroicons/solid";
import { COLORS, FONTS } from '../../../theme';

export default function RoleExpandedView({ 
  role, 
  description, 
  IconComponent, 
  onClose, 
  onConfirm, 
  disabled, 
  rolesState = {} 
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const isRoleTaken = rolesState[role]?.status === 'taken';
  const confirmDisabled = disabled || isRoleTaken;

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => onClose());
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.7)" translucent />
      
      <TouchableOpacity 
        style={styles.backdrop} 
        onPress={handleClose}
        activeOpacity={1}
      />
      
      <Animated.View style={[
        styles.modal,
        {
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <XMarkIcon size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            {IconComponent ? (
              <IconComponent size={64} color={COLORS.primary} />
            ) : (
              <UserCircleIcon size={64} color={COLORS.primary} />
            )}
          </View>

          {/* Role Title */}
          <Text style={styles.roleTitle}>{role}</Text>

          {/* Description */}
          <Text style={styles.roleDescription}>{description}</Text>

          {/* Warning if taken */}
          {isRoleTaken && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                Este rol ya está ocupado por otro jugador
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              confirmDisabled && styles.confirmButtonDisabled
            ]}
            onPress={onConfirm}
            disabled={confirmDisabled}
            activeOpacity={0.8}
          >
            <CheckIcon size={20} color={COLORS.white} />
            <Text style={styles.confirmButtonText}>
              {isRoleTaken ? 'Rol ocupado' : 'Confirmar selección'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },

  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  roleTitle: {
    fontFamily: FONTS.title,
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    textAlign: 'center',
    marginBottom: 16,
  },

  roleDescription: {
    fontFamily: FONTS.text,
    fontSize: 16,
    color: COLORS.blue,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    marginBottom: 24,
  },

  warningContainer: {
    backgroundColor: COLORS.error + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },

  warningText: {
    fontFamily: FONTS.text,
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: '600',
  },

  actions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray + '20',
  },

  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  confirmButtonDisabled: {
    backgroundColor: COLORS.gray,
    shadowOpacity: 0,
    elevation: 0,
  },

  confirmButtonText: {
    fontFamily: FONTS.text,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 8,
  },

  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontFamily: FONTS.text,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
  },
});