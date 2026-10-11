import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { dispatchAiResponse } from "@/lib/ai/model-switcher";
import { generateZephyrLiveSpeech } from "@/lib/voice/gemini-live-voice";

// In-memory cache for store greeting audio to make call start instant
const greetingAudioCache = new Map<string, { audioUrl: string | null; greeting: string }>();

export async function POST(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
      include: {
        products: { where: { isActive: true } },
        aiSetting: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const action = body.action || "message";

    if (action === "start") {
      const storeName = tenant.name || "আমাদের স্টোর";
      const greeting = `আসসালামু আলাইকুম! আমি ${storeName} থেকে বলছি। কীভাবে সাহায্য করতে পারি বলুন?`;

      if (greetingAudioCache.has(tenant.id)) {
        const cached = greetingAudioCache.get(tenant.id)!;
        if (cached.audioUrl) {
          return NextResponse.json({
            success: true,
            replyText: cached.greeting,
            audioUrl: cached.audioUrl,
            cached: true,
          });
        }
      }

      let audioUrl: string | null = null;
      let audioError: string | null = null;
      try {
        const zephyrAudio = await generateZephyrLiveSpeech({
          systemInstruction:
            "You are an audio voice agent. Speak the provided Bengali sentence directly, warmly, and naturally in Bengali using your Zephyr voice.",
          userMessage: `Speak this line warmly and naturally in Bengali: "${greeting}"`,
          voiceName: "Zephyr",
        });
        audioUrl = zephyrAudio.audioBase64;
      } catch (err: any) {
        audioError = err?.message || String(err);
        console.warn("[Zephyr Start Audio Error]:", err);
      }

      if (audioUrl) {
        greetingAudioCache.set(tenant.id, { audioUrl, greeting });
      }

      return NextResponse.json({
        success: true,
        replyText: greeting,
        audioUrl,
        audioError,
      });
    }

    if (action === "end") {
      const { callDurationSec = 0, transcript = "", summary = "" } = body;
      const rec = await prisma.callRecording.create({
        data: {
          tenantId: tenant.id,
          customerPhone: "+880 1700-DEMO-VOICE",
          callDurationSec: Math.max(1, Number(callDurationSec) || 0),
          callStatus: "COMPLETED",
          summary: summary
            ? `${summary}\n\n[কল ট্রান্সক্রিপ্ট]:\n${transcript}`
            : transcript || "ব্রাউজার লাইভ ভয়েস কল সম্পন্ন।",
        },
      });

      return NextResponse.json({ success: true, recordingId: rec.id });
    }

    // Normal conversation turn
    const { message = "", history = [] } = body;
    if (!message.trim()) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const formattedHistory = Array.isArray(history)
      ? history
          .filter((h: any) => h && typeof h.text === "string" && h.text.trim())
          .map((h: any) => ({
            role: h.sender === "customer" || h.role === "user" ? ("user" as const) : ("model" as const),
            text: h.text.trim(),
          }))
      : [];

    // 1. Get intelligence reply with store context and catalog
    const aiResponse = await dispatchAiResponse(
      tenant.id,
      message.trim(),
      "Live Caller",
      undefined,
      undefined,
      formattedHistory
    );

    const replyText = aiResponse.replyText;

    // 2. Synthesize using Google's native Gemini Live Zephyr speech model
    let audioUrl: string | null = null;
    try {
      const zephyrAudio = await generateZephyrLiveSpeech({
        userMessage: replyText,
        voiceName: "Zephyr",
      });
      audioUrl = zephyrAudio.audioBase64;
    } catch (voiceErr) {
      console.warn("[Zephyr Live Audio Generation Error]:", voiceErr);
    }

    return NextResponse.json({
      success: true,
      replyText: replyText,
      audioUrl,
      modelUsed: aiResponse.modelUsed,
      voiceUsed: "Zephyr (Gemini 3.8 Live)",
      orderSummary: aiResponse.orderSummary,
      verifiedStock: aiResponse.verifiedStock,
    });
  } catch (error: any) {
    console.error("[Live Voice Call Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
