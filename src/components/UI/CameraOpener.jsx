import React from 'react';
// 1. Importamos las herramientas que necesitamos de React Native.
import { 
  View, 
  Text, 
  Platform, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar as RNStatusBar,
  Animated,
  ActivityIndicator
} from 'react-native';
// `StatusBar` de Expo nos da más control sobre la barra de estado.
import { StatusBar } from 'expo-status-bar';
// Componentes específicos para la funcionalidad de la cámara.
import { CameraView, useCameraPermissions } from 'expo-camera';
// Iconos modernos para una mejor experiencia visual
import { 
  XMarkIcon, 
  CameraIcon, 
  QrCodeIcon,
  ArrowPathIcon 
} from "react-native-heroicons/solid";
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../theme';

// Definimos el componente, recibiendo varias funciones (props) desde el componente padre.
const CameraOpener = ({ onBarCodeScanned, onPermissionError, isScanned, onRetryScan, onClose }) => {
  // `useCameraPermissions` es un "hook" que nos da dos cosas:
  // - `permission`: un objeto con el estado actual del permiso de la cámara.
  // - `requestPermission`: una función para solicitar el permiso al usuario.
  const [permission, requestPermission] = useCameraPermissions();
  
  // Animaciones para mejorar la experiencia visual
  const scanAnimation = React.useRef(new Animated.Value(0)).current;
  const pulseAnimation = React.useRef(new Animated.Value(1)).current;

  // Iniciamos las animaciones cuando el componente se monta
  React.useEffect(() => {
    // Animación de escaneo continua
    const startScanAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Animación de pulso para el botón de cerrar
    const startPulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startScanAnimation();
    startPulseAnimation();
  }, []);

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

    // Versión web moderna con diseño mejorado
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        height: '60vw',
        maxWidth: 400,
        maxHeight: 400,
        margin: '40px auto',
        background: COLORS.black,
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `3px solid ${COLORS.primary}`,
      }}>
        {error ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            textAlign: 'center',
          }}>
            <CameraIcon style={{ width: 48, height: 48, color: COLORS.error, marginBottom: 16 }} />
            <p style={{ 
              color: COLORS.error, 
              fontSize: 18, 
              fontFamily: FONTS.text,
              margin: 0,
              marginBottom: 16
            }}>
              {error}
            </p>
            <button
              onClick={handleRetry}
              style={{
                backgroundColor: COLORS.primary,
                color: COLORS.darkBlue,
                border: 'none',
                borderRadius: 12,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 'bold',
                fontFamily: FONTS.text,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              autoPlay
              muted
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {/* Marco de escaneo visual */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 200,
              height: 200,
              border: `3px solid ${COLORS.primary}`,
              borderRadius: 16,
              backgroundColor: 'rgba(0, 234, 189, 0.1)',
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <QrCodeIcon style={{ width: 40, height: 40, color: COLORS.primary, marginBottom: 8 }} />
              <p style={{
                color: COLORS.primary,
                fontSize: 14,
                fontFamily: FONTS.text,
                margin: 0,
                textAlign: 'center',
                fontWeight: 'bold',
              }}>
                Apunta al código QR
              </p>
            </div>

            {/* Botón de cerrar mejorado */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: `linear-gradient(135deg, ${COLORS.error} 0%, #b91c1c 100%)`,
                border: 'none',
                borderRadius: '50%',
                width: 48,
                height: 48,
                color: COLORS.white,
                fontSize: 20,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.6)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 16px rgba(220, 38, 38, 0.4)';
              }}
              aria-label="Cerrar"
            >
              ×
            </button>

            {/* Overlay de procesamiento mejorado */}
            {!scanning && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 32,
                background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%)`,
                color: COLORS.white,
                textAlign: 'center',
                zIndex: 10,
                borderBottomLeftRadius: 21,
                borderBottomRightRadius: 21,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <div style={{
                    width: 20,
                    height: 20,
                    border: `3px solid ${COLORS.primary}`,
                    borderTop: '3px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: 12,
                  }}></div>
                  <div style={{ 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    fontFamily: FONTS.title,
                    color: COLORS.primary
                  }}>
                    Procesando código QR...
                  </div>
                </div>
                <button
                  onClick={handleRetry}
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.blue} 0%, ${COLORS.darkBlue} 100%)`,
                    color: COLORS.white,
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px 24px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    fontFamily: FONTS.text,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = `0 6px 20px rgba(0, 92, 255, 0.4)`;
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  Escanear de Nuevo
                </button>
              </div>
            )}

            {/* Añadimos la animación CSS para el spinner */}
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}
      </div>
    );
  }

  // Caso 2: Si todavía estamos esperando la respuesta del sistema sobre los permisos.
  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator 
            size="large" 
            color={COLORS.primary} 
            style={styles.spinner}
          />
          <CameraIcon size={48} color={COLORS.primary} style={styles.loadingIcon} />
          <Text style={styles.loadingTitle}>Verificando permisos</Text>
          <Text style={styles.loadingSubtitle}>
            Configurando acceso a la cámara...
          </Text>
        </View>
      </View>
    );
  }

  // Caso 3: Si sabemos que el permiso NO está concedido.
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconContainer}>
            <CameraIcon size={64} color={COLORS.primary} />
          </View>
          
          <Text style={styles.permissionTitle}>
            Acceso a la Cámara
          </Text>
          
          <Text style={styles.permissionText}>
            Necesitamos acceso a tu cámara para escanear códigos QR y continuar con el juego
          </Text>
          
          <View style={styles.permissionFeatures}>
            <View style={styles.featureItem}>
              <QrCodeIcon size={20} color={COLORS.blue} />
              <Text style={styles.featureText}>Escaneo de códigos QR</Text>
            </View>
            <View style={styles.featureItem}>
              <CameraIcon size={20} color={COLORS.blue} />
              <Text style={styles.featureText}>Acceso seguro a la cámara</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Permitir Cámara</Text>
          </TouchableOpacity>
        </View>
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
        
        {/* Marco de escaneo animado */}
        <View style={styles.scanFrame}>
          <View style={styles.scanCorners}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          <Animated.View 
            style={[
              styles.scanLine,
              {
                transform: [{
                  translateY: scanAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 100],
                  })
                }]
              }
            ]}
          />
          
          <View style={styles.scanInstruction}>
            <QrCodeIcon size={32} color={COLORS.primary} />
            <Text style={styles.scanInstructionText}>
              Centra el código QR en el marco
            </Text>
          </View>
        </View>
        
        {/* Botón para cerrar la cámara mejorado */}
        <Animated.View
          style={[
            styles.closeButtonContainer,
            { transform: [{ scale: pulseAnimation }] }
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.8}
          >
            <XMarkIcon size={28} color={COLORS.white} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Overlay de procesamiento mejorado */}
        {isScanned && (
          <View style={styles.scannedOverlay}>
            <View style={styles.scannedCard}>
              <ActivityIndicator 
                size="large" 
                color={COLORS.primary} 
                style={styles.processingSpinner}
              />
              
              <Text style={styles.scannedTitle}>¡Código detectado!</Text>
              <Text style={styles.scannedSubtitle}>Procesando información...</Text>
              
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={onRetryScan}
                activeOpacity={0.8}
              >
                <ArrowPathIcon size={20} color={COLORS.white} style={styles.retryIcon} />
                <Text style={styles.retryButtonText}>Escanear de Nuevo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

// --- DEFINICIÓN DE ESTILOS MODERNOS ---
const styles = StyleSheet.create({
  // Contenedor de carga mejorado
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 135, 0.15)',
      },
      default: {
        shadowColor: COLORS.darkBlue,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 16,
      },
    }),
  },
  spinner: {
    marginBottom: 20,
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 24,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    fontFamily: FONTS.text,
    color: COLORS.gray,
    textAlign: 'center',
  },

  // Contenedor de permisos mejorado
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
  },
  permissionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px rgba(0, 0, 135, 0.2)',
      },
      default: {
        shadowColor: COLORS.darkBlue,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 20,
      },
    }),
  },
  permissionIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 28,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontFamily: FONTS.text,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionFeatures: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 8,
  },
  featureText: {
    fontSize: 14,
    fontFamily: FONTS.text,
    color: COLORS.darkBlue,
    marginLeft: 12,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 234, 189, 0.3)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  permissionButtonText: {
    fontSize: 18,
    fontFamily: FONTS.text,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
  },

  // Contenedor principal de la cámara
  cameraContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },

  // Marco de escaneo moderno
  scanFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 240,
    height: 240,
    marginTop: -120,
    marginLeft: -120,
    zIndex: 5,
  },
  scanCorners: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.primary,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    opacity: 0.8,
  },
  scanInstruction: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    right: -40,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 16,
  },
  scanInstructionText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FONTS.text,
    textAlign: 'center',
    marginTop: 8,
  },

  // Botón de cerrar mejorado
  closeButtonContainer: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: COLORS.error,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
      },
      default: {
        shadowColor: COLORS.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },

  // Overlay de procesamiento moderno
  scannedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  scannedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 20,
    minWidth: 280,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
      },
    }),
  },
  processingSpinner: {
    marginBottom: 20,
  },
  scannedTitle: {
    fontSize: 24,
    fontFamily: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    marginBottom: 8,
    textAlign: 'center',
  },
  scannedSubtitle: {
    fontSize: 16,
    fontFamily: FONTS.text,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.blue,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 92, 255, 0.3)',
      },
      default: {
        shadowColor: COLORS.blue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: FONTS.text,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});

export default CameraOpener;