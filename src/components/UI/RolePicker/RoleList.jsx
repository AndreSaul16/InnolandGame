import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
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
} from "react-native-heroicons/solid";
import { COLORS, FONTS } from '../../../theme';

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

const SimpleRoleButton = ({ role, isSelected, onPress, buttonStyle }) => {
  const IconComponent = iconComponents[role.icon];
  return (
    <TouchableOpacity
      onPress={() => onPress(role.name)}
      style={[
        buttonStyle,
        styles.button,
        isSelected ? styles.buttonSelected : styles.buttonUnselected,
      ]}
      activeOpacity={0.9}
    >
      {IconComponent && (
        <IconComponent size={36} color={isSelected ? "#fff" : COLORS.darkBlue} style={{ marginBottom: 8 }} />
      )}
      <Text
        style={[
          styles.buttonText,
          isSelected ? styles.buttonTextSelected : styles.buttonTextUnselected,
        ]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {role.name}
      </Text>
    </TouchableOpacity>
  );
};

export default function RoleList({ selectedRole, onRoleSelect }) {
  // Obtener dimensiones de pantalla
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const CARD_WIDTH = SCREEN_WIDTH * 0.44; // 2 columnas con margen
  const CARD_HEIGHT = CARD_WIDTH * 0.9; // Relación de aspecto

  // Estilos dinámicos para los recuadros
  const dynamicStyles = StyleSheet.create({
    itemContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    },
    button: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 6,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona un Rol</Text>
      <Text style={styles.subtitle}>Elige el rol con el que estas jugando</Text>
      <FlatList
        data={PLAYER_ROLES_DATA}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.rolesListContainer}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <View style={dynamicStyles.itemContainer}>
            <SimpleRoleButton
              role={item}
              isSelected={selectedRole === item.name}
              onPress={onRoleSelect}
              buttonStyle={dynamicStyles.button}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.title,
    color: COLORS.darkBlue,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: COLORS.blue,
    fontSize: 16,
    marginBottom: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  rolesListContainer: {
    paddingBottom: 16,
    paddingTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 6,
  },
  buttonSelected: {
    backgroundColor: COLORS.blue,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonUnselected: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.darkBlue,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.2,
    fontFamily: FONTS.text,
  },
  buttonTextSelected: {
    color: COLORS.white,
  },
  buttonTextUnselected: {
    color: COLORS.darkBlue,
  },
  buttonDescription: {
    color: COLORS.gray,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 16,
  },
});
