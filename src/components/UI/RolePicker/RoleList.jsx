import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
  Dimensions,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { PLAYER_ROLES_DATA } from "../../../data/gameState";
import {
  SparklesIcon,
  LightBulbIcon,
  CpuChipIcon,
  MapPinIcon,
  AcademicCapIcon,
  ChartBarIcon,
  EyeIcon,
  PaintBrushIcon,
  UserCircleIcon,
} from "react-native-heroicons/solid";
import { COLORS, FONTS } from '../../../theme';
import RoleExpandedView from './RoleExpandedView';
import { listenRoomRoles, takeRole } from '../../../services/FirebaseDataService';

const iconComponents = {
  SparklesIcon,
  LightBulbIcon,
  CpuChipIcon,
  MapPinIcon,
  AcademicCapIcon,
  ChartBarIcon,
  EyeIcon,
  PaintBrushIcon,
};

const RoleButton = ({ role, isSelected, onPress, disabled }) => {
  const IconComponent = iconComponents[role.icon];
  
  return (
    <TouchableOpacity
      onPress={() => onPress(role.name)}
      style={[
        styles.roleCard,
        isSelected && styles.roleCardSelected,
        disabled && styles.roleCardDisabled,
      ]}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.roleCardContent}>
        <View style={[
          styles.iconContainer,
          isSelected && styles.iconContainerSelected,
          disabled && styles.iconContainerDisabled,
        ]}>
          {IconComponent ? (
            <IconComponent 
              size={24} 
              color={disabled ? COLORS.gray : isSelected ? COLORS.white : COLORS.darkBlue} 
            />
          ) : (
            <UserCircleIcon 
              size={24} 
              color={disabled ? COLORS.gray : isSelected ? COLORS.white : COLORS.darkBlue} 
            />
          )}
        </View>
        
        <View style={styles.roleInfo}>
          <Text style={[
            styles.roleName,
            isSelected && styles.roleNameSelected,
            disabled && styles.roleNameDisabled,
          ]}>
            {role.name}
          </Text>
          {role.shortDescription && (
            <Text style={[
              styles.roleDescription,
              disabled && styles.roleDescriptionDisabled,
            ]}>
              {role.shortDescription}
            </Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <View style={styles.selectedDot} />
          </View>
        )}
      </View>
      
      {disabled && (
        <View style={styles.disabledOverlay}>
          <Text style={styles.disabledText}>Ocupado</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function RoleList({ roomCode, user, onRoleConfirmed, style }) {
  const [rolesState, setRolesState] = useState({});
  const [selectedRole, setSelectedRole] = useState(user?.role || null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedRoleObj, setSelectedRoleObj] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [loading, setLoading] = useState(true);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  useEffect(() => {
    if (!roomCode) return;
    setLoading(true);
    const unsubscribe = listenRoomRoles(roomCode, (roles) => {
      setRolesState(roles || {});
      setLoading(false);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [roomCode]);

  const handleRoleSelect = (roleName) => {
    const roleObj = PLAYER_ROLES_DATA.find(r => r.name === roleName);
    setSelectedRoleObj(roleObj);
    setShowDetail(true);
  };

  const handleRoleConfirm = async (roleName) => {
    setUpdatingRole(true);
    try {
      await takeRole(roomCode, roleName, user.uid, user.nombre || user.username || user.email);
      setSelectedRole(roleName);
      setShowDetail(false);
      setSelectedRoleObj(null);
      if (onRoleConfirmed) onRoleConfirmed(roleName);
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar el rol. Intenta de nuevo.');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedRoleObj(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando roles...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Selecciona tu Rol</Text>
        <Text style={styles.subtitle}>Cada rol tiene habilidades únicas</Text>
      </View>

      <FlatList
        data={PLAYER_ROLES_DATA}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <RoleButton
            role={item}
            isSelected={selectedRole === item.name}
            onPress={handleRoleSelect}
            disabled={rolesState[item.name]?.status === 'taken'}
          />
        )}
        contentContainerStyle={styles.rolesList}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showDetail && !!selectedRoleObj}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDetail}
        statusBarTranslucent
      >
        <RoleExpandedView
          role={selectedRoleObj?.name}
          description={selectedRoleObj?.description}
          IconComponent={selectedRoleObj?.icon ? iconComponents[selectedRoleObj.icon] : null}
          onClose={handleCloseDetail}
          onConfirm={async () => await handleRoleConfirm(selectedRoleObj.name)}
          disabled={updatingRole}
          rolesState={rolesState}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  
  loadingText: {
    marginTop: 16,
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    fontSize: 16,
    fontWeight: '500',
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
  },

  title: {
    fontFamily: FONTS.title,
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontFamily: FONTS.text,
    fontSize: 16,
    color: COLORS.blue,
    textAlign: 'center',
    opacity: 0.8,
  },

  rolesList: {
    paddingBottom: 20,
  },

  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray + '30',
    ...Platform.select({
      web: {
        boxShadow: `0 2px 8px ${COLORS.darkBlue}1A`,
      },
      default: {
        shadowColor: COLORS.darkBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },

  roleCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.darkBlue,
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: `0 4px 12px ${COLORS.primary}33`,
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },

  roleCardDisabled: {
    opacity: 0.6,
  },

  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  iconContainerSelected: {
    backgroundColor: COLORS.darkBlue,
  },

  iconContainerDisabled: {
    backgroundColor: COLORS.gray + '20',
  },

  roleInfo: {
    flex: 1,
  },

  roleName: {
    fontFamily: FONTS.text,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    marginBottom: 4,
  },

  roleNameSelected: {
    color: COLORS.white,
  },

  roleNameDisabled: {
    color: COLORS.gray,
  },

  roleDescription: {
    fontFamily: FONTS.text,
    fontSize: 14,
    color: COLORS.blue,
    opacity: 0.7,
    lineHeight: 18,
  },

  roleDescriptionDisabled: {
    color: COLORS.gray,
  },

  selectedIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.darkBlue,
  },

  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white + 'CC',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  disabledText: {
    fontFamily: FONTS.text,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.error,
  },
});