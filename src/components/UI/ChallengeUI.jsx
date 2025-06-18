import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { COLORS, FONTS } from "../../theme";
import { addMagnetosToPlayerInRoom } from "../../services/FirebaseDataService";
import OpenAIService from "../../services/OpenAIService";

const ChallengeUI = (props) => {
  const route = useRoute();
  const navigation = useNavigation();
  const challenge = props.challenge || route.params?.challenge;
  const user = props.user || route.params?.user;
  const onBack = props.onBack || (() => navigation.goBack());

  const [userInput, setUserInput] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (validationResult) {
      animValue.setValue(0);
      Animated.spring(animValue, {
        toValue: 1,
        friction: 5,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    }
  }, [validationResult]);

  useEffect(() => {
    setUserInput("");
    setValidationResult(null);
  }, [challenge]);

  const handleSubmit = async () => {
    if (!userInput || !challenge || !user) return;
    setLoading(true);
    setValidationResult(null);
    try {
      const result = await OpenAIService.evaluateAnswer(
        challenge.criteria,
        userInput,
        user.rol || user.role || "Jugador"
      );
      setValidationResult(result);
      if (props.onSubmit) props.onSubmit(userInput, result);
      if (result.isCorrect && user.uid && user.roomCode) {
        await addMagnetosToPlayerInRoom(user.roomCode, user.uid, 10);
      }
    } catch (e) {
      setValidationResult({
        isCorrect: false,
        feedback: "Error validando con IA.",
      });
      console.log("[ChallengeUI] Error al validar con la Cloud Function:", e);
    }
    setLoading(false);
  };

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text>Esperando un reto para mostrar...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.outerBox}>
        <View style={styles.container}>
          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.question}>{challenge.question}</Text>
          <TextInput
            style={[styles.input, { minHeight: 60, fontSize: 18 }]}
            placeholder={challenge.placeholder}
            value={userInput}
            onChangeText={setUserInput}
            placeholderTextColor="#b0b0b0"
            multiline
            editable={!validationResult}
          />
          <View style={styles.buttonContainer}>
            <Button
              title="Enviar Respuesta"
              onPress={handleSubmit}
              disabled={loading || !userInput || !!validationResult}
              color={COLORS.blue}
            />
          </View>
          <View style={styles.backButtonContainer}>
            <Button
              title="Regresar"
              onPress={onBack}
              color={COLORS.gray}
              disabled={!validationResult && !props.allowBack}
            />
          </View>
          {loading && (
            <ActivityIndicator
              style={{ marginTop: 20 }}
              size="large"
              color={COLORS.blue}
            />
          )}
          {validationResult && (
            <Animated.View
              style={[
                styles.resultBox,
                {
                  backgroundColor: validationResult.isCorrect
                    ? COLORS.successBackground
                    : COLORS.errorBackground,
                  borderColor: validationResult.isCorrect
                    ? COLORS.success
                    : COLORS.error,
                  shadowColor: validationResult.isCorrect
                    ? COLORS.success
                    : COLORS.error,
                  transform: [
                    {
                      scale: animValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1],
                      }),
                    },
                    {
                      rotate: animValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["-10deg", "0deg"],
                      }),
                    },
                  ],
                  opacity: animValue,
                },
              ]}
            >
              <Text
                style={[
                  styles.resultTitle,
                  {
                    color: validationResult.isCorrect
                      ? COLORS.successText
                      : COLORS.errorText,
                  },
                ]}
              >
                {validationResult.isCorrect ? "¡CORRECTO!" : "INCORRECTO"}
              </Text>
              <Text style={styles.feedbackText}>
                {validationResult.feedback}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  outerBox: {
    width: "95%",
    maxWidth: 500,
    alignSelf: "center",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: 500,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: COLORS.darkBlue,
    letterSpacing: 1,
    fontFamily: FONTS.title,
  },
  question: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
    color: COLORS.blue,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.blue,
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    fontSize: 17,
    width: "100%",
    backgroundColor: "#fff",
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContainer: {
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    backgroundColor: COLORS.blue,
  },
  backButtonContainer: {
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 8,
    marginTop: 0,
  },
  resultBox: {
    marginTop: 28,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 1,
  },
  feedbackText: {
    fontSize: 17,
    textAlign: "center",
  },
});

export default ChallengeUI;
