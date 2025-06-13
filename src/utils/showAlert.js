import { Platform, Alert } from 'react-native';

export function showAlert(title, message, buttons) {
  if (Platform.OS === 'web') {
    window.alert(`${title ? title + '\n' : ''}${message}`);
  } else {
    Alert.alert(title, message, buttons);
  }
} 