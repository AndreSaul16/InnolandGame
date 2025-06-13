import React, { useState, useRef, useEffect } from 'react';
import { Platform, StatusBar, Animated, Easing, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RoleList from './RoleList';
import RoleExpandedView from './RoleExpandedView';
import { PLAYER_ROLES_DATA } from '../../../data/gameState';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS } from '../../../theme';

const RolePicker = ({ user, onRoleConfirm }) => {
  const [expandedRole, setExpandedRole] = useState(null);
  const [showExpanded, setShowExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  // Busca el objeto de rol completo por nombre
  const selectedRoleObj = PLAYER_ROLES_DATA.find(r => r.name === expandedRole);
  const IconComponent = selectedRoleObj ? require('react-native-heroicons/solid')[selectedRoleObj.icon] : null;

  // Animación de entrada y salida para RoleExpandedView
  useEffect(() => {
    if (expandedRole && selectedRoleObj && !isClosing) {
      setShowExpanded(true);
      setIsAnimating(true);
      animValue.setValue(0);
      bgOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(animValue, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(bgOpacity, {
          toValue: 0.85,
          duration: 250,
          useNativeDriver: false,
        })
      ]).start(() => setIsAnimating(false));
    }
  }, [expandedRole, selectedRoleObj, isClosing]);

  // Animación de salida cuando isClosing es true
  useEffect(() => {
    if (isClosing) {
      setIsAnimating(true);
      Animated.parallel([
        Animated.timing(animValue, {
          toValue: 0,
          duration: 350,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(bgOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: false,
        })
      ]).start(() => {
        setShowExpanded(false);
        setIsAnimating(false);
        setIsClosing(false);
        setExpandedRole(null);
      });
    }
  }, [isClosing]);

  // Fade-in al montar el componente
  useEffect(() => {
    Animated.timing(fadeInAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, []);

  // Handler para cerrar con animación
  const handleClose = () => {
    if (!isAnimating && !isClosing) setIsClosing(true);
  };

  // Handler para regresar
  const handleBack = () => {
    if (!isAnimating && !isClosing) navigation.navigate('Home', { user });
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeInAnim }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
        {/* Botón de regresar */}
        <View style={{ padding: 12 }}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'< '}Regresar</Text>
          </TouchableOpacity>
        </View>
        <RoleList
          selectedRole={expandedRole}
          onRoleSelect={roleName => {
            if (!isAnimating && !isClosing) setExpandedRole(roleName);
          }}
        />
        {showExpanded && selectedRoleObj && (
          <>
            {/* Fondo oscuro animado */}
            <Animated.View
              pointerEvents={"auto"}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#0F172A',
                opacity: bgOpacity,
                zIndex: 10,
              }}
            />
            {/* Contenido animado */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 11,
                opacity: animValue,
                transform: [
                  {
                    scale: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }),
                  },
                  {
                    rotate: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-10deg', '0deg'],
                    }),
                  },
                ],
              }}
            >
              <RoleExpandedView
                role={selectedRoleObj.name}
                description={selectedRoleObj.description}
                IconComponent={IconComponent}
                onClose={handleClose}
                onConfirm={() => onRoleConfirm && onRoleConfirm(selectedRoleObj.name)}
                disabled={isAnimating || isClosing}
              />
            </Animated.View>
          </>
        )}
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    elevation: 2,
  },
  backButtonText: {
    color: COLORS.darkBlue,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RolePicker;