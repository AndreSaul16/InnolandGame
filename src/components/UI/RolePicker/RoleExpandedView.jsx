import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { ArrowLeftIcon, UserCircleIcon } from "react-native-heroicons/solid";
import ConfirmButton from "./ConfirmButton";
import { COLORS, FONTS } from '../../../theme';

const { width: screenWidth } = Dimensions.get('window');

const RoleExpandedView = ({ role, description, IconComponent, onClose, onConfirm }) => (
  <View style={styles.expandedOverlay}>
    <TouchableOpacity 
      style={styles.expandedBackground} 
      onPress={onClose} 
      activeOpacity={1} 
    />
    <View style={styles.expandedCard}>
      {IconComponent ? (
        <IconComponent size={Math.max(48, screenWidth * 0.13)} color="white" />
      ) : (
        <UserCircleIcon size={Math.max(48, screenWidth * 0.13)} color="white" />
      )}
      <Text style={styles.expandedRoleTitle}>{role}</Text>
      <Text style={styles.expandedRoleDescription}>{description}</Text>
      <ConfirmButton onPress={onConfirm}>Confirmar rol</ConfirmButton>
      <TouchableOpacity style={styles.backButton} onPress={onClose}>
        <ArrowLeftIcon size={24} color="white" />
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  expandedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  expandedBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white + 'a6',
  },
  expandedCard: {
    backgroundColor: COLORS.blue,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    zIndex: 2001,
    elevation: 10,
  },
  expandedRoleTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    fontFamily: FONTS.title,
  },
  expandedRoleDescription: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: FONTS.text,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    marginTop: 12,
  },
  backButtonText: {
    color: COLORS.darkBlue,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: FONTS.text,
  },
});

export default RoleExpandedView; 