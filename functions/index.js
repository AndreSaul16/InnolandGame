/**
 * ARCHIVO: functions/index.js
 * VERSIÓN: FINAL. Corrige el bucle de espera (polling loop).
 */

// Importaciones de Firebase Functions v2
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

// Importaciones de Admin SDK y otras librerías
const admin = require("firebase-admin");
const OpenAI = require("openai");
const axios = require("axios");
const FormData = require("form-data");
const os = require("os");
const path = require("path");
const fs = require("fs");

admin.initializeApp();

// --- Definición de Secretos ---
const openaiApiKey = defineSecret("OPENAI_API_KEY");
const openaiAssistantId = defineSecret("OPENAI_ASSISTANT_ID");
const openaiBattleAssistantId = defineSecret("OPENAI_BATTLE_ASSISTANT_ID");
const battleAssistantId = "asst_SNNjtlsvqmQ2pxEFE1vRKxGf"; // Asistente para generar retos Battle

// ========================================================================
//                   FUNCIÓN 1: evaluateChallenge
// ========================================================================
exports.evaluateChallenge = onCall(
  { secrets: [openaiApiKey, openaiAssistantId], timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "La función solo puede ser llamada por un usuario autenticado."
      );
    }

    const apiKey = openaiApiKey.value();
    const assistantId = openaiAssistantId.value();
    
    // Validar que las credenciales estén disponibles
    if (!apiKey) {
      console.error("ERROR: OPENAI_API_KEY no está configurada");
      throw new HttpsError("internal", "La clave API de OpenAI no está configurada.");
    }
    
    if (!assistantId) {
      console.error("ERROR: OPENAI_ASSISTANT_ID no está configurado");
      throw new HttpsError("internal", "El ID del asistente de OpenAI no está configurado.");
    }

    const openai = new OpenAI({ apiKey });

    const { playerRole, evaluationCriteria, playerAnswer } = request.data;
    
    // Validar que los datos necesarios estén presentes
    if (!playerRole || !evaluationCriteria || !playerAnswer) {
      throw new HttpsError(
        "invalid-argument",
        "Los datos requeridos (playerRole, evaluationCriteria, playerAnswer) no están completos."
      );
    }
    
    const userPromptContent = JSON.stringify({
      playerRole,
      evaluationCriteria,
      playerAnswer,
    });

    console.log("Iniciando evaluación para el usuario:", request.auth.uid);

    try {
      console.log("Paso 1: Creando hilo (thread)...");
      const thread = await openai.beta.threads.create();
      
      // VALIDACIÓN CRÍTICA: Verificar que el thread se creó correctamente
      if (!thread || !thread.id) {
        console.error("ERROR CRÍTICO: No se pudo crear el thread o thread.id es undefined");
        console.error("Respuesta del thread:", thread);
        throw new HttpsError(
          "internal",
          "No se pudo crear el hilo de conversación con OpenAI."
        );
      }
      
      // Validar que el thread.id tiene el formato correcto
      if (!thread.id.startsWith('thread_')) {
        console.error("ERROR: thread.id no tiene el formato esperado:", thread.id);
        throw new HttpsError(
          "internal",
          "El hilo de conversación no se creó con un formato válido."
        );
      }
      
      console.log("-> Hilo creado exitosamente con ID:", thread.id);

      console.log("Paso 2: Añadiendo mensaje al hilo...");
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userPromptContent,
      });
      console.log("-> Mensaje añadido exitosamente al hilo.");

      console.log("Paso 3: Iniciando ejecución del asistente...");
      let run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
      });
      
      // Validar que el run se creó correctamente
      if (!run || !run.id) {
        console.error("ERROR: No se pudo crear el run o run.id es undefined");
        throw new HttpsError(
          "internal",
          "No se pudo iniciar la ejecución del asistente."
        );
      }
      
      console.log("-> Ejecución iniciada exitosamente con ID:", run.id);

      // --- BUCLE DE POLLING CON VALIDACIONES MEJORADAS ---
      let pollCount = 0;
      const maxPolls = 60; // Máximo 90 segundos (60 * 1.5s)
      
      console.log("🔄 Iniciando bucle de polling...");
      console.log("📊 Estado inicial:");
      console.log("  - thread.id:", thread.id);
      console.log("  - run.id:", run.id);
      console.log("  - run.status:", run.status);
      
      // CRÍTICO: Preservar los IDs para evitar que se corrompan
      const threadId = thread.id;
      const initialRunId = run.id;
      
      console.log("🔒 IDs preservados:");
      console.log("  - threadId:", threadId);
      console.log("  - initialRunId:", initialRunId);
      
      while (run.status === "queued" || run.status === "in_progress") {
        pollCount++;
        
        console.log(`🔄 Polling ${pollCount}/${maxPolls} - Iniciando iteración...`);
        console.log("📊 Estado antes de validaciones:");
        console.log("  - thread:", typeof thread, thread ? "existe" : "es null/undefined");
        console.log("  - thread.id:", thread ? thread.id : "N/A");
        console.log("  - threadId preservado:", threadId);
        console.log("  - run:", typeof run, run ? "existe" : "es null/undefined");
        console.log("  - run.id:", run ? run.id : "N/A");
        console.log("  - run.status:", run ? run.status : "N/A");
        
        if (pollCount > maxPolls) {
          console.error("ERROR: Timeout en el polling. El asistente tardó demasiado.");
          throw new HttpsError(
            "deadline-exceeded",
            "El asistente tardó demasiado en responder."
          );
        }
        
        // Espera 1.5 segundos antes de volver a comprobar
        console.log("⏱️ Esperando 1.5 segundos...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log("⏱️ Espera completada.");

        // Usar los IDs preservados en lugar de las referencias originales
        const currentThreadId = threadId; // Usar ID preservado
        const currentRunId = run.id; // ID del run actual
        
        console.log("📋 Verificando IDs antes de llamada API:");
        console.log("  - currentThreadId:", currentThreadId);
        console.log("  - currentRunId:", currentRunId);

        // Validar que los IDs preservados estén disponibles
        if (!currentThreadId) {
          console.error("🚨 ERROR CRÍTICO: threadId preservado es undefined");
          console.error("📊 Estado de debugging:", {
            thread: thread,
            threadType: typeof thread,
            threadId: threadId,
            currentThreadId: currentThreadId
          });
          throw new HttpsError(
            "internal",
            "Se perdió la referencia al hilo de conversación durante el polling."
          );
        }
        
        // Validar que run.id sigue siendo válido
        if (!currentRunId) {
          console.error("🚨 ERROR CRÍTICO: currentRunId es undefined durante el polling");
          console.error("📊 Estado del run:", {
            run: run,
            runType: typeof run,
            runId: run ? run.id : "N/A",
            currentRunId: currentRunId
          });
          throw new HttpsError(
            "internal",
            "Se perdió la referencia a la ejecución durante el polling."
          );
        }

        console.log(`🔍 A punto de llamar openai.beta.threads.runs.retrieve con:`);
        console.log(`  - currentThreadId: "${currentThreadId}" (${typeof currentThreadId})`);
        console.log(`  - currentRunId: "${currentRunId}" (${typeof currentRunId})`);

        try {
          // VALIDACIÓN FINAL INMEDIATAMENTE ANTES DE LA LLAMADA
          console.log("🔬 VALIDACIÓN FINAL antes de openai.beta.threads.runs.retrieve:");
          console.log("  - typeof currentThreadId:", typeof currentThreadId);
          console.log("  - currentThreadId.length:", currentThreadId ? currentThreadId.length : "N/A");
          console.log("  - currentThreadId value:", JSON.stringify(currentThreadId));
          console.log("  - typeof currentRunId:", typeof currentRunId);
          console.log("  - currentRunId.length:", currentRunId ? currentRunId.length : "N/A");
          console.log("  - currentRunId value:", JSON.stringify(currentRunId));
          
          // VERIFICAR QUE OPENAI ESTÉ DISPONIBLE
          console.log("  - typeof openai:", typeof openai);
          console.log("  - openai.beta disponible:", !!openai.beta);
          console.log("  - openai.beta.threads disponible:", !!openai.beta?.threads);
          console.log("  - openai.beta.threads.runs disponible:", !!openai.beta?.threads?.runs);
          console.log("  - openai.beta.threads.runs.retrieve disponible:", typeof openai.beta?.threads?.runs?.retrieve);
          
          // CREAR VARIABLES LOCALES PARA ASEGURAR EL SCOPE
          const finalThreadId = String(currentThreadId);
          const finalRunId = String(currentRunId);
          
          console.log("🔒 Variables locales finales:");
          console.log("  - finalThreadId:", JSON.stringify(finalThreadId));
          console.log("  - finalRunId:", JSON.stringify(finalRunId));
          
          // LLAMADA CON SINTAXIS ALTERNATIVA (BASADA EN EJEMPLOS RECIENTES)
          console.log("🚀 Ejecutando llamada API con sintaxis alternativa...");
          
          // Intentar con sintaxis de objeto explícita
          const retrieveParams = {
            thread_id: finalThreadId,
            run_id: finalRunId
          };
          
          console.log("📋 Parámetros del retrieve:", JSON.stringify(retrieveParams));
          
          // Usar .retrieve con parámetros explícitos
          run = await openai.beta.threads.runs.retrieve(finalThreadId, finalRunId);
          console.log(`✅ Polling ${pollCount}/${maxPolls} - Estado de la ejecución:`, run.status);
        } catch (retrieveError) {
          console.error("🚨 ERROR en openai.beta.threads.runs.retrieve:");
          console.error("  - Mensaje:", retrieveError.message);
          console.error("  - Código:", retrieveError.code);
          console.error("  - Tipo:", retrieveError.type);
          console.error("  - Status:", retrieveError.status);
          console.error("  - threadId usado:", currentThreadId);
          console.error("  - runId usado:", currentRunId);
          console.error("  - Headers del error:", retrieveError.headers);
          console.error("  - Request ID:", retrieveError.requestID);
          console.error("  - Error completo:", JSON.stringify(retrieveError, null, 2));
          
          // INTENTAR DEBUGGING ADICIONAL
          console.error("🔬 Debugging adicional:");
          console.error("  - Error name:", retrieveError.name);
          console.error("  - Error constructor:", retrieveError.constructor.name);
          console.error("  - Error stack:", retrieveError.stack);
          
          // INTENTAR MÉTODO ALTERNATIVO COMO FALLBACK
          console.log("🔄 Intentando método alternativo...");
          try {
            // Método alternativo: recrear la llamada con un timeout
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log("🔄 Reintentando con parámetros frescos...");
            const freshThreadId = threadId; // Usar el ID preservado original
            const freshRunId = run.id; // Usar el ID del run actual
            
            console.log("  - freshThreadId:", freshThreadId);
            console.log("  - freshRunId:", freshRunId);
            
            run = await openai.beta.threads.runs.retrieve(freshThreadId, freshRunId);
            console.log(`✅ Polling ${pollCount}/${maxPolls} - Estado de la ejecución (método alternativo):`, run.status);
          } catch (secondError) {
            console.error("🚨 ERROR también en método alternativo:", secondError.message);
            throw retrieveError; // Re-lanzar el error original
          }
        }
      }

      if (run.status !== "completed") {
        console.error(
          "El 'run' del Asistente ha fallado. Estado final:",
          run.status,
          "Error:",
          run.last_error
        );
        throw new HttpsError(
          "internal",
          `La ejecución del asistente no se completó. Estado: ${run.status}`
        );
      }

      console.log("Paso 4: Ejecución completada. Obteniendo mensajes...");
      const messages = await openai.beta.threads.messages.list(thread.id);
      
      if (!messages || !messages.data) {
        console.error("ERROR: No se pudieron obtener los mensajes del thread");
        throw new HttpsError(
          "internal",
          "No se pudieron obtener los mensajes de la conversación."
        );
      }
      
      const assistantMessage = messages.data.find(
        (msg) => msg.role === "assistant"
      );

      if (assistantMessage?.content[0]?.type === "text") {
        const responseText = assistantMessage.content[0].text.value;
        console.log("Paso 5: Respuesta recibida del asistente:", responseText);

        try {
          const parsedResponse = JSON.parse(responseText);
          console.log("✅ Evaluación completada exitosamente");
          return parsedResponse;
        } catch (jsonError) {
          console.error(
            "Error al parsear la respuesta del asistente como JSON.",
            jsonError,
            "Respuesta recibida:",
            responseText
          );
          throw new HttpsError(
            "internal",
            "La respuesta del asistente no tenía un formato JSON válido."
          );
        }
      } else {
        console.error(
          "El Asistente no devolvió una respuesta de texto válida.",
          "AssistantMessage:",
          assistantMessage
        );
        throw new HttpsError(
          "internal",
          "La respuesta del asistente estaba vacía o en un formato inesperado."
        );
      }
    } catch (error) {
      // Si es un HttpsError que ya creamos, simplemente lo relanzamos
      if (error instanceof HttpsError) {
        console.error("HttpsError capturado:", error.message);
        throw error;
      }
      
      // Para otros errores, logueamos más detalles y creamos un HttpsError genérico
      console.error("Error general en la ejecución del Asistente:");
      console.error("- Mensaje:", error.message);
      console.error("- Stack:", error.stack);
      console.error("- Código de error:", error.code);
      console.error("- Tipo de error:", error.type);
      
      throw new HttpsError(
        "internal",
        `Hubo un error fatal al procesar la evaluación: ${error.message}`
      );
    }
  }
);

// ========================================================================
//                  FUNCIÓN 2: transcribeAudio (Sin cambios)
// ========================================================================
exports.transcribeAudio = onCall(
  { secrets: [openaiApiKey] },
  async (request) => {
    if (!request.auth)
      throw new HttpsError(
        "unauthenticated",
        "La función solo puede ser llamada por un usuario autenticado."
      );

    const openai_key = openaiApiKey.value();
    if (!openai_key)
      throw new HttpsError(
        "internal",
        "La clave API de OpenAI no está configurada."
      );

    const filePath = request.data.filePath;
    if (!filePath)
      throw new HttpsError(
        "invalid-argument",
        "La función debe ser llamada con un 'filePath'."
      );

    const bucket = admin.storage().bucket();
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));

    try {
      await bucket.file(filePath).download({ destination: tempFilePath });
      const formData = new FormData();
      formData.append("file", fs.createReadStream(tempFilePath));
      formData.append("model", "whisper-1");
      formData.append("language", "es");

      const whisperResponse = await axios.post(
        "https://api.openai.com/v1/audio/transcriptions",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${openai_key}`,
          },
        }
      );

      fs.unlinkSync(tempFilePath);
      await bucket.file(filePath).delete();

      return { text: whisperResponse.data.text };
    } catch (error) {
      console.error(
        "Error en transcribeAudio:",
        error.response ? error.response.data : error.message
      );
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw new HttpsError("internal", "Error al transcribir el audio.");
    }
    
  }
);

// ========================================================================
//                   FUNCIÓN 3: generateBattleChallenge
// ========================================================================
exports.generateBattleChallenge = onCall(
  { secrets: [openaiApiKey, openaiBattleAssistantId], timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "La función solo puede ser llamada por un usuario autenticado."
      );
    }

    const apiKey = openaiApiKey.value();
    if (!apiKey) {
      console.error("ERROR: OPENAI_API_KEY no está configurada");
      throw new HttpsError(
        "internal",
        "La clave API de OpenAI no está configurada."
      );
    }
    const battleAssistantId = openaiBattleAssistantId.value();
    if (!battleAssistantId) {
      console.error("ERROR: OPENAI_BATTLE_ASSISTANT_ID no está configurado");
      throw new HttpsError(
        "internal",
        "El ID del asistente Battle no está configurado."
      );
    }

    // Parámetros opcionales para personalizar la generación
    const { difficulty = "normal", categories = [] } = request.data || {};

    const openai = new OpenAI({ apiKey });

    try {
      console.log("[Battle] Creando thread...");
      const thread = await openai.beta.threads.create();
      if (!thread?.id) {
        throw new HttpsError(
          "internal",
          "No se pudo crear el hilo de conversación para Battle."
        );
      }

      // Construimos el prompt para el asistente
      const promptContent = JSON.stringify({
        action: "GENERATE_BATTLE_CHALLENGE",
        difficulty,
        categories,
      });

      console.log("[Battle] Añadiendo mensaje al thread...");
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: promptContent,
      });

      console.log("[Battle] Iniciando run con asistente Battle...");
      let run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: battleAssistantId,
      });

      // Esperamos a que el asistente complete la respuesta (polling sencillo)
      const maxLoops = 60;
      let loops = 0;
      while ((run.status === "queued" || run.status === "in_progress") && loops < maxLoops) {
        await new Promise((res) => setTimeout(res, 1500));
        run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        loops++;
      }

      if (run.status !== "completed") {
        throw new HttpsError(
          "internal",
          `La ejecución del asistente Battle no se completó. Estado: ${run.status}`
        );
      }

      console.log("[Battle] Obteniendo mensajes del asistente...");
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find((m) => m.role === "assistant");
      const textResponse = assistantMessage?.content?.[0]?.text?.value;
      if (!textResponse) {
        throw new HttpsError(
          "internal",
          "La respuesta del asistente Battle estaba vacía o en formato inesperado."
        );
      }

      try {
        const challenge = JSON.parse(textResponse);
        console.log("[Battle] Reto Battle generado:", challenge);
        return challenge;
      } catch (e) {
        console.error("[Battle] Error parseando respuesta:", e, textResponse);
        throw new HttpsError(
          "internal",
          "La respuesta del asistente Battle no era un JSON válido."
        );
      }
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("[Battle] Error general:", error);
      throw new HttpsError(
        "internal",
        `Error generando reto Battle: ${error.message}`
      );
    }
  }
);
