import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../../theme';

const ProfileHeader = ({ user }) => {
  console.log('[ProfileHeader] user:', user);
  return (
    <View style={styles.container}>
      <Image
        source={user?.photoURL ? { uri: user.photoURL } : require('../../../../assets/roles/Ciudadano_Innovador.png')}
        style={styles.avatar}
      />
      <Text style={styles.name}>{user?.name || user?.nombre || user?.username || 'Invitado'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 8,
    backgroundColor: '#eee',
    alignSelf: 'center',
  },
  name: {
    fontSize: 18,
    fontFamily: FONTS.title,
    color: COLORS.darkBlue,
    textAlign: 'center',
    marginLeft: 0,
  },
});

export default ProfileHeader; 