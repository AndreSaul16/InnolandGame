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
import { COLORS, FONTS } from '../../theme';

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
    // --- Lógica de escaneo QR en web ---
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const [stream, setStream] = React.useState(null);
    const [scanning, setScanning] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
      let animationId;
      let localStream;
      let isMounted = true;

      async function startCamera() {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.setAttribute('playsinline', true); // Para iOS Safari
            videoRef.current.play();
          }
          setStream(s);
        } catch (err) {
          setError('No se pudo acceder a la cámara.');
        }
      }

      startCamera();

      function stopCamera() {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }

      function scan() {
        if (!videoRef.current || !canvasRef.current || !scanning) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          // eslint-disable-next-line
          const jsQR = require('jsqr');
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            setScanning(false);
            if (onBarCodeScanned) {
              onBarCodeScanned({ data: code.data, type: 'qr' });
            }
          }
        } catch (e) {
          // Silenciar errores de escaneo
        }
        animationId = requestAnimationFrame(scan);
      }

      if (scanning) {
        animationId = requestAnimationFrame(scan);
      }

      return () => {
        isMounted = false;
        if (animationId) cancelAnimationFrame(animationId);
        stopCamera();
      };
      // eslint-disable-next-line
    }, [scanning]);

    const handleRetry = () => {
      setScanning(true);
      if (onRetryScan) onRetryScan();
    };

    const handleClose = () => {
      setScanning(false);
      if (onClose) onClose();
    };

    return (
      <div style={{
        position: 'relative',
        width: '100%',
        height: '60vw',
        maxWidth: 400,
        maxHeight: 400,
        margin: '40px auto',
        background: 'black',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {error ? (
          <p style={{ color: 'red', textAlign: 'center', width: '100%' }}>{error}</p>
        ) : (
          <>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              autoPlay
              muted
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {/* Botón de cerrar */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(220,38,38,0.8)',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                color: 'white',
                fontSize: 24,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
              aria-label="Cerrar"
            >
              ×
            </button>
            {/* Overlay de escaneado */}
            {!scanning && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 32,
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                textAlign: 'center',
                zIndex: 10,
              }}>
                <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Procesando...</div>
                <button
                  onClick={handleRetry}
                  style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >Escanear de Nuevo</button>
              </div>
            )}
          </>
        )}
      </div>
    );
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
    fontFamily: FONTS.text,
    color: COLORS.darkBlue,
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
    fontFamily: FONTS.text,
    color: COLORS.darkBlue,
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
    position: 'absolute',
    zIndex: 10,
    top: 56,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    // Sombra solo en móvil
    ...(Platform.OS !== 'web' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 8,
    } : {}),
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
    fontFamily: FONTS.text,
  },
});

export default CameraOpener;
