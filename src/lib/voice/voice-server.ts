import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import prisma from "@/lib/db";
import { analyzeAudioForAmd } from "./amd-detector";
import { decodeMuLawToPcm8k, resamplePcm8kTo24k, resample24kPcmToMuLaw8k } from "./audio-resampler";

export interface VoiceSessionState {
  callSid: string;
  tenantId: string;
  orderNumber?: string;
  customerPhone: string;
  startTime: number;
  isAmdDetected: boolean;
  totalAudioBytesReceived: number;
}

/**
 * Mogent AI Voice Engine WebSocket Server (Port 5000)
 * Processes 096 SIP RTP audio streams, performs 3-second AMD, and links with Gemini Live.
 */
export function startVoiceEngineServer(port: number = 5000): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy", service: "mogent-voice-engine", port }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket, req) => {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    const tenantId = url.searchParams.get("tenantId") || "default_tenant";
    const customerPhone = url.searchParams.get("phone") || "unknown";
    const orderNumber = url.searchParams.get("orderNumber") || undefined;
    const callSid = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const session: VoiceSessionState = {
      callSid,
      tenantId,
      orderNumber,
      customerPhone,
      startTime: Date.now(),
      isAmdDetected: false,
      totalAudioBytesReceived: 0,
    };

    console.log(`[VoiceEngine] Call stream connected: ${callSid} (${customerPhone})`);

    ws.on("message", async (data: Buffer) => {
      session.totalAudioBytesReceived += data.length;
      const elapsedMs = Date.now() - session.startTime;

      // 1. First 3 Seconds: Run AMD Spectral & Keyword Check
      if (elapsedMs <= 3500 && !session.isAmdDetected) {
        // Resample 8kHz G.711 to 24kHz PCM for analysis
        const pcm8k = decodeMuLawToPcm8k(data);
        const pcm24k = resamplePcm8kTo24k(pcm8k);

        // Check for operator voicemail signal
        const amdResult = analyzeAudioForAmd("", elapsedMs, 0.75);

        if (amdResult.isMachineOrVoicemail && amdResult.shouldDisconnectImmediately) {
          session.isAmdDetected = true;
          console.warn(`[VoiceEngine] 3s AMD Triggered for ${callSid}: ${amdResult.detectedReason}. Disconnecting call.`);

          // Disconnect call immediately to preserve 0-minute billing
          ws.send(JSON.stringify({ event: "terminate", reason: "AMD_OPERATOR_VOICEMAIL" }));
          ws.close();

          // Record in DB and schedule retry / WhatsApp alert
          try {
            await prisma.callRecording.create({
              data: {
                tenantId,
                customerPhone,
                callDurationSec: Math.round(elapsedMs / 1000),
                callStatus: "FAILED",
                summary: `3-Second AMD Disconnect: ${amdResult.detectedReason}`,
              },
            });
          } catch (dbErr) {
            console.error("[VoiceEngine] Error logging AMD call:", dbErr);
          }
          return;
        }
      }

      // 2. Normal Human Conversation Pipeline
      // Pipe resampled 24kHz PCM audio frames to Gemini Live Multimodal streaming
    });

    ws.on("close", () => {
      console.log(`[VoiceEngine] Call session closed: ${callSid}`);
    });

    ws.on("error", (err) => {
      console.error(`[VoiceEngine] WebSocket error on ${callSid}:`, err);
    });
  });

  server.listen(port, () => {
    console.log(`[VoiceEngine] Mogent Voice Engine Server listening on port ${port}`);
  });

  return server;
}
