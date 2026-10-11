import prisma from "@/lib/db";
import { decryptSecret } from "@/lib/encryption";
import { bnToEnNumber } from "./policy-extractor";

export interface SynthesizedMemoryResult {
  success: boolean;
  action: "CREATED" | "UPDATED" | "DELETED" | "RESET_ALL" | "NONE";
  entry?: any;
  title: string;
  category: string;
  replyMessage: string;
  allCurrentSettings?: any;
}

/**
 * Autonomous Store Brain Trainer & Setup AI Engine:
 * Full freedom to understand, update, or completely wipe business memory dynamically.
 * Zero hardcoded fallback assumptions.
 */
export async function synthesizeMerchantMemory(
  tenantSlug: string,
  userMessage: string
): Promise<SynthesizedMemoryResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug.toLowerCase() },
    include: {
      aiSetting: true,
      agentMemories: { where: { isActive: true } },
      products: { select: { id: true, name: true, price: true, stock: true } },
    },
  });

  if (!tenant) {
    throw new Error(`Tenant ${tenantSlug} not found`);
  }

  // 1. Fetch Master AI Keys
  const superConfig = await prisma.superAdminConfig.findFirst();
  const geminiKey = decryptSecret(superConfig?.geminiApiKey) || process.env.GEMINI_API_KEY;
  const openaiKey = decryptSecret(superConfig?.openaiApiKey) || process.env.OPENAI_API_KEY;
  const isAiReady = Boolean((geminiKey && geminiKey.trim().length > 10) || (openaiKey && openaiKey.trim().length > 10));

  // Determine current policy state dynamically (No hardcoded values)
  const insideFeeStr =
    tenant.aiSetting?.insideDhakaFee && tenant.aiSetting.insideDhakaFee > 0
      ? `${tenant.aiSetting.insideDhakaFee} টাকা`
      : "সেট করা নেই (ফাঁকা)";

  const outsideFeeStr =
    tenant.aiSetting?.outsideDhakaFee && tenant.aiSetting.outsideDhakaFee > 0
      ? `${tenant.aiSetting.outsideDhakaFee} টাকা`
      : "সেট করা নেই (ফাঁকা)";

  const productsSummary =
    tenant.products.length > 0
      ? tenant.products.map((p) => `${p.name} (মূল্য: ৳${p.price}, স্টক: ${p.stock})`).join(", ")
      : "কোনো পণ্য ক্যাটালগে যুক্ত নেই";

  const existingNotesSummary = tenant.agentMemories.map((m) => ({
    id: m.id,
    category: m.category,
    title: m.title,
    content: m.content, // FULL content - never truncated
  }));

  let synthesizedData: any = null;

  if (isAiReady) {
    const promptText = `আপনি একজন অত্যন্ত বুদ্ধিমান, অমায়িক এবং নির্ভরযোগ্য এআই বিজনেস ব্রেন ট্রেইনার (Autonomous AI Brain Trainer & Shop Assistant)।
আপনার কাজ হলো মার্চেন্টের শেখানো সব নিয়ম মুখস্থ রাখা এবং মার্চেন্ট যখনই জিজ্ঞেস করবেন তখন সেভ করা নিয়মগুলো স্পষ্ট ও বিস্তারিতভাবে তুলে ধরা।

মার্চেন্টের বার্তা:
"${userMessage}"

আপনার মেমোরি ও নোটবুকে সংরক্ষিত সকল নিয়ম ও পলিসি (${tenant.agentMemories.length}টি নোট):
${
  tenant.agentMemories.length > 0
    ? tenant.agentMemories
        .map(
          (m, idx) =>
            `[নোট #${idx + 1}: ${m.title} (${m.category})]\n${m.content}`
        )
        .join("\n\n")
    : "বর্তমানে কোনো নোট বা নিয়ম সংরক্ষিত নেই (মেমোরি সম্পূর্ণ খালি)।"
}

অন্যান্য সাধারণ সেটিংস (যদি মার্চেন্ট সেট করে থাকেন):
- ডেলিভারি চার্জ: ${insideFeeStr}
- বিকাশ নম্বর: ${tenant.aiSetting?.bkashNumber || "সেট করা নেই"}
- রিটার্ন পলিসি: ${tenant.aiSetting?.returnPolicy || "সেট করা নেই"}
- ক্যাটালগে বিদ্যমান পণ্য: ${productsSummary}

আপনার দায়িত্ব ও সিদ্ধান্ত নেওয়ার ক্ষমতা:
১. "STORE_QUERY": মার্চেন্ট জানতে চাইছেন বর্তমানে আপনি ব্যবসা বা শপ সম্পর্কে কী কী জানেন, কী কী সেভ আছে, বা শপের নিয়ম কী (যেমন: "কি কি জানো?", "বলো কি কি সেভ আছে", "আমার শপ সম্পর্কে কী জানো?")।
   -> "action": "NONE"।
   -> "replyMessage": সংরক্ষিত প্রতিটি নোটের বিস্তারিত বিষয়বস্তু (পণ্যের নাম, দামের স্ল্যাব, অফার, ডেলিভারি ফ্রি হওয়ার শর্ত, ফাইলের ফরম্যাট বা অগ্রিম পেমেন্টের নিয়ম ইত্যাদি) পয়েন্ট আকারে পরিষ্কার, সুন্দর ও প্রফেশনাল ভাষায় বুঝিয়ে বলুন।
   -> সতর্কবার্তা: কোনো নোটকে কখনো "অসম্পূর্ণ" বলবেন না; মার্চেন্ট যা শিখিয়েছেন তা-ই আপনার মূল ব্যবসায়িক নীতি।
   -> যদি মার্চেন্ট কাস্টম ব্যবসার নিয়ম শিখিয়ে থাকেন, তবে বারবার অপ্রাসঙ্গিকভাবে "বিকাশ বা রিটার্ন পলিসি সেট নেই" বলে অপ্রয়োজনীয় নেগেটিভ কথা বলবেন না। যা সেভ আছে তা তুলে ধরুন।

২. "RESET_ALL": যদি মার্চেন্ট আগের সব কিছু ভুলে যেতে বলেন, সব মুছে ফেলতে বলেন, রিসেট করতে বলেন বা নতুন করে শুরু করতে বলেন (যেমন: "সব ভুলে যাও", "আগের সব ডিলিট করো", "নতুন ভাবে শেখাবো", "রিসেট করো")।
   -> "action": "RESET_ALL"।
   -> "replyMessage": সুন্দরভাবে জানান যে আপনি আগের সব নিয়ম ও মেমোরি সম্পূর্ণ মুছে দিয়েছেন এবং এখন ফ্রেশ অবস্থায় নতুন নিয়ম শেখার জন্য প্রস্তুত।

৩. "RULE_DELETE": নির্দিষ্ট কোনো নোট বা নিয়ম মুছে ফেলতে বললে।
   -> "action": "DELETE", "existingId": <নোট আইডি>।

৪. "RULE_SAVE" বা "RULE_UPDATE": কোনো নির্দিষ্ট ব্যবসায়িক নিয়ম, পণ্যের বিবরণ, দামের শর্ত, ডেলিভারি চার্জ, ক্যান্সেলেশন বা কাজের পলিসি শেখালে।
   -> "action": "CREATE" বা "UPDATE"।
   -> মার্চেন্টের কথায় ক্ষোভ থাকলে তা বাদ দিয়ে শুধু খাঁটি ব্যবসায়িক নিয়মটি সেভ করুন।
   -> "replyMessage": অত্যন্ত সুনির্দিষ্ট ও স্বাভাবিক মানবসুলভ ভাষায় শুধু বর্তমান শেখানো নিয়মটির স্বীকৃতি দিন (যেমন: "জি বুঝতে পেরেছি! এখন থেকে কোনো কাস্টমার অর্ডার বাতিল করতে চাইলে আমি নিজে তা বাতিল করব না, আপনাকে সরাসরি নোটিফিকেশন পাঠাব এবং চ্যাট টেকওভার করে দেব।")।
   -> 🚨 অতীব গুরুত্বপূর্ণ নিষেধাজ্ঞা: নতুন নিয়ম শেখার পর কখনোই আগের সব রুল বা পুরো নোটবুক লিস্ট একবারে রিডিং পড়ে শোনাবেন না! শুধুমাত্র মার্চেন্ট স্পষ্টভাবে যখন রুল লিস্ট দেখতে চাইবেন ("STORE_QUERY"), তখনই পুরো তালিকা দেখাবেন। সাধারণ সময় শুধুমাত্র যা শেখানো হয়েছে সেটুকুরই সংক্ষিপ্ত অমায়িক স্বীকৃতি দেবেন।

৫. "GREETING" বা "CASUAL_CHAT": সাধারণ শুভেচ্ছা বা কুশল বিনিময়।
   -> "action": "NONE"।

উত্তর দেওয়ার কঠোর ফরম্যাট (শুধুমাত্র ভ্যালিড JSON):
{
  "intent": "STORE_QUERY" | "RESET_ALL" | "RULE_DELETE" | "RULE_SAVE" | "RULE_UPDATE" | "GREETING" | "CASUAL_CHAT",
  "action": "NONE" | "RESET_ALL" | "CREATE" | "UPDATE" | "DELETE",
  "existingId": null,
  "category": "POLICY" | "PRODUCT_INFO" | "PAYMENT" | "DISCOUNT_OFFER" | "STORE_INFO" | "CUSTOM_RULE" | null,
  "title": "সংক্ষিপ্ত সুন্দর শিরোনাম",
  "content": "বিশুদ্ধ ব্যবসায়িক নিয়ম",
  "tags": ["ট্যাগ"],
  "replyMessage": "মার্চেন্টকে দেওয়া আন্তরিক ও বিস্তারিত বাংলা উত্তর",
  "extractedLegacy": {
    "insideDhakaFee": null,
    "outsideDhakaFee": null,
    "bkashNumber": null,
    "returnPolicy": null,
    "greetingStyle": null,
    "businessType": null
  }
}`;

    // Try Gemini
    if (geminiKey && geminiKey.trim().length > 10) {
      const modelCandidates = [
        superConfig?.defaultAiModel,
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3.5-flash",
      ].filter(Boolean) as string[];

      for (const model of modelCandidates) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: promptText }] }],
              generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
            }),
          });

          if (res.ok) {
            const raw = await res.json();
            const text = raw.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              synthesizedData = JSON.parse(text);
              break;
            }
          }
        } catch (geminiErr) {
          console.warn(`[MEMORY SYNTHESIZER] Gemini model ${model} error:`, geminiErr);
        }
      }
    }

    // Try OpenAI fallback
    if (!synthesizedData && openaiKey && openaiKey.trim().length > 10) {
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
            temperature: 0.1,
            response_format: { type: "json_object" },
          }),
        });

        if (res.ok) {
          const raw = await res.json();
          const text = raw.choices?.[0]?.message?.content;
          if (text) {
            synthesizedData = JSON.parse(text);
          }
        }
      } catch (openAiErr) {
        console.warn("[MEMORY SYNTHESIZER] OpenAI error:", openAiErr);
      }
    }
  }

  // 2. Intelligent Offline Fallback
  if (!synthesizedData) {
    const textTrimmed = userMessage.trim();
    const textEn = bnToEnNumber(textTrimmed);

    const isReset =
      /(ভুলে যাও|ডিলিট করো|রিসেট|মুছে ফেল|সব বাদ|নতুনভাবে|সব ভুলে|notun vabe|reset|delete all|clear all|bhule jau)/i.test(
        textTrimmed
      );

    const isGreeting =
      /^(hi|hello|hey|হাই|হ্যালো|সালাম|আসসালামু|assalam|slaam|kemon|valo|valo acho)/i.test(textTrimmed) &&
      textTrimmed.length < 30;

    const isQuery =
      /(কত|কী|কি|কেমন|দেখাও|লিস্ট|কোন কোন|আউটলেট|চার্জ কত|কি জানো|কী জানো|কতোটুক)/i.test(textTrimmed) &&
      !textTrimmed.includes("টাকা");

    if (isReset) {
      synthesizedData = {
        intent: "RESET_ALL",
        action: "RESET_ALL",
        title: "",
        category: null,
        content: "",
        tags: [],
        replyMessage:
          "জি ভাইয়া/আপু! আমি আগের সব নিয়ম, পলিসি ও মেমোরি সম্পূর্ণ মুছে দিয়েছি। বর্তমানে আমি একদম ফ্রেশ অবস্থায় আছি। আপনি আপনার মতো করে নতুন তথ্য ও নিয়ম আমাকে শিখিয়ে দিন!",
        extractedLegacy: {},
      };
    } else if (isGreeting) {
      synthesizedData = {
        intent: "GREETING",
        action: "NONE",
        title: "",
        category: null,
        content: "",
        tags: [],
        replyMessage:
          "হ্যালো! আমি আপনার শপের এআই অ্যাসিস্ট্যান্ট। আপনার শপের কোনো নিয়ম, ডেলিভারি চার্জ বা কাস্টম পলিসি আমাকে বাংলায় বলুন, আমি তা সাজিয়ে মনে রাখব।",
        extractedLegacy: {},
      };
    } else if (isQuery) {
      let queryReply = "";
      if (tenant.agentMemories && tenant.agentMemories.length > 0) {
        const notesList = tenant.agentMemories
          .map((m, idx) => `${idx + 1}. **${m.title}:**\n   ${m.content}`)
          .join("\n\n");
        queryReply = `আপনার শপ সম্পর্কে আমার কাছে নিচের তথ্য ও নিয়মগুলো সংরক্ষিত আছে:\n\n${notesList}`;
      } else {
        queryReply =
          "বর্তমানে আমার কাছে শপের কোনো তথ্য বা নিয়ম সেভ করা নেই। আপনি আপনার মতো করে পণ্য, ডেলিভারি বা ব্যবসার নিয়ম আমাকে শিখিয়ে দিতে পারেন।";
      }

      synthesizedData = {
        intent: "STORE_QUERY",
        action: "NONE",
        title: "",
        category: null,
        content: "",
        tags: [],
        replyMessage: queryReply,
        extractedLegacy: {},
      };
    } else {
      const legacyUpdates: any = {};
      const insideMatch = textEn.match(/ঢাকার\s*(?:ভেতরে?|মধ্যে)?.*?([0-9]+)/i);
      if (insideMatch) legacyUpdates.insideDhakaFee = parseFloat(insideMatch[1]);

      const outsideMatch = textEn.match(/(?:ঢাকার\s*)?(?:বাইরে|বাহিরে).*?([0-9]+)/i);
      if (outsideMatch) legacyUpdates.outsideDhakaFee = parseFloat(outsideMatch[1]);

      const phoneMatch = textEn.match(/01[3-9]\d{8}/);
      if (phoneMatch) legacyUpdates.bkashNumber = phoneMatch[0];

      if (/(?:সালাম|সালাম দিয়ে|assalam|salam)/i.test(textTrimmed)) {
        legacyUpdates.greetingStyle = "সালাম (Assalamu Alaikum)";
      }

      const hasBusinessSignal =
        legacyUpdates.insideDhakaFee ||
        legacyUpdates.outsideDhakaFee ||
        legacyUpdates.bkashNumber ||
        legacyUpdates.greetingStyle ||
        /(রিটার্ন|এক্সচেঞ্জ|ডেলিভারি|কুরিয়ার|শোরুম|অফার|ডিসকাউন্ট|সাইজ)/i.test(textTrimmed);

      if (hasBusinessSignal) {
        const category = legacyUpdates.insideDhakaFee || legacyUpdates.outsideDhakaFee
          ? "POLICY"
          : legacyUpdates.bkashNumber
          ? "PAYMENT"
          : "CUSTOM_RULE";

        let cleanContent = textTrimmed;
        if (cleanContent.includes("সেভ করতে বলি নাই")) {
          if (legacyUpdates.greetingStyle) {
            cleanContent = "কাস্টমারের সাথে কথা শুরু করার সময় সালাম দিয়ে শুরু করতে হবে।";
          }
        }

        synthesizedData = {
          intent: "RULE_SAVE",
          action: "CREATE",
          category,
          title: category === "POLICY" ? "ডেলিভারি চার্জ নিয়ম" : category === "PAYMENT" ? "পেমেন্ট তথ্য" : "কাস্টমার সম্ভাষণ নিয়ম",
          content: cleanContent,
          tags: ["স্টোর_নোট", category.toLowerCase()],
          replyMessage: "ধন্যবাদ! তথ্যটি ফিল্টার করে আমার স্টোর নোটবুকে সেভ করে নিয়েছি। কাস্টমারের সাথে কথা বলার সময় এটি মানা হবে।",
          extractedLegacy: legacyUpdates,
        };
      } else {
        synthesizedData = {
          intent: "CASUAL_CHAT",
          action: "NONE",
          title: "",
          category: null,
          content: "",
          tags: [],
          replyMessage: "আপনার বার্তাটি পেয়েছি। যদি শপের কোনো নির্দিষ্ট নিয়ম, ডেলিভারি বা প্রোডাক্ট পলিসি সেভ করতে চান, তবে অনুগ্রহ করে বিস্তারিত জানান।",
          extractedLegacy: {},
        };
      }
    }
  }

  // 3. Execution of Action (Full Freedom to Wipe or Create)
  let savedEntry: any = null;
  const action = synthesizedData.action || "NONE";

  if (action === "RESET_ALL") {
    // 1. Delete all memory entries for this tenant
    await prisma.agentMemoryEntry.deleteMany({
      where: { tenantId: tenant.id },
    });

    // 2. Clear all dynamic and legacy aiSetting fields
    await prisma.aiSetting.upsert({
      where: { tenantId: tenant.id },
      update: {
        insideDhakaFee: 0,
        outsideDhakaFee: 0,
        bkashNumber: null,
        returnPolicy: null,
        greetingStyle: "ভাইয়া / আপু",
        knowledgeBaseText: null,
      },
      create: {
        tenant: { connect: { id: tenant.id } },
        insideDhakaFee: 0,
        outsideDhakaFee: 0,
        greetingStyle: "ভাইয়া / আপু",
      },
    });
  } else if (action === "UPDATE" && synthesizedData.existingId) {
    savedEntry = await prisma.agentMemoryEntry.update({
      where: { id: synthesizedData.existingId },
      data: {
        title: synthesizedData.title || "আপডেটেড নোট",
        content: synthesizedData.content || userMessage,
        category: synthesizedData.category || "CUSTOM_RULE",
        tags: Array.isArray(synthesizedData.tags) ? synthesizedData.tags : [],
        updatedAt: new Date(),
      },
    });
  } else if (action === "CREATE" && synthesizedData.title && synthesizedData.content) {
    savedEntry = await prisma.agentMemoryEntry.create({
      data: {
        tenantId: tenant.id,
        category: synthesizedData.category || "CUSTOM_RULE",
        title: synthesizedData.title,
        content: synthesizedData.content,
        tags: Array.isArray(synthesizedData.tags) ? synthesizedData.tags : [],
        source: "CHAT_TRAINING",
        isActive: true,
      },
    });
  } else if (action === "DELETE" && synthesizedData.existingId) {
    try {
      await prisma.agentMemoryEntry.delete({
        where: { id: synthesizedData.existingId },
      });
    } catch (e) {
      console.warn("[MEMORY SYNTHESIZER] Delete note error:", e);
    }
  }

  // 4. Backward-compatible Legacy Sync (ONLY on CREATE or UPDATE)
  if ((action === "CREATE" || action === "UPDATE") && synthesizedData.extractedLegacy) {
    const leg = synthesizedData.extractedLegacy;
    const aiSettingData: any = {};
    if (typeof leg.insideDhakaFee === "number" && !isNaN(leg.insideDhakaFee)) {
      aiSettingData.insideDhakaFee = leg.insideDhakaFee;
    }
    if (typeof leg.outsideDhakaFee === "number" && !isNaN(leg.outsideDhakaFee)) {
      aiSettingData.outsideDhakaFee = leg.outsideDhakaFee;
    }
    if (typeof leg.bkashNumber === "string" && leg.bkashNumber.trim()) {
      aiSettingData.bkashNumber = leg.bkashNumber.trim();
    }
    if (typeof leg.returnPolicy === "string" && leg.returnPolicy.trim()) {
      aiSettingData.returnPolicy = leg.returnPolicy.trim();
    }
    if (typeof leg.greetingStyle === "string" && leg.greetingStyle.trim()) {
      aiSettingData.greetingStyle = leg.greetingStyle.trim();
    }

    if (leg.businessType) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { businessType: leg.businessType },
      });
    }

    if (Object.keys(aiSettingData).length > 0) {
      await prisma.aiSetting.upsert({
        where: { tenantId: tenant.id },
        update: aiSettingData,
        create: {
          tenant: { connect: { id: tenant.id } },
          ...aiSettingData,
        },
      });
    }
  }

  const updatedTenant = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    include: { aiSetting: true },
  });

  return {
    success: true,
    action: action === "RESET_ALL"
      ? "RESET_ALL"
      : action === "UPDATE"
      ? "UPDATED"
      : action === "CREATE"
      ? "CREATED"
      : action === "DELETE"
      ? "DELETED"
      : "NONE",
    entry: savedEntry,
    title: synthesizedData.title || "",
    category: synthesizedData.category || "",
    replyMessage: synthesizedData.replyMessage || "তথ্যটি প্রসেস করা হয়েছে।",
    allCurrentSettings: {
      insideDhakaFee: updatedTenant?.aiSetting?.insideDhakaFee || 0,
      outsideDhakaFee: updatedTenant?.aiSetting?.outsideDhakaFee || 0,
      bkashNumber: updatedTenant?.aiSetting?.bkashNumber || null,
      returnPolicy: updatedTenant?.aiSetting?.returnPolicy || null,
      greetingStyle: updatedTenant?.aiSetting?.greetingStyle || null,
      businessType: updatedTenant?.businessType || "ECOMMERCE",
    },
  };
}
