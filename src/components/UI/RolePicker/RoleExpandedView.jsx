import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { ArrowLeftIcon, UserCircleIcon } from "react-native-heroicons/solid";
import ConfirmButton from "./ConfirmButton";

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
    backgroundColor: '#ffffffa6',
  },
  expandedCard: {
    backgroundColor: '#1E40AF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    zIndex: 2001,
    elevation: 10,
  },
  expandedRoleTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  expandedRoleDescription: {
    color: '#E2E8F0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 12,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default RoleExpandedView; 