import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { COLORS, FONTS } from "../../../theme";
import { 
  TrophyIcon,
  UserIcon,
  FireIcon
} from 'react-native-heroicons/solid';

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
  console.log('[LOG][ScoreBoard] Renderizando ScoreBoard', { players, currentTurnUid, currentUserUid });
  
  // Ordenar jugadores por magnetos (descendente)
  const sortedPlayers = [...players].sort((a, b) => (b.magnetos || 0) - (a.magnetos || 0));
  
  const PlayerCard = ({ player, index, isCurrentTurn, isTopPlayer }) => (
    <View style={[
      styles.playerCard,
      isCurrentTurn && styles.currentPlayerCard,
      isTopPlayer && styles.topPlayerCard,
    ]}>
      {/* Posición */}
      <View style={[
        styles.positionContainer,
        isTopPlayer && styles.topPositionContainer
      ]}>
        {isTopPlayer ? (
          <TrophyIcon size={20} color={COLORS.primary} />
        ) : (
          <Text style={styles.positionNumber}>{index + 1}</Text>
        )}
      </View>

      {/* Info del jugador */}
      <View style={styles.playerInfo}>
        <View style={styles.playerNameContainer}>
          <UserIcon 
            size={16} 
            color={isCurrentTurn ? COLORS.primary : COLORS.blue} 
          />
          <Text style={[
            styles.playerName,
            isCurrentTurn && styles.currentPlayerName,
            isTopPlayer && styles.topPlayerName,
          ]}>
            {player.nombre}
          </Text>
        </View>
        
        {isCurrentTurn && (
          <View style={styles.turnBadge}>
            <Text style={styles.turnBadgeText}>EN TURNO</Text>
          </View>
        )}
      </View>

      {/* Magnetos */}
      <View style={[
        styles.magnetosContainer,
        isTopPlayer && styles.topMagnetosContainer
      ]}>
        <Text style={[
          styles.magnetosCount,
          isTopPlayer && styles.topMagnetosCount
        ]}>
          {player.magnetos ?? 0}
        </Text>
        <FireIcon 
          size={18} 
          color={isTopPlayer ? COLORS.primary : COLORS.blue} 
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TrophyIcon size={24} color={COLORS.primary} />
        <Text style={styles.title}>Tabla de Puntuaciones</Text>
      </View>

      {/* Lista de jugadores */}
      <ScrollView 
        style={styles.playersScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.playersContainer}
      >
        {sortedPlayers.map((player, index) => (
          <PlayerCard
            key={player.uid}
            player={player}
            index={index}
            isCurrentTurn={player.uid === currentTurnUid}
            isTopPlayer={index === 0}
          />
        ))}
      </ScrollView>

      {/* Footer info */}
      <View style={styles.footer}>
        <FireIcon size={16} color={COLORS.blue} />
        <Text style={styles.footerText}>Magnetos obtenidos en esta partida</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginVertical: 16,
    width: "100%",
    maxWidth: 420,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        boxShadow: `0 4px 12px ${COLORS.darkBlue}1A`,
      },
      default: {
        shadowColor: COLORS.darkBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },

  title: {
    fontFamily: FONTS.title,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
  },

  playersScrollView: {
    maxHeight: 300,
  },

  playersContainer: {
    gap: 12,
  },

  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray + '30',
    ...Platform.select({
      web: {
        boxShadow: `0 2px 8px ${COLORS.gray}20`,
      },
      default: {
        shadowColor: COLORS.gray,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },

  currentPlayerCard: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: `0 4px 12px ${COLORS.primary}30`,
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },

  topPlayerCard: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: `0 6px 16px ${COLORS.primary}40`,
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },

  positionContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  topPositionContainer: {
    backgroundColor: COLORS.primary + '20',
  },

  positionNumber: {
    fontFamily: FONTS.text,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
  },

  playerInfo: {
    flex: 1,
  },

  playerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  playerName: {
    fontFamily: FONTS.text,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkBlue,
  },

  currentPlayerName: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },

  topPlayerName: {
    color: COLORS.darkBlue,
    fontWeight: 'bold',
  },

  turnBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },

  turnBadgeText: {
    fontFamily: FONTS.text,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  magnetosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue + '15',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },

  topMagnetosContainer: {
    backgroundColor: COLORS.primary + '20',
  },

  magnetosCount: {
    fontFamily: FONTS.text,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
  },

  topMagnetosCount: {
    fontSize: 20,
    color: COLORS.primary,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray + '30',
    gap: 8,
  },

  footerText: {
    fontFamily: FONTS.text,
    fontSize: 12,
    color: COLORS.blue,
    opacity: 0.8,
  },
});

export default ScoreBoard;