import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

// Breakpoints para diferentes tamaños de pantalla
const BREAKPOINTS = {
  small: 600,    // Pantallas muy pequeñas (móviles en portrait)
  medium: 768,   // Tablets en portrait
  large: 1024,   // Tablets en landscape / laptops pequeños
};

// Hook personalizado para detectar tamaño de pantalla y necesidad de scroll
export const useScreenSize = () => {
  const [screenData, setScreenData] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return {
      width,
      height,
      isSmall: height < BREAKPOINTS.small,
      isMedium: height >= BREAKPOINTS.small && height < BREAKPOINTS.medium,
      isLarge: height >= BREAKPOINTS.medium,
      needsScroll: height < BREAKPOINTS.small,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const { width, height } = window;
      setScreenData({
        width,
        height,
        isSmall: height < BREAKPOINTS.small,
        isMedium: height >= BREAKPOINTS.small && height < BREAKPOINTS.medium,
        isLarge: height >= BREAKPOINTS.medium,
        needsScroll: height < BREAKPOINTS.small,
      });
    });

    return () => subscription?.remove?.() || subscription?.unsubscribe?.();
  }, []);

  return screenData;
};

// Función helper para obtener estilos de ScrollView optimizados para web
export const getScrollViewStyles = (needsScroll) => {
  if (!needsScroll || Platform.OS !== 'web') {
    return {
      container: {},
      scrollView: {},
      content: {},
    };
  }

  return {
    container: {
      height: '100vh',
      maxHeight: '100vh',
    },
    scrollView: {
      height: '100%',
      overflow: 'scroll',
      WebkitOverflowScrolling: 'touch',
    },
    content: {
      minHeight: '100vh',
    },
  };
};

export default useScreenSize; 