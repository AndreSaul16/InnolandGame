import React, { useState } from 'react';
import CameraOpener from '../CameraOpener';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { View } from 'react-native';

const CameraScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { onBarCodeScanned, user } = route.params || {};

  // Estado local para controlar si la cámara debe estar activa
  const [isActive, setIsActive] = useState(false);

  // useFocusEffect activa/desactiva la cámara según el foco de la pantalla
  useFocusEffect(
    React.useCallback(() => {
      setIsActive(true); // Activar cámara al enfocar
      return () => {
        setIsActive(false); // Desactivar cámara al desenfocar
      };
    }, [])
  );

  console.log('[CameraScreen] Render. Props recibidas:', { onBarCodeScanned, user });

  // Handler local para cerrar la cámara
  const handleClose = () => {
    console.log('[CameraScreen] handleClose llamado. Volviendo atrás.');
    navigation.goBack();
  };

  // Handler para escanear el QR y volver atrás
  const handleBarCodeScanned = (data) => {
    console.log('[CameraScreen] handleBarCodeScanned llamado con data:', data);
    if (onBarCodeScanned) onBarCodeScanned(data);
    // navigation.goBack(); // Ya se hace en el handler de GameScreen
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      {isActive && (
        <CameraOpener
          user={user}
          onBarCodeScanned={handleBarCodeScanned}
          onClose={handleClose}
          isScanned={false}
        />
      )}
    </View>
  );
};

export default CameraScreen; 