import React from 'react';
// 1. Importamos las herramientas que necesitamos de React Native.
import { View, Text, Platform, Button, TouchableOpacity, StyleSheet, StatusBar as RNStatusBar } from 'react-native';
// `StatusBar` de Expo nos da más control sobre la barra de estado.
import { StatusBar } from 'expo-status-bar';
// Componentes específicos para la funcionalidad de la cámara.
import { CameraView, useCameraPermissions } from 'expo-camera';
// Un icono para el botón de cerrar, de una librería externa.
import { XMarkIcon } from "react-native-heroicons/solid";
import { SafeAreaView } from 'react-native-safe-area-context';

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

  
  // ----- RENDERIZADO CONDICIONAL -----
  // A continuación, decidimos qué mostrar en pantalla según el estado de los permisos.

  // Caso 1: Si es la versión web.
  if (Platform.OS === 'web') {
    return <Text style={styles.infoText}>El escaneo de QR no está disponible en la web.</Text>;
  }
  // Caso 2: Si todavía estamos esperando la respuesta del sistema sobre los permisos.
  if (!permission) {
    return <Text style={styles.infoText}>Verificando permisos...</Text>;
  }
  // Caso 3: Si sabemos que el permiso NO está concedido.
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Necesitamos acceso a tu cámara para escanear códigos QR
        </Text>
        <Button title="Permitir cámara" onPress={requestPermission} />
      </View>
    );
  }
  
  // Caso 4 (Éxito): Si todos los permisos están en orden, mostramos la cámara.
  return (
    <>
      <StatusBar style="light" />

      {/* Usamos un SafeAreaView para que el contenido se vea bien y no se solape
          con la barra de estado, especialmente en iOS. */}
      <SafeAreaView style={styles.cameraContainer}>
        {/* Este componente muestra la imagen de la cámara. */}
        <CameraView
          style={StyleSheet.absoluteFillObject} // Estilo clave para que la cámara llene el contenedor.
          facing="back"
          onBarcodeScanned={isScanned ? undefined : onBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        
        {/* Botón para cerrar la cámara (la 'X'). */}
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          activeOpacity={0.7} // Controla la opacidad al pulsar.
        >
          <XMarkIcon size={28} color="white" />
        </TouchableOpacity>
        
        {/* Este overlay solo se muestra si `isScanned` es verdadero. */}
        {isScanned && (
          <View style={styles.scannedOverlay}>
            <Text style={styles.scannedOverlayText}>Procesando...</Text>
            <Button 
              title="Escanear de Nuevo" 
              onPress={onRetryScan}
              color="#007bff"
            />
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

// --- DEFINICIÓN DE ESTILOS ---
// Aquí se traducen todas las clases de Tailwind a objetos de estilo de React Native.
const styles = StyleSheet.create({
  // Estilo para los textos informativos (ej. "Verificando permisos...").
  infoText: {
    textAlign: 'center',    // Centra el texto horizontalmente.
    marginTop: 48,          // Margen superior para separarlo del borde.
    fontSize: 18,           // Tamaño de la fuente.
  },
  // Contenedor para la pantalla de solicitud de permisos.
  permissionContainer: {
    flex: 1,                // Ocupa todo el espacio disponible.
    justifyContent: 'center', // Centra el contenido verticalmente.
    alignItems: 'center',   // Centra el contenido horizontalmente.
    padding: 20,            // Espaciado interior.
    backgroundColor: 'white', // Color de fondo.
  },
  // Estilo para el texto en la pantalla de permisos.
  permissionText: {
    textAlign: 'center',    // Centra el texto.
    marginBottom: 20,       // Margen inferior para separarlo del botón.
    fontSize: 18,           // Tamaño de la fuente.
  },
  // Contenedor principal para la vista de la cámara.
  cameraContainer: {
    flex: 1,                // Ocupa todo el espacio disponible.
    backgroundColor: 'black', // Fondo negro, visible mientras la cámara inicia.
    // Añadimos el padding superior en Android para evitar el solapamiento con la barra de estado.
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  // Estilo para el botón de cerrar.
  closeButton: {
    position: 'absolute',   // Lo saca del flujo normal para posicionarlo libremente.
    zIndex: 10,             // Asegura que esté por encima de la cámara.
    top: 56,                // Distancia desde el borde superior.
    right: 20,              // Distancia desde el borde derecho.
    backgroundColor: 'rgba(220, 38, 38, 0.8)', // Fondo rojo con 80% de opacidad.
    borderRadius: 9999,     // Un radio de borde muy grande para crear un círculo.
    width: 48,              // Ancho del botón.
    height: 48,             // Alto del botón.
    justifyContent: 'center', // Centra el icono 'X' verticalmente.
    alignItems: 'center',   // Centra el icono 'X' horizontalmente.
    // Sombra para iOS.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Sombra para Android.
    elevation: 8,
  },
  // Overlay que aparece después de escanear.
  scannedOverlay: {
    position: 'absolute',   // Posicionamiento absoluto.
    zIndex: 10,             // Asegura que esté por encima de la cámara.
    bottom: 0,              // Lo fija al borde inferior.
    left: 0,                // Lo fija al borde izquierdo.
    right: 0,               // Lo fija al borde derecho.
    padding: 40,            // Espaciado interior grande.
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo negro con 50% de opacidad.
    alignItems: 'center',   // Centra su contenido (texto y botón) horizontalmente.
  },
  // Texto dentro del overlay.
  scannedOverlayText: {
    color: 'white',         // Color del texto.
    fontSize: 20,           // Tamaño de la fuente.
    fontWeight: 'bold',     // Texto en negrita.
    marginBottom: 16,       // Margen inferior para separarlo del botón.
  },
});

export default CameraOpener;
