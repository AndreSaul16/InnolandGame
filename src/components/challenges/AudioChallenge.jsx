import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import OpenAIService from '../../services/OpenAIService';

// Opciones de grabación para asegurar formato .m4a compatible con Whisper
const recordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

/**
 * Componente para grabar audio, transcribirlo automáticamente y mostrar el texto.
 * Props:
 *   onTranscription: función callback que recibe el texto transcrito.
 */
const AudioChallenge = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [transcribing, setTranscribing] = useState(false);

  const startRecording = async () => {
    setError(null);
    setTranscript('');
    setLoading(true);
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso de micrófono denegado');
        setLoading(false);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const stopRecording = async () => {
    setLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setIsRecording(false);
      setRecording(null);
      setTranscribing(true);
      // Transcribir automáticamente
      const text = await OpenAIService.transcribeAudioWhisper(uri);
      setTranscript(text);
      setTranscribing(false);
      if (onTranscription) onTranscription(text);
    } catch (e) {
      setError(e.message);
      setTranscribing(false);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>¿Prefieres responder con tu voz?</Text>
      <View style={styles.buttonRow}>
        <Button
          title={isRecording ? 'Grabando...' : '🎤 Hablar'}
          onPress={isRecording ? stopRecording : startRecording}
          color={isRecording ? '#dc3545' : '#43a047'} // Verde bonito
          disabled={loading || transcribing}
        />
      </View>
      {(loading || transcribing) && <ActivityIndicator style={{ marginTop: 10 }} size="small" color="#43a047" />}
      {transcript && (
        <Text style={styles.transcript}>Transcripción: {transcript}</Text>
      )}
      {error && <Text style={styles.error}>Error: {error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 15,
    color: '#22223b',
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  transcript: {
    marginTop: 8,
    fontSize: 16,
    color: '#43a047',
    textAlign: 'center',
  },
  error: {
    color: '#dc3545',
    marginTop: 6,
    fontSize: 14,
  },
});

export default AudioChallenge;
