import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
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

const SimpleRoleButton = ({ role, isSelected, onPress }) => {
  const IconComponent = iconComponents[role.icon];
  return (
    <TouchableOpacity
      onPress={() => onPress(role.name)}
      style={[
        styles.button,
        isSelected ? styles.buttonSelected : styles.buttonUnselected,
      ]}
      activeOpacity={0.9}
    >
      {IconComponent && (
        <IconComponent size={36} color={isSelected ? "#fff" : "#60A5FA"} style={{ marginBottom: 8 }} />
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
      <Text style={styles.buttonDescription} numberOfLines={3} ellipsizeMode="tail">
        {role.description}
      </Text>
    </TouchableOpacity>
  );
};

export default function RoleList({ selectedRole, onRoleSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona un Rol</Text>
      <Text style={styles.subtitle}>Elige el rol que deseas asignar.</Text>
      <FlatList
        data={PLAYER_ROLES_DATA}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.rolesListContainer}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <SimpleRoleButton
              role={item}
              isSelected={selectedRole === item.name}
              onPress={onRoleSelect}
            />
          </View>
        )}
      />
    </View>
  );
}

const CARD_HEIGHT = 150;
const CARD_WIDTH = 170;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // gris oscuro
    padding: 20,
    justifyContent: "flex-start",
  },
  title: {
    color: "#1d2630",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#60A5FA",
    fontSize: 16,
    marginBottom: 18,
    textAlign: "center",
    fontWeight: "500",
  },
  rolesListContainer: {
    paddingBottom: 16,
    paddingTop: 8,
    justifyContent: "center",
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: 12,
  },
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
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonSelected: {
    backgroundColor: "#2563EB", // azul fuerte
    borderWidth: 2,
    borderColor: "#60A5FA",
  },
  buttonUnselected: {
    backgroundColor: "#1E293B", // azul grisáceo
    borderWidth: 1,
    borderColor: "#334155",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  buttonTextSelected: {
    color: "#F1F5F9",
  },
  buttonTextUnselected: {
    color: "#60A5FA",
  },
  buttonDescription: {
    color: "#CBD5E1",
    fontSize: 13,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 16,
  },
});
