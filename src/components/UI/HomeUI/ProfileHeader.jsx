import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../../theme';
import { AVATAR_IMAGES } from '../UserUI/AvatarPicker';

const ProfileHeader = ({ user }) => {
  console.log('[ProfileHeader] user:', user);
  let avatarSource = require('../../../../assets/roles/Ciudadano_Innovador.png');
  if (typeof user?.photoURL === 'number' && AVATAR_IMAGES[user.photoURL]) {
    avatarSource = AVATAR_IMAGES[user.photoURL];
  } else if (typeof user?.photoURL === 'string' && user.photoURL) {
    avatarSource = { uri: user.photoURL };
  }
  return (
    <View style={styles.container}>
      <Image
        source={avatarSource}
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
    backgroundColor: COLORS.gray,
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