import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { decryptSecret } from "@/lib/encryption";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const {
      productTopic,
      targetAudience = "General Shoppers",
      tone = "Persuasive",
    } = await req.json();

    if (!productTopic || !productTopic.trim()) {
      return NextResponse.json({ error: "পণ্যের নাম বা বিবরণ প্রদান করুন।" }, { status: 400 });
    }

    // 1. Fetch Master API Keys
    const superConfig = await prisma.superAdminConfig.findFirst();
    const geminiKey = decryptSecret(superConfig?.geminiApiKey) || process.env.GEMINI_API_KEY;
    const openaiKey = decryptSecret(superConfig?.openaiApiKey) || process.env.OPENAI_API_KEY;

    const promptText = `আপনি বাংলাদেশের সেরা একজন ই-কমার্স ফেসবুক অ্যাড কপিরাইটার।
পণ্যের নাম: ${productTopic}
টার্গেট অডিয়েন্স: ${targetAudience}
টোন / লেখার ধরন: ${tone}

আপনার কাজ হলো আকর্ষণীয় বাংলা ফেসবুক বিজ্ঞাপন কপি তৈরি করা।
অবশ্যই নিচের JSON ফরম্যাটে উত্তর দিন:
{
  "variationA": "আকর্ষণীয় হুক, ৩-৪টি বুলেট পয়েন্ট সুবিধা, ক্যাশ অন ডেলিভারি ভরসা ও ইনবক্স করার স্পষ্ট CTA সহ পূর্ণাঙ্গ কপি",
  "variationB": "সীমিত সময়ের অফার, ছাড়, ডেলিভারি ম্যানের সামনে চেক করার নিশ্চয়তা ও অর্ডার নাও CTA সহ বিকল্প কপি",
  "headlines": ["হেডলাইন ১", "হেডলাইন ২", "হেডলাইন ৩", "হেডলাইন ৪"],
  "hashtags": "#অনলাইনশপিং #বাংলাদেশ #অফার #বেস্টডিল"
}
শুধুমাত্র সঠিক JSON রিটার্ন করবেন, অন্য কোনো ভূমিকা বা অতিরিক্ত কথা লিখবেন না।`;

    let generatedData: any = null;

    // 2. Call Google Gemini 3.5 Flash Lite
    if (geminiKey && geminiKey.trim().length > 10) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiKey}`;
        const res = await fetch(geminiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
          }),
        });

        if (res.ok) {
          const geminiRes = await res.json();
          const rawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

          try {
            generatedData = JSON.parse(cleanJson);
          } catch {
            generatedData = {
              variationA: rawText,
              variationB: rawText,
              headlines: [`আকর্ষণীয় অফারে কিনুন ${productTopic}`],
              hashtags: "#অনলাইনশপ #বেস্টঅফার",
            };
          }
        }
      } catch (geminiErr) {
        console.warn("[CREATIVE STUDIO] Gemini generation error:", geminiErr);
      }
    }

    // 3. Fallback to OpenAI if Gemini was not used or failed
    if (!generatedData && openaiKey && openaiKey.trim().length > 10) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: promptText }],
            response_format: { type: "json_object" },
          }),
        });

        if (res.ok) {
          const openAiRes = await res.json();
          const rawContent = openAiRes.choices?.[0]?.message?.content || "";
          try {
            generatedData = JSON.parse(rawContent);
          } catch {
            generatedData = { variationA: rawContent, variationB: rawContent };
          }
        }
      } catch (openAiErr) {
        console.warn("[CREATIVE STUDIO] OpenAI generation error:", openAiErr);
      }
    }

    // 4. Intelligent Fallback Template if no API keys are available
    if (!generatedData) {
      generatedData = {
        variationA: `আপনার পছন্দের ${productTopic} এখন সেরা দামে!\n\nদৈনন্দিন জীবনে কোয়ালিটি ও নির্ভরযোগ্যতার সেরা সমাধান নিয়ে এলো ${tenant.name}।\n\nমূল সুবিধাসমূহ:\n• ১০০% প্রিমিয়াম ও অরিজিনাল কোয়ালিটি\n• দীর্ঘস্থায়ী ও আধুনিক ডিজাইন\n• দৈনন্দিন ব্যবহারের জন্য অত্যন্ত কার্যকরী\n\nক্যাশ অন ডেলিভারি সুবিধা: পণ্য হাতে পেয়ে চেক করে পেমেন্ট করার সুযোগ।\n\nস্টক সীমিত! আজই বিশেষ অফারে অর্ডার করতে আমাদের পেজে সরাসরি ইনবক্স করুন।`,
        variationB: `লিমিটেড টাইম মেগা ডিল! ${productTopic} এ চলছে বিশেষ মূল্যছাড়!\n\nদেরি না করে এখনই সংগ্রহ করুন আপনার পছন্দের আইটেমটি।\n\nকেন আমাদের থেকে নেবেন?\n- সারা বাংলাদেশে দ্রুত হোম ডেলিভারি\n- ডেলিভারি ম্যানের সামনে চেক করে রিসিভ করার পূর্ণ সুযোগ\n- বিশ্বস্ত কাস্টমার সাপোর্ট\n\nঅর্ডার নিশ্চিত করতে এখনই আপনার নাম, ঠিকানা ও ফোন নম্বর পাঠিয়ে ইনবক্সে মেসেজ দিন!`,
        headlines: [
          `সেরা মূল্যে প্রিমিয়াম ${productTopic}!`,
          `স্টক সীমিত! আজই অর্ডার করুন ক্যাশ অন ডেলিভারিতে`,
          `কোয়ালিটি নিশ্চিত, চেক করে পেমেন্ট করার সুবিধা!`,
        ],
        hashtags: "#অনলাইনশপিং #বেস্টকোয়ালিটি #ক্যাশঅনডেলিভারি #বাংলাদেশ",
      };
    }

    return NextResponse.json({
      success: true,
      data: generatedData,
      adCopy: generatedData.variationA,
    });
  } catch (error: any) {
    console.error("Creative studio generation error:", error);
    return NextResponse.json(
      { error: error.message || "বিজ্ঞাপন কপি জেনারেট করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
