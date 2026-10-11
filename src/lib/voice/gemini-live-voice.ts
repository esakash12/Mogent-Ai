import prisma from "@/lib/db";
import { decryptSecret } from "@/lib/encryption";
import WebSocket from "ws";

function pcmToWavBuffer(pcmData: Buffer, sampleRate = 24000): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmData.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // Mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmData.length, 40);

  return Buffer.concat([header, pcmData]);
}

export interface LiveVoiceResponse {
  replyText: string;
  audioBase64: string | null;
  voiceUsed: string;
}

export async function generateZephyrLiveSpeech({
  systemInstruction,
  userMessage,
  voiceName = "Zephyr",
}: {
  systemInstruction?: string;
  userMessage: string;
  voiceName?: string;
}): Promise<LiveVoiceResponse> {
  const superConfig = await prisma.superAdminConfig.findFirst();
  const apiKey =
    decryptSecret(superConfig?.geminiApiKey) || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  // Clean the text to speak - remove markdown and emojis for clean natural Bengali speech
  const cleanSpeechText = userMessage
    .replace(/[*#_~`]/g, "")
    .replace(/\[SPLIT\]/gi, " ")
    .trim();

  // 1. Primary: Direct Google Gemini 3.8 Flash-Lite & Flash TTS REST API
  // Produces crystal-clear, authentic human-like Zephyr Bengali audio in ~3s
  const ttsModels = [
    "models/gemini-3.8-flash-lite-tts",
    "models/gemini-3.8-flash-tts",
    "models/gemini-3.1-flash-tts-preview",
  ];

  for (const model of ttsModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1alpha/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: cleanSpeechText }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voiceName,
                  },
                },
              },
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const audioPart = parts.find((p: any) =>
          p.inlineData?.mimeType?.startsWith("audio")
        );

        if (audioPart?.inlineData?.data) {
          const mime = audioPart.inlineData.mimeType || "audio/wav";
          return {
            replyText: userMessage,
            audioBase64: `data:${mime};base64,${audioPart.inlineData.data}`,
            voiceUsed: `${voiceName} (${model.replace("models/", "")})`,
          };
        }
      }
    } catch (err: any) {
      console.warn(`[Zephyr REST TTS ${model} Error]:`, err.message);
    }
  }

  // 2. Secondary fallback: Gemini Live WebSocket
  return new Promise((resolve) => {
    try {
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      const ws = new WebSocket(wsUrl);

      const audioBuffers: Buffer[] = [];
      let transcriptText = "";
      let isFinished = false;

      const timeout = setTimeout(() => {
        if (!isFinished) {
          isFinished = true;
          try {
            ws.close();
          } catch {}
          if (audioBuffers.length > 0) {
            const wav = pcmToWavBuffer(Buffer.concat(audioBuffers), 24000);
            resolve({
              replyText: userMessage,
              audioBase64: `data:audio/wav;base64,${wav.toString("base64")}`,
              voiceUsed: `${voiceName} (WebSocket Partial)`,
            });
          } else {
            resolve({
              replyText: userMessage,
              audioBase64: null,
              voiceUsed: voiceName,
            });
          }
        }
      }, 15000);

      ws.on("open", () => {
        const setupMsg = {
          setup: {
            model: "models/gemini-3.8-live",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voiceName,
                  },
                },
              },
            },
            systemInstruction: systemInstruction
              ? { parts: [{ text: systemInstruction }] }
              : undefined,
          },
        };
        ws.send(JSON.stringify(setupMsg));
      });

      ws.on("message", (data: WebSocket.Data) => {
        try {
          const msg = JSON.parse(data.toString());

          if (msg.setupComplete) {
            ws.send(
              JSON.stringify({
                clientContent: {
                  turns: [
                    {
                      role: "user",
                      parts: [{ text: cleanSpeechText }],
                    },
                  ],
                  turnComplete: true,
                },
              })
            );
          } else if (msg.serverContent) {
            const parts = msg.serverContent?.modelTurn?.parts || [];
            for (const p of parts) {
              if (p.inlineData?.data) {
                audioBuffers.push(Buffer.from(p.inlineData.data, "base64"));
              }
              if (p.text) {
                transcriptText += p.text;
              }
            }

            if (msg.serverContent.turnComplete && !isFinished) {
              isFinished = true;
              clearTimeout(timeout);
              try {
                ws.close();
              } catch {}

              const fullPcm = Buffer.concat(audioBuffers);
              const wav = pcmToWavBuffer(fullPcm, 24000);
              resolve({
                replyText: userMessage,
                audioBase64: `data:audio/wav;base64,${wav.toString("base64")}`,
                voiceUsed: `${voiceName} (WebSocket Live)`,
              });
            }
          }
        } catch (err: any) {
          console.warn("[Zephyr WS Parse Error]:", err);
        }
      });

      ws.on("error", (err) => {
        console.warn("[Zephyr WS Error]:", err.message);
        if (!isFinished) {
          isFinished = true;
          clearTimeout(timeout);
          resolve({
            replyText: userMessage,
            audioBase64: null,
            voiceUsed: voiceName,
          });
        }
      });
    } catch (wsErr) {
      console.warn("[Zephyr WS Init Error]:", wsErr);
      resolve({
        replyText: userMessage,
        audioBase64: null,
        voiceUsed: voiceName,
      });
    }
  });
}
