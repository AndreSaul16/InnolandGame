/**
 * ARCHIVO: src/services/OpenAIService.js
 * DESCRIPCIÓN: Servicio para interactuar con el backend de Firebase.
 * Este código NO maneja claves de API. Su única responsabilidad es
 * llamar a las Cloud Functions seguras.
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { app } from './FirebaseDataService';
import { getAuth } from "firebase/auth";

class OpenAIService {
  constructor() {
    // --- Configuración ---
    // Inicializa las referencias a los servicios de Firebase.
    const functions = getFunctions(app);
    const storage = getStorage(app);

    // Referencia a la Cloud Function 'evaluateChallenge' en el backend.
    this.evaluateChallengeFunction = httpsCallable(
      functions,
      "evaluateChallenge"
    );

    // Referencia a la Cloud Function 'transcribeAudio' en el backend.
    this.transcribeAudioFunction = httpsCallable(functions, "transcribeAudio");

    // Referencia a Firebase Storage para subir archivos de audio.
    this.storage = storage;

    console.log(
      "✅ OpenAIService listo para comunicarse con el backend seguro de Firebase."
    );
  }

  /**
   * Evalúa la respuesta de un usuario llamando a la Cloud Function segura.
   * @param {string} challengeCriteria Criterios del reto.
   * @param {string} userAnswer Respuesta del jugador.
   * @param {string} playerRole Rol del jugador.
   * @returns {Promise<{isCorrect: boolean, feedback: string}>} El resultado de la evaluación.
   */
  async evaluateAnswer(challengeCriteria, userAnswer, playerRole) {
    const playerData = {
      evaluationCriteria: challengeCriteria,
      playerAnswer: userAnswer,
      playerRole: playerRole,
    };

    console.log(
      "📲 Enviando datos a la Cloud Function 'evaluateChallenge'...",
      playerData
    );

    try {
      // Llama a la función en la nube. La lógica y las claves están seguras en el backend.
      const result = await this.evaluateChallengeFunction(playerData);
      console.log("✅ Respuesta recibida de 'evaluateChallenge':", result.data);
      // Firebase envuelve la respuesta en un objeto 'data'. Lo extraemos y lo devolvemos.
      return result.data;
    } catch (error) {
      console.error(
        `[OpenAIService] Error llamando a 'evaluateChallenge' (${error.code}):`,
        error.message
      );
      return {
        isCorrect: false,
        feedback:
          "Innolodón no ha podido evaluar la respuesta. Revisa la conexión con el servidor.",
      };
    }
  }

  /**
   * Transcribe un archivo de audio de forma segura.
   * @param {string} audioUri - URI local del archivo de audio.
   * @returns {Promise<string>} - El texto transcrito.
   */
  async transcribeAudioWhisper(audioUri) {
    console.log("🎙️ Paso 1: Subiendo audio a Firebase Storage...");

    try {
      const response = await fetch(audioUri);
      const blob = await response.blob();

      const filePath = `transcriptions/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.m4a`;
      const storageRef = ref(this.storage, filePath);

      await uploadBytes(storageRef, blob);
      console.log("✅ Audio subido correctamente a:", filePath);

      console.log(
        "☁️ Paso 2: Llamando a la Cloud Function 'transcribeAudio'..."
      );

      const result = await this.transcribeAudioFunction({ filePath: filePath });

      console.log("🗣️ Transcripción recibida:", result.data.text);
      return result.data.text;
    } catch (error) {
      console.error(
        `[OpenAIService] Error en el proceso de transcripción (${error.code}):`,
        error.message
      );
      throw new Error("No se pudo transcribir el audio.");
    }
  }

  /**
   * Genera un reto de tipo "Battle" (pregunta de opción múltiple).
   * Espera un objeto con la forma:
   * {
   *   question: string,
   *   options: string[4],
   *   correctAnswer: number | string,
   *   explanation?: string
   * }
   * @param {Object} params - Parámetros opcionales de generación.
   * @param {string} params.difficulty - Nivel de dificultad (por defecto 'easy').
   * @param {string[]} params.categories - Categorías deseadas.
   * @returns {Promise<Object>} - Reto generado por la IA.
   */
  async generateBattleChallenge(params = {}) {
    try {
      const functions = getFunctions(app);
      const generateBattleChallengeFn = httpsCallable(functions, "generateBattleChallenge");
      const result = await generateBattleChallengeFn(params);
      return result.data;
    } catch (error) {
      console.warn("[OpenAIService] No se pudo generar reto Battle desde la nube. Usando fallback local.", error.message);
      // Fallback estático para desarrollo local sin backend
      return {
        question: "¿Cuál es la capital de Francia?",
        options: ["Madrid", "París", "Berlín", "Roma"],
        correctAnswer: 1,
        explanation: "París es la capital y ciudad más poblada de Francia.",
      };
    }
  }
}

// Exportamos una única instancia del servicio (patrón Singleton).
export default new OpenAIService();
