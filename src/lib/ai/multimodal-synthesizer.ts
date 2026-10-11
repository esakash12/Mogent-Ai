import prisma from "@/lib/db";
import { decryptSecret } from "@/lib/encryption";
import { synthesizeMerchantMemory, SynthesizedMemoryResult } from "./memory-synthesizer";

export interface MultimodalTrainingInput {
  tenantSlug: string;
  text?: string;
  audioBase64?: string;
  audioMimeType?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface MultimodalTrainingResult extends SynthesizedMemoryResult {
  transcribedText?: string;
  extractedFromMedia?: boolean;
}

/**
 * Intelligent Multimodal Synthesizer for Mogent AI:
 * Processes Voice Audio Notes and Images (Size charts, menu cards, price lists)
 * using Gemini's native multimodal comprehension, then converts them into
 * structured Store Living Notebook knowledge entries.
 */
export async function processMultimodalTraining(
  input: MultimodalTrainingInput
): Promise<MultimodalTrainingResult> {
  const { tenantSlug, text, audioBase64, audioMimeType, imageBase64, imageMimeType } = input;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug.toLowerCase() },
  });

  if (!tenant) {
    throw new Error(`Tenant ${tenantSlug} not found`);
  }

  // 1. If only plain text is provided, delegate directly to memory-synthesizer
  if (!audioBase64 && !imageBase64) {
    if (!text || !text.trim()) {
      throw new Error("কোনো টেক্সট, অডিও বা ইমেজ প্রদান করা হয়নি");
    }
    const result = await synthesizeMerchantMemory(tenantSlug, text.trim());
    return {
      ...result,
      transcribedText: text.trim(),
      extractedFromMedia: false,
    };
  }

  // 2. Fetch Master AI Keys
  const superConfig = await prisma.superAdminConfig.findFirst();
  const geminiKey = decryptSecret(superConfig?.geminiApiKey) || process.env.GEMINI_API_KEY;

  if (!geminiKey || geminiKey.trim().length <= 10) {
    throw new Error("এআই ভয়েস ও ইমেজ প্রসেসিংয়ের জন্য মাস্টার জেমিনি এপিআই কি কনফিগার করা নেই।");
  }

  const modelCandidates = [
    superConfig?.defaultAiModel,
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
  ].filter(Boolean) as string[];

  let extractedContentText = "";

  // 3. Process Audio (Voice Note)
  if (audioBase64) {
    const mime = audioMimeType || "audio/webm";
    // Strip header prefix if present (e.g. data:audio/webm;base64,...)
    const cleanAudioBase64 = audioBase64.replace(/^data:[^;]+;base64,/, "");

    const audioPrompt = `আপনি একজন বিশ্বমানের বহুভাষিক ভয়েস ট্রানস্ক্রিপশন ও ব্যবসায়িক বিশ্লেষক।
এই অডিও বার্তায় একজন মার্চেন্ট বা দোকানদার তাঁর অনলাইন শপ সম্পর্কে বাংলায় নির্দেশনা দিচ্ছেন।
আপনার কাজ:
১. অডিওটি অত্যন্ত সূক্ষ্মভাবে শুনে মার্চেন্ট বাংলায় ঠিক কী বলেছেন তা হুবহু নিখুঁত বাংলায় লিখুন (Transcribe)।
২. যদি এতে কোনো ডেলিভারি চার্জ, পণ্যের সাইজ, স্টক, বিকাশ নম্বর, রিটার্ন নিয়ম বা শোরুমের সময়সূচি থাকে, তবে তা পরিষ্কারভাবে গুছিয়ে লিখুন।

শুধুমাত্র বাংলায় কথাটির নির্যাস ও ট্রান্সক্রিপ্ট লিখুন। অতিরিক্ত কোনো ভূমিকা লিখবেন না।`;

    for (const model of modelCandidates) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: audioPrompt },
                  {
                    inline_data: {
                      mime_type: mime,
                      data: cleanAudioBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
            },
          }),
        });

        if (res.ok) {
          const raw = await res.json();
          const responseText = raw.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText && responseText.trim().length > 0) {
            extractedContentText = responseText.trim();
            break;
          }
        } else {
          console.warn(`[MULTIMODAL] Model ${model} audio transcription failed with status ${res.status}`);
        }
      } catch (err) {
        console.warn(`[MULTIMODAL] Audio processing error with model ${model}:`, err);
      }
    }
  }

  // 4. Process Image (Size Chart, Menu Card, Flyer, Price List)
  else if (imageBase64) {
    const mime = imageMimeType || "image/jpeg";
    const cleanImageBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");

    const imagePrompt = `আপনি একজন বিশেষজ্ঞ ব্যবসায়িক ডকুমেন্ট ও ইমেজ অ্যানালাইজার।
এই ছবিতে প্রদর্শিত ডকুমেন্ট (যেমন: কাপড়ের সাইজ চার্ট, খাবারের মেনু কার্ড, প্রাইস লিস্ট, ভিজিটিং কার্ড বা পলিসি রুলস) বিস্তারিত বিশ্লেষণ করুন।
আপনার কাজ:
১. ছবিতে থাকা সমস্ত পণ্যের নাম, মাপ/সাইজ, মূল্য, উপাদান ও নিয়মাবলী পরিষ্কার ও সুস্পষ্ট বাংলায় তালিকাভুক্ত করুন।
২. মার্চেন্ট যদি কোনো কাস্টম নির্দেশ লিখে থাকেন: "${text || ""}", তবে তার সাথে ছবির তথ্য মিলিয়ে সামগ্রিক ব্যবসায়িক নিয়ম লিখুন।

শুধুমাত্র বাংলায় পরিষ্কার পয়েন্ট আকারে তথ্যগুলো উপস্থাপন করুন।`;

    for (const model of modelCandidates) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: imagePrompt },
                  {
                    inline_data: {
                      mime_type: mime,
                      data: cleanImageBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
            },
          }),
        });

        if (res.ok) {
          const raw = await res.json();
          const responseText = raw.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText && responseText.trim().length > 0) {
            extractedContentText = responseText.trim();
            break;
          }
        } else {
          console.warn(`[MULTIMODAL] Model ${model} vision analysis failed with status ${res.status}`);
        }
      } catch (err) {
        console.warn(`[MULTIMODAL] Image processing error with model ${model}:`, err);
      }
    }
  }

  if (!extractedContentText || extractedContentText.trim().length === 0) {
    throw new Error("ভয়েস বা ইমেজ থেকে কোনো অর্থপূর্ণ তথ্য শনাক্ত করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
  }

  // 5. Synthesize into structured Store Living Notebook knowledge entry
  const memoryResult = await synthesizeMerchantMemory(tenantSlug, extractedContentText);

  return {
    ...memoryResult,
    transcribedText: extractedContentText,
    extractedFromMedia: true,
  };
}
