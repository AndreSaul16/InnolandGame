import React from 'react';
// 1. Importamos las herramientas que necesitamos de React Native.
//    - `Dimensions`: Para obtener el tamaño de la pantalla.
//    - `BackHandler`: Para poder cerrar la aplicación programáticamente.
import { View, Text, Platform, Button, TouchableOpacity, StyleSheet, BackHandler, Dimensions } from 'react-native';
// `StatusBar` de Expo nos da más control sobre la barra de estado.
import { StatusBar } from 'expo-status-bar';
// Componentes específicos para la funcionalidad de la cámara.
import { CameraView, useCameraPermissions } from 'expo-camera';
// Un icono para el botón de cerrar, de una librería externa.
import { XMarkIcon } from "react-native-heroicons/solid";

// 2. OBTENEMOS LAS DIMENSIONES DE LA PANTALLA COMPLETA
// Usamos .get('screen') en lugar de .get('window').
// 'screen' incluye el área de la barra de navegación de Android, eliminando la línea blanca.
const { width, height } = Dimensions.get('screen');

// Definimos el componente, recibiendo varias funciones (props) desde el componente padre.
const CameraOpener = ({ onBarCodeScanned, onPermissionError, isScanned, onRetryScan, onClose }) => {
  // `useCameraPermissions` es un "hook" que nos da dos cosas:
  // - `permission`: un objeto con el estado actual del permiso de la cámara.
  // - `requestPermission`: una función para solicitar el permiso al usuario.
  const [permission, requestPermission] = useCameraPermissions();

  // `useEffect` ejecuta este código cada vez que el estado de `permission` cambia.
  React.useEffect(() => {
    // Si estamos en la web, no hacemos nada.
    if (Platform.OS === 'web') return;
    // Si el objeto de permiso aún no ha llegado, esperamos.
    if (!permission) return;
    // Si el permiso NO está concedido y el sistema dice que NO podemos volver a preguntar...
    if (!permission.granted && !permission.canAskAgain) {
      // ...entonces llamamos a la función de error que nos pasaron.
      if (onPermissionError) onPermissionError('Permiso denegado permanentemente');
    }
  }, [permission, onPermissionError]);

  // Esta función se llamará cuando el usuario pulse el botón de la 'X'.
  const handleCloseAndExit = () => {
    // Primero, ejecuta la función `onClose` del padre (si existe).
    if (onClose) {
      onClose();
    }
    // Después, le ordena a la aplicación que se cierre.
    BackHandler.exitApp();
  };

  // ----- RENDERIZADO CONDICIONAL -----
  // A continuación, decidimos qué mostrar en pantalla según el estado de los permisos.

  // Caso 1: Si es la versión web.
  if (Platform.OS === 'web') {
    return <Text className="text-center mt-12 text-lg">El escaneo de QR no está disponible en la web.</Text>;
  }
  // Caso 2: Si todavía estamos esperando la respuesta del sistema sobre los permisos.
  if (!permission) {
    return <Text className="text-center mt-12 text-lg">Verificando permisos...</Text>;
  }
  // Caso 3: Si sabemos que el permiso NO está concedido.
  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-white">
        <Text className="text-center mb-5 text-lg">
          Necesitamos acceso a tu cámara para escanear códigos QR
        </Text>
        <Button title="Permitir cámara" onPress={requestPermission} />
      </View>
    );
  }
  
  // Caso 4 (Éxito): Si todos los permisos están en orden, mostramos la cámara.
  return (
    // Usamos un Fragmento (`<>...</>`) para agrupar varios componentes sin crear un `View` extra.
    <>
      {/* El "control remoto" de la barra de estado. `style="light"` pone el texto en blanco. */}
      <StatusBar style="light" />

      {/* 3. EL CONTENEDOR PRINCIPAL (LA "CAJA") */}
      {/* Forzamos el tamaño de esta "caja" a las dimensiones exactas de la pantalla.
          Esta es la solución más robusta porque no depende del layout de ningún padre. */}
      <View style={{ width: width, height: height }}>
        
        {/* 4. LA CÁMARA */}
        {/* Le ordenamos a la cámara que se expanda para rellenar completamente la "caja"
            que la contiene, usando el estilo predefinido `absoluteFillObject`. */}
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={isScanned ? undefined : onBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        
        {/* 5. LOS OVERLAYS (Elementos superpuestos) */}
        {/* Estos se posicionan de forma absoluta dentro de la "caja". */}
        <TouchableOpacity
          onPress={handleCloseAndExit}
          className="absolute z-10 top-14 right-5 bg-red-500 active:bg-red-600 shadow-lg shadow-black rounded-full w-12 h-12 justify-center items-center"
        >
          <XMarkIcon size={28} color="white" />
        </TouchableOpacity>
        
        {/* Este overlay solo se muestra si `isScanned` es verdadero. */}
        {isScanned && (
          <View className="absolute z-10 bottom-0 left-0 right-0 p-10 bg-black/50 items-center">
            <Text className="text-white text-xl font-bold mb-4">Procesando...</Text>
            <Button 
              title="Escanear de Nuevo" 
              onPress={onRetryScan}
              color="#007bff"
            />
          </View>
        )}
      </View>
    </>
  );
};

// Exportamos el componente para que pueda ser usado en otras partes de la app.
export default CameraOpener;
