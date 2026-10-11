import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { dispatchAiResponse } from "@/lib/ai/model-switcher";
import { decryptSecret } from "@/lib/encryption";

export async function POST(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  try {
    const { message, history, mediaUrl, audioBase64, audioMimeType } = await request.json();

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
      include: { products: { where: { isActive: true } } },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    let effectiveMessage = (message || "").trim();

    // If audio is provided, transcribe it using Gemini transcribe
    if (audioBase64) {
      try {
        const superConfig = await prisma.superAdminConfig.findFirst();
        const geminiKey = decryptSecret(superConfig?.geminiApiKey) || process.env.GEMINI_API_KEY;
        if (geminiKey) {
          const rawB64 = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
          const mime = audioMimeType || "audio/webm";
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: AbortSignal.timeout(15000),
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        inline_data: {
                          mime_type: mime,
                          data: rawB64,
                        },
                      },
                      { text: "Transcribe this audio in Bengali accurately." },
                    ],
                  },
                ],
              }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            const transcript = (
              data.candidates?.[0]?.content?.parts?.[0]?.audioTranscription?.text ||
              data.candidates?.[0]?.content?.parts?.[0]?.text ||
              ""
            ).trim();
            if (transcript) {
              effectiveMessage = effectiveMessage
                ? `${effectiveMessage}\n🎵 [ভয়েস মেসেজ]: "${transcript}"`
                : `[কাস্টমার একটি ভয়েস মেসেজ পাঠিয়েছেন। ট্রান্সক্রিপ্ট]: "${transcript}"`;
            }
          }
        }
      } catch (audioErr) {
        console.warn("[Simulator Audio Transcribe Error]", audioErr);
      }
    }

    if (!effectiveMessage && mediaUrl) {
      effectiveMessage = "[কাস্টমার একটি ছবি পাঠিয়েছেন]";
    }

    // Format incoming chat history so AI maintains true conversational memory
    const formattedHistory: Array<{ role: "user" | "model"; text: string }> = Array.isArray(history)
      ? history
          .filter((h: any) => h && typeof h.text === "string" && h.text.trim().length > 0)
          .map((h: any) => ({
            role: h.sender === "customer" || h.role === "user" ? ("user" as const) : ("model" as const),
            text: h.text.trim(),
          }))
      : [];

    const response = await dispatchAiResponse(
      tenant.id,
      effectiveMessage,
      "Simulator Customer",
      undefined,
      undefined,
      formattedHistory,
      mediaUrl || undefined
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Simulator chat error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
