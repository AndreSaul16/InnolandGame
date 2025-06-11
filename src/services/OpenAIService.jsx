// src/services/OpenAIService.js
import axios from "axios";
import { REACT_APP_OPENAI_API_KEY, REACT_APP_OPENAI_ASSISTANT_ID } from "@env";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class OpenAIService {
  constructor() {
    console.log(
      "🔑 Cargando API Key:",
      REACT_APP_OPENAI_API_KEY ? "Encontrada" : "NO ENCONTRADA"
    );

    // Esto se mantiene igual. Carga las credenciales y configura el cliente.
    this.apiKey = REACT_APP_OPENAI_API_KEY;
    this.assistantId = REACT_APP_OPENAI_ASSISTANT_ID;

    if (!this.apiKey || !this.assistantId) {
      throw new Error(
        "OpenAI API Key or Assistant ID is missing. Check your .env file."
      );
    }

    this.client = axios.create({
      baseURL: "https://api.openai.com/v1",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
    });
  }

  /**
   * Evalúa la respuesta de un usuario enviando solo los datos del turno a Innolodón.
   * Innolodón ya conoce su rol y formato de respuesta desde la plataforma de OpenAI.
   * @param {string} challengeCriteria Los criterios del reto actual.
   * @param {string} userAnswer La respuesta del jugador.
   * @param {string} playerRole El rol actual del jugador.
   * @returns {Promise<{isCorrect: boolean, feedback: string}>} El resultado de la evaluación.
   */
  async evaluateAnswer(challengeCriteria, userAnswer, playerRole) {
    // CAMBIO CLAVE: El prompt ahora es mucho más simple.
    // Solo enviamos los datos variables de este turno. Las instrucciones
    // generales ya las tiene Innolodón.
    const userPrompt = `
      Datos para la Evaluación:
      {
        "playerRole": "${playerRole}",
        "evaluationCriteria": "${challengeCriteria}",
        "playerAnswer": "${userAnswer}"
      }
    `;

    try {
      // Llamamos al mismo método privado que ya funcionaba.
      const assistantResponseText = await this._runAssistantWithPrompt(
        userPrompt
      );

      // La respuesta de la IA (garantizada como JSON) se parsea como antes.
      return JSON.parse(assistantResponseText);
    } catch (error) {
      console.error("[OpenAIService] Error evaluating answer:", error);
      return {
        isCorrect: false,
        feedback:
          "Innolodón no ha podido evaluar la respuesta. Inténtalo de nuevo.",
      };
    }
  }

  // Este método privado no necesita cambios. Su lógica para manejar
  // la conversación con el asistente sigue siendo correcta.
  async _runAssistantWithPrompt(prompt) {
    try {
      const threadResponse = await this.client.post("/threads");
      const threadId = threadResponse.data.id;

      await this.client.post(`/threads/${threadId}/messages`, {
        role: "user",
        content: prompt,
      });

      const runResponse = await this.client.post(`/threads/${threadId}/runs`, {
        assistant_id: this.assistantId,
      });
      const runId = runResponse.data.id;
      let runStatus = runResponse.data.status;
      let attempts = 0;
      while (
        (runStatus === "queued" || runStatus === "in_progress") &&
        attempts < 20
      ) {
        await sleep(1500);
        const statusResponse = await this.client.get(
          `/threads/${threadId}/runs/${runId}`
        );
        runStatus = statusResponse.data.status;
        attempts++;
      }

      if (runStatus !== "completed") {
        throw new Error(`Run failed with status: ${runStatus}`);
      }

      const messagesResponse = await this.client.get(
        `/threads/${threadId}/messages`
      );
      const assistantMessage = messagesResponse.data.data.find(
        (msg) => msg.role === "assistant"
      );
      if (assistantMessage?.content[0]?.type === "text") {
        return assistantMessage.content[0].text.value;
      }
      throw new Error("Assistant did not return a valid response.");
    } catch (error) {
      console.error(
        "Error in _runAssistantWithPrompt:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Transcribe un archivo de audio usando la API Whisper de OpenAI.
   * @param {string} audioUri - URI local del archivo de audio (por ejemplo, de expo-av).
   * @returns {Promise<string>} - Texto transcrito.
   */
  // src/services/OpenAIService.js

  async transcribeAudioWhisper(audioUri) {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: audioUri,
        name: "audio.m4a",
        type: "audio/m4a",
      });
      formData.append("model", "whisper-1");
      formData.append("language", "es");

      const response = await axios.post(
        "https://api.openai.com/v1/audio/transcriptions",
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 60000, // <--- AÑADE ESTA LÍNEA (60000 ms = 60 segundos)
        }
      );
      return response.data.text;
    } catch (error) {
      // Este log ahora es más importante que nunca para ver el error real
      console.error(
        "[OpenAIService] Error transcribiendo audio:",
        error.toJSON ? error.toJSON() : error
      );
      throw new Error("No se pudo transcribir el audio.");
    }
  }
}

export default new OpenAIService();
