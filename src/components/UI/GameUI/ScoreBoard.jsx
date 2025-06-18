import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { COLORS, FONTS } from "../../../theme";
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * ScoreBoard.jsx
 * Muestra la puntuación (magnetos) de cada jugador en la partida.
 * Props:
 *  - players: array de objetos { uid, nombre, magnetos }
 *  - currentTurnUid: string (uid del jugador actual)
 *  - currentUserUid: string (uid del usuario actual)
 */
const ScoreBoard = ({
  players = [],
  currentTurnUid,
  currentUserUid,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Puntuaciones</Text>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, {flex:2}]}>Jugador</Text>
        <Text style={styles.headerCell}>En partida</Text>
      </View>
      <ScrollView style={{maxHeight: 260}}>
        {players.map((player) => (
          <View
            key={player.uid}
            style={[
              styles.row,
              player.uid === currentTurnUid && styles.currentRow,
            ]}
          >
            <Text
              style={[
                styles.name,
                player.uid === currentTurnUid && styles.currentName,
              ]}
            >
              {player.nombre}
              {player.uid === currentTurnUid ? " (Turno)" : ""}
            </Text>
            <Text style={styles.score}>
              {player.magnetos ?? 0}{' '}
              <MaterialCommunityIcons name="magnet" size={24} color={COLORS.blue} />
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
    width: "100%",
    maxWidth: 400,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    color: COLORS.primary,
    fontFamily: FONTS.title,
    marginBottom: 8,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 4,
    marginBottom: 4,
  },
  headerCell: {
    fontWeight: "bold",
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONTS.text,
    flex: 1,
    textAlign: 'center',
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  currentRow: {
    backgroundColor: COLORS.primary + "22", // un poco de color para el turno actual
    borderRadius: 6,
  },
  name: {
    fontSize: 16,
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    flex: 2,
  },
  currentName: {
    color: COLORS.success,
    fontWeight: "bold",
  },
  score: {
    fontSize: 16,
    color: COLORS.blue,
    fontFamily: FONTS.text,
    fontWeight: "bold",
    flex: 1,
    textAlign: 'center',
  },
});

export default ScoreBoard;
