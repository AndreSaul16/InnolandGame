import React, { useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../../theme';

const GameEventModal = ({ visible, event, onClose }) => {
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const LONG_PRESS_DURATION = 2000; // 5 segundos

  const handlePressIn = () => {
    setPressing(true);
    setProgress(0);
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(elapsed / LONG_PRESS_DURATION, 1));
    }, 50);
    timerRef.current = setTimeout(() => {
      setPressing(false);
      setProgress(1);
      clearInterval(intervalRef.current);
      onClose();
    }, LONG_PRESS_DURATION);
  };

  const handlePressOut = () => {
    setPressing(false);
    setProgress(0);
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
  };

  if (!event) {
    console.log('[LOG][GameEventModal] No hay evento para mostrar, el modal no se renderiza.');
    return null;
  }
  if (visible) {
    console.log('[LOG][GameEventModal] Modal visible, mostrando evento:', event);
  }
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.description}>{event.description}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressing && styles.buttonPressing,
              pressed && { opacity: 0.8 },
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Text style={styles.buttonText}>
              {pressing ? 'Mantén pulsado...' : 'Aceptar'}
            </Text>
            {pressing && (
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 28,
    width: 320,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: FONTS.title,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.darkBlue,
    fontFamily: FONTS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressing: {
    backgroundColor: COLORS.blue,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontFamily: FONTS.text,
    fontSize: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.gray + '40',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.white,
    borderRadius: 4,
  },
});

export default GameEventModal; 