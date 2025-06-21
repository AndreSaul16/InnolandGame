import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { 
  TrophyIcon, 
  ClockIcon, 
  CalendarDaysIcon,
  PlayIcon 
} from 'react-native-heroicons/solid';
import { COLORS, FONTS } from '../../../theme';

const { width: screenWidth } = Dimensions.get('window');

const StatItem = ({ icon: IconComponent, label, value, iconColor = COLORS.darkBlue }) => (
  <View style={styles.statItem}>
    <View style={styles.statIconContainer}>
      <IconComponent size={20} color={iconColor} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
);

const LastGameDashboard = ({ lastGame }) => {
  if (!lastGame) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <PlayIcon size={28} color={COLORS.primary} />
          <Text style={styles.title}>Última Partida</Text>
        </View>
        <View style={styles.emptyState}>
          <TrophyIcon size={48} color={COLORS.gray + '60'} />
          <Text style={styles.emptyText}>¡Aún no has jugado!</Text>
          <Text style={styles.emptySubtext}>Crea o únete a una partida para comenzar</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PlayIcon size={28} color={COLORS.primary} />
        <Text style={styles.title}>Última Partida</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <StatItem
          icon={TrophyIcon}
          label="Magnetos conseguidos"
          value={lastGame.score}
          iconColor={COLORS.primary}
        />
        
        <StatItem
          icon={ClockIcon}
          label="Turnos jugados"
          value={lastGame.turno !== undefined ? lastGame.turno : '-'}
          iconColor={COLORS.blue}
        />
        
        <StatItem
          icon={CalendarDaysIcon}
          label="Fecha de partida"
          value={lastGame.date}
          iconColor={COLORS.darkBlue}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: Math.min(screenWidth * 0.9, 400),
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
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
    borderColor: COLORS.gray + '20',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    marginLeft: 12,
  },

  statsContainer: {
    gap: 16,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 16,
  },

  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...Platform.select({
      web: {
        boxShadow: `0 2px 4px ${COLORS.darkBlue}1A`,
      },
      default: {
        shadowColor: COLORS.darkBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },

  statContent: {
    flex: 1,
  },

  statLabel: {
    fontSize: 14,
    fontFamily: FONTS.text,
    color: COLORS.blue,
    marginBottom: 4,
    fontWeight: '500',
  },

  statValue: {
    fontSize: 18,
    fontFamily: FONTS.text,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },

  emptyText: {
    fontSize: 18,
    fontFamily: FONTS.text,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    marginTop: 16,
    marginBottom: 8,
  },

  emptySubtext: {
    fontSize: 14,
    fontFamily: FONTS.text,
    color: COLORS.blue,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
});

export default LastGameDashboard;