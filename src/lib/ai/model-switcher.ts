import prisma from "@/lib/db";
import { decryptSecret } from "@/lib/encryption";
import { processCustomerMessage, AgentResponse } from "./agent";
import { getBusinessArchetype } from "./business-archetypes";

export interface MasterModelResponse {
  replyText: string;
  modelUsed: string;
  verifiedStock: boolean;
  orderCreated: boolean;
  orderCancelled?: boolean;
  cancelledOrders?: string[];
  orderSummary?: any;
  aiCostBdt: number;
  insufficientBalance?: boolean;
  maintenance?: boolean;
  needsHumanTakeover?: boolean;
  takeoverReason?: string;
  carouselProducts?: any[];
  quickReplies?: Array<{ title: string; payload: string }>;
}

/**
 * Central AI Brain Switcher with Real-Time Pre-Execution Balance Enforcement
 * Reads active model & master API keys from SuperAdminConfig.
 */
export async function dispatchAiResponse(
  tenantId: string,
  userMessage: string,
  customerName: string = "Customer",
  customerPhone?: string,
  conversationId?: string,
  clientHistory?: Array<{ role: "user" | "model"; text: string }>,
  mediaUrl?: string | string[] | null
): Promise<MasterModelResponse> {
  // 1. Real-Time Pre-Execution Wallet Check (Crucial: Protects Platform Owner)
  const wallet = await prisma.wallet.findUnique({
    where: { tenantId },
  });

  if (!wallet || wallet.balanceBdt <= 0) {
    return {
      replyText:
        "দুঃখিত, স্টোরের মেসেজ ব্যালেন্স শেষ হয়ে গেছে। AI অ্যাসিস্ট্যান্ট সাময়িকভাবে স্থগিত। অনুগ্রহ করে ড্যাশবোর্ড থেকে রিচার্জ করুন।",
      modelUsed: "blocked",
      verifiedStock: false,
      orderCreated: false,
      aiCostBdt: 0,
      insufficientBalance: true,
    };
  }

  // 2. Fetch Master SuperAdmin Platform Configuration
  let superConfig = await prisma.superAdminConfig.findFirst();
  if (!superConfig) {
    superConfig = await prisma.superAdminConfig.create({
      data: {
        defaultAiModel: "gemini-3.5-flash-lite",
        perMessageCost: 0.25,
      },
    });
  }

  const rawModel = superConfig.defaultAiModel || "gemini-3.5-flash-lite";
  // Migrate legacy gemini-1.5-flash to the active gemini-3.5-flash-lite
  const model = rawModel === "gemini-1.5-flash" ? "gemini-3.5-flash-lite" : rawModel;
  const geminiKey = decryptSecret(superConfig.geminiApiKey) || process.env.GEMINI_API_KEY;
  const openaiKey = decryptSecret(superConfig.openaiApiKey) || process.env.OPENAI_API_KEY;
  const perMsgCost = superConfig.perMessageCost || 0.25;

  // 3. Fallback to Local Rule Engine if Master API keys are unset
  const isGeminiReady = Boolean(geminiKey && geminiKey.trim().length > 10);
  const isOpenAiReady = Boolean(openaiKey && openaiKey.trim().length > 10);

  if (!isGeminiReady && !isOpenAiReady) {
    // Graceful unconfigured / local intelligent rule fallback
    const localRes = await processCustomerMessage(
      tenantId,
      userMessage,
      customerName,
      customerPhone
    );
    return {
      ...localRes,
      modelUsed: "local-rule-engine",
      maintenance: false,
    };
  }

  // 4. Live External LLM Invocation
  try {
    // Build context-aware prompt with store policy and real active products
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        aiSetting: true,
        products: { where: { isActive: true } },
        agentMemories: { where: { isActive: true }, orderBy: [{ category: "asc" }, { updatedAt: "desc" }] },
      },
    });

    const archetype = getBusinessArchetype(tenant?.businessType);
    const storeName = tenant?.name || "Mogent Store";
    const rawGreetingStyle = tenant?.aiSetting?.greetingStyle || archetype.defaultGreeting || "ভাইয়া / আপু";
    // Sanitize customer honorific: ensure it's a polite address pronoun like "ভাইয়া / আপু" or "স্যার / ম্যাডাম"
    let customerHonorific = "ভাইয়া / আপু";
    if (rawGreetingStyle.includes("স্যার") || rawGreetingStyle.includes("ম্যাডাম")) {
      customerHonorific = "স্যার / ম্যাডাম";
    } else if (rawGreetingStyle.includes("ভাই") || rawGreetingStyle.includes("আপু")) {
      customerHonorific = "ভাইয়া / আপু";
    }

    const insideDhaka = tenant?.aiSetting?.insideDhakaFee ?? 60;
    const outsideDhaka = tenant?.aiSetting?.outsideDhakaFee ?? 120;
    const bkash = tenant?.aiSetting?.bkashNumber || "";
    const returnPolicy = tenant?.aiSetting?.returnPolicy || "ডেলিভারি ম্যানের সামনে চেক করে রিসিভ করতে পারবেন।";
    const enableCatalogCards = tenant?.aiSetting?.enableCatalogCards ?? true;
    const catalogLocationUrl = tenant?.aiSetting?.catalogLocationUrl || "";

    // Load living notebook notes
    let livingNotebookBlock = "";
    if (tenant?.agentMemories && tenant.agentMemories.length > 0) {
      const memoryLines = tenant.agentMemories.map(
        (m) => `📌 [${m.category} - ${m.title}]: ${m.content}`
      );
      livingNotebookBlock = `\n【স্টোর লিভিং নোটবুক (Store Living Brain & Dynamic Rules)】:\n${memoryLines.join("\n")}\n`;
    }

    // Load active conversation scratchpad (working memory) & customer identifiers
    let currentScratchpad: any = {};
    let activeCustomerPhone = customerPhone;
    let activeCustomerName = customerName;

    if (conversationId) {
      try {
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { scratchpad: true, customerPhone: true, customerName: true },
        });
        if (conv?.scratchpad && typeof conv.scratchpad === "object") {
          currentScratchpad = conv.scratchpad;
        }
        if (!activeCustomerPhone && conv?.customerPhone) {
          activeCustomerPhone = conv.customerPhone;
        }
        if (
          (!activeCustomerName ||
            activeCustomerName === "Customer" ||
            activeCustomerName === "Facebook Customer") &&
          conv?.customerName
        ) {
          activeCustomerName = conv.customerName;
        }
      } catch (scErr) {
        console.warn("[AI SWITCHER] Error loading conversation info:", scErr);
      }
    }

    // Load live customer orders from DB for 100% accurate order status
    let liveOrdersBlock = "";
    try {
      const orderFilters: any[] = [];
      if (activeCustomerPhone && activeCustomerPhone.length >= 7) {
        orderFilters.push({ customerPhone: { contains: activeCustomerPhone.slice(-10) } });
      }
      if (
        activeCustomerName &&
        activeCustomerName !== "Customer" &&
        activeCustomerName !== "Facebook Customer"
      ) {
        orderFilters.push({ customerName: { equals: activeCustomerName, mode: "insensitive" } });
      }

      // Check if userMessage mentions any order number like ORD-XXXXXX
      const orderNumMatch = userMessage.match(/ORD[-_]?\d+[-_]?\d*/i);
      if (orderNumMatch) {
        orderFilters.push({
          orderNumber: { contains: orderNumMatch[0].replace(/[^0-9A-Za-z]/g, "") },
        });
      }

      if (orderFilters.length > 0) {
        const matchingOrders = await prisma.order.findMany({
          where: {
            tenantId,
            OR: orderFilters,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { items: true },
        });

        if (matchingOrders.length > 0) {
          const orderLines = matchingOrders.map((o) => {
            const itemsSummary =
              o.items
                .map((it) => `${it.productName} (${it.quantity}টি)`)
                .join(", ") || "অর্ডারকৃত পণ্য";
            const dateStr = o.createdAt.toLocaleDateString("en-GB");
            return `- অর্ডার আইডি: #${o.orderNumber} | স্ট্যাটাস: ${o.status} | মোট মূল্য: ৳${o.totalAmount} | আইটেম: ${itemsSummary} | তারিখ: ${dateStr}`;
          });
          liveOrdersBlock = `\n【কাস্টমারের বিদ্যমান ডেটাবেস অর্ডার রেকর্ড (Database Live Order Records - আসল সত্য)】:\n${orderLines.join("\n")}\n`;
        }
      }
    } catch (ordErr) {
      console.warn("[AI SWITCHER] Error loading live orders:", ordErr);
    }

    const hasProducts = tenant?.products && tenant.products.length > 0;
    const minPrice = hasProducts
      ? Math.min(...tenant!.products.map((p) => p.price))
      : 0;
    const productListStr = hasProducts
      ? tenant!.products
          .map((p) => `- [ID: ${p.id}] ${p.name} (মূল্য: ৳${p.price}${p.stock !== undefined ? `, স্টক: ${p.stock}টি` : ""}${p.category ? `, ক্যাটাগরি: ${p.category}` : ""})`)
          .join("\n")
      : `【ক্যাটালগ নোটিস】: স্টোরের পণ্য তালিকা বর্তমানে আপডেট হচ্ছে বা এটি একটি সেবা-ভিত্তিক ব্যবসা।
- স্টোরে যদি কোনো পণ্য যোগ করা না থাকে বা কাস্টমারের বাজেটের চেয়ে কম মূল্যের পণ্য না থাকে, তবে বিনীতভাবে বলুন: "দুঃখিত ${customerHonorific}, বর্তমানে আমাদের নির্দিষ্ট ক্যাটালগটি আপডেট হচ্ছে। বিস্তারিত জানতে আমাদের প্রতিনিধি আপনাকে মেসেজ দিচ্ছেন।"
- কাস্টমার যদি এমন কোনো নির্দিষ্ট পণ্য চায় যা তালিকায় নেই:
  - উত্তরের শুরুতে লিখবেন: [TAKEOVER: কাস্টমার পণ্য দেখতে চেয়েছেন যা স্টোরে নেই]`;

    const knowledgeBaseBlock = tenant?.aiSetting?.knowledgeBaseText?.trim()
      ? `\n【স্টোরের বিশেষ তথ্য ও রুলবুক】:\n${tenant.aiSetting.knowledgeBaseText.trim()}\n`
      : "";

    const systemInstruction = `আপনি '${storeName}' প্রতিষ্ঠানের একজন অত্যন্ত বাস্তববাদী, বুদ্ধিমান ও চটপটে মানব সেলস প্রতিনিধি।
ব্যবসার ধরন: ${archetype.nameBn}

【কঠোর আচরণবিধি ও পরিচালনা নিয়ম (Strict Rules - Zero Assumptions)】:

১. কাস্টমারের পরিস্থিতি ও সহযোগিতামূলক সেলস (Context & Helpful Sales Advice):
   - কাস্টমার যতটুকু জানতে চেয়েছেন, কেবল সেটুকুরই সরাসরি উত্তর দিন।
   - কাস্টমার কোনো সিদ্ধান্ত বা বিকল্প বাছাইয়ে দ্বিধাবোধ করলে রোবটের মতো কঠোর নিয়ম না শুনিয়ে, অমায়িক ভাষায় বাস্তব ব্যবহারের সুবিধার একটি আইডিয়া দিন। তবে কোনো জোরাজুরি করবেন না।
   - কাস্টমার নিজে থেকে অর্ডার চূড়ান্ত করতে সম্মত না হওয়া পর্যন্ত আগ বাড়িয়ে অর্ডার কনফার্মেশনের কোনো তথ্য, রিকোয়ারমেন্ট বা ডেলিভারি ডিটেইলস চাইতে যাবেন না।

২. জেন্ডার নিরপেক্ষতা ও সঠিক সম্বোধন:
   - কাস্টমারের জেন্ডার নিশ্চিত না হয়ে নিজে থেকে কখনো 'আপু' বা 'ভাইয়া' বা নির্দিষ্ট কোনো জেন্ডার সম্বোধন ধরে নেবেন না।
   - নিরপেক্ষ ও সম্মানজনক সম্বোধন বজায় রাখুন (যেমন: "জি", "আপনার জন্য..." ইত্যাদি)। কাস্টমার যেভাবে কথা বলবেন সেভাবেই শালীনভাবে সাড়া দিন।
   - অপ্রয়োজনে প্রতি বাক্যে কোনো সম্বোধন টেনে আনবেন না।

৩. ক্যাটালগ ও মার্চেন্ট মেমোরির কঠোর সত্যতা (Strict Zero Hallucination):
   - নিচে দেওয়া স্টোর ক্যাটালগ ও নোটবুকে যা উল্লেখ আছে, কেবল তা দেখেই তথ্য দিন।
   - স্টোরে নেই এমন কোনো কাল্পনিক পণ্য, সেবা, সাইজ বা অফারের কথা বলবেন না। যা নেই তা সরাসরি জানিয়ে দিন।
   - স্টোরে নির্দিষ্ট কোয়ান্টিটিতে অফার থাকলে (যেমন: একাধিক নিলে ছাড় বা ফ্রি ডেলিভারি) কাস্টমারের সংখ্যা অনুযায়ী নিখুঁত মোট হিসাব দিন।

৪. মেসেজ বাবল ও লাইন সীমা (Maximum 2 Lines Per Bubble):
   - প্রতিটি মেসেজ বাবল সর্বোচ্চ ২ লাইনে শেষ হতে হবে।
   - পুরো রেসপন্সে সর্বোচ্চ ১ থেকে ২টি মেসেজ বাবল হতে পারবে (২য় বাবলের জন্য [SPLIT] ব্যবহার করুন)। ৩য় বাবল তৈরি করা সম্পূর্ণ নিষিদ্ধ।
   - অযথা ভূমিকা, উপসংহার, কৃতজ্ঞতা বা দীর্ঘ তালিকা দেওয়া যাবে না।

৫. সার্বজনীন অর্ডার ও শর্ত চেকলিস্ট নীতি (Generic Order Checklist Rule):
   - যেকোনো অর্ডারের তথ্য ও শর্ত কথোপকথন জুড়ে ধাপে ধাপে সম্পন্ন হতে পারে:
     ১. পণ্যের নির্দিষ্ট বৈশিষ্ট্য বা স্টোরের পূর্বশর্ত (যেমন: সাইজ, স্পেসিফিকেশন বা রুলবুকের শর্ত)।
     ২. কাস্টমারের যোগাযোগের তথ্য (নাম, সচল মোবাইল নম্বর ও সম্পূর্ণ ডেলিভারি ঠিকানা)।
   - কঠোর নিয়ম: কথোপকথনের পূর্বের কোনো মেসেজে একবার কোনো শর্ত, ফাইল বা তথ্য পাওয়া ও যাচাই হয়ে গেলে, পরবর্তী মেসেজে তা পুনরায় চাওয়া সম্পূর্ণ নিষিদ্ধ।
   - পূর্বের মেসেজে প্রাপ্ত শর্ত এবং বর্তমান মেসেজে প্রাপ্ত ডেলিভারি তথ্য মিলিয়ে সমস্ত প্রয়োজনীয় তথ্য পাওয়া মাত্রই সরাসরি অর্ডার কনফার্ম করে ট্যাগ দিন:
     [ORDER_CREATE: {"customerName": "...", "customerPhone": "...", "deliveryAddress": "...", "productName": "...", "quantity": 1, "unitPrice": 0, "deliveryCharge": 0, "totalAmount": 0, "remarks": "..."}]
   - অর্ডার বাতিলের অনুরোধ আসলে নিজে বাতিল না করে প্রতিনিধি যুক্ত হওয়ার বার্তা দিয়ে ট্যাগ দিন:
     [TAKEOVER: কাস্টমার অর্ডার বাতিল করতে চেয়েছেন]

৬. ইন্টারঅ্যাকটিভ ক্যাটালগ কার্ড ও বাটন:
   - ক্যাটালগ কার্ড সিস্টেম স্ট্যাটাস: ${enableCatalogCards ? "সক্রিয় (ENABLED)" : "নিষ্ক্রিয় (DISABLED)"}
   - কাস্টমার পণ্য দেখতে চাইলে বা ছবি চাইলে ক্যাটালগের আইডি দিয়ে ট্যাগ দিন:
     [SHOW_CAROUSEL: <পণ্য_আইডি_১>, <পণ্য_আইডি_২>]
   - নির্দিষ্ট চয়েস দেওয়ার ক্ষেত্রে কুইক রিপ্লাই বাটন ব্যবহার করুন:
     [QUICK_REPLIES: অপশন ১, অপশন ২]

【স্টোর ক্যাটালগ (Store Catalog)】:
${productListStr}

【স্টোর রুলবুক ও মার্চেন্ট মেমোরি (Store Rules & Merchant Memory)】:
${livingNotebookBlock}
${knowledgeBaseBlock}
${liveOrdersBlock}`;

    // Load recent conversation history for conversational memory
    let conversationHistory: Array<{ role: "user" | "model"; text: string }> = [];

    if (clientHistory && Array.isArray(clientHistory) && clientHistory.length > 0) {
      conversationHistory = clientHistory
        .filter((h) => h.text && h.text.trim().length > 0)
        .slice(-8);
    } else if (conversationId) {
      try {
        const pastMessages = await prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: "desc" },
          take: 20,
        });

        const chronological = pastMessages.reverse();
        // Determine recent incoming customer contents to prevent duplicating the active turn
        const normalizedUserMsg = userMessage.trim();
        const splitLines = normalizedUserMsg.split("\n").map(l => l.trim()).filter(Boolean);

        // Find recent trailing CUSTOMER messages that are part of this current burst
        let cutIndex = chronological.length;
        while (cutIndex > 0) {
          const lastMsg = chronological[cutIndex - 1];
          if (lastMsg.senderType === "CUSTOMER") {
            const content = lastMsg.content.trim();
            if (
              content === normalizedUserMsg ||
              splitLines.includes(content) ||
              normalizedUserMsg.includes(content)
            ) {
              cutIndex--;
              continue;
            }
          }
          break;
        }

        const filtered = chronological.slice(0, cutIndex);

        for (const m of filtered) {
          conversationHistory.push({
            role: m.senderType === "CUSTOMER" ? "user" : "model",
            text: m.content,
          });
        }
      } catch (histErr) {
        console.warn("[AI SWITCHER] Error loading conversation history:", histErr);
      }
    }

    // 4. Retrieve effective image URLs (support single string or array of strings)
    const effectiveMediaUrls: string[] = Array.isArray(mediaUrl)
      ? mediaUrl.filter(Boolean)
      : mediaUrl ? [mediaUrl] : [];

    const mediaParts: Array<{ inline_data: { mime_type: string; data: string } }> = [];
    for (const imgUrl of effectiveMediaUrls.slice(0, 3)) {
      try {
        if (imgUrl.startsWith("data:")) {
          const commaIdx = imgUrl.indexOf(",");
          const mimeMatch = imgUrl.match(/^data:([^;]+);/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
          const base64Data = imgUrl.slice(commaIdx + 1);
          if (base64Data) {
            mediaParts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            });
          }
        } else {
          const mediaRes = await fetch(imgUrl, { signal: AbortSignal.timeout(12000) });
          if (mediaRes.ok) {
            let contentType = mediaRes.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
            if (contentType.startsWith("image/")) {
              const buf = Buffer.from(await mediaRes.arrayBuffer());
              mediaParts.push({
                inline_data: {
                  mime_type: contentType,
                  data: buf.toString("base64"),
                },
              });
            }
          }
        }
      } catch (mediaErr) {
        console.warn("[AI SWITCHER] Error loading media for multimodal analysis:", mediaErr);
      }
    }

    if (model.includes("gemini") && isGeminiReady) {
      const targetModel = model.includes("gemini") ? model : "gemini-3.5-flash-lite";

      const userParts: any[] = [];
      if (mediaParts.length > 0) {
        userParts.push(...mediaParts);
      }
      userParts.push({ text: userMessage });

      // Build sanitized contents payload with strict role alternation for Gemini API
      const contentsPayload = [
        ...conversationHistory.map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        })),
        {
          role: "user" as const,
          parts: userParts,
        },
      ];

      const cleanContents: Array<{ role: "user" | "model"; parts: Array<any> }> = [];
      for (const item of contentsPayload) {
        if (!item.parts || item.parts.length === 0) continue;
        if (cleanContents.length > 0 && cleanContents[cleanContents.length - 1].role === item.role) {
          cleanContents[cleanContents.length - 1].parts.push(...item.parts);
        } else {
          cleanContents.push(item);
        }
      }

      while (cleanContents.length > 0 && cleanContents[0].role !== "user") {
        cleanContents.shift();
      }

      if (cleanContents.length === 0) {
        cleanContents.push({ role: "user", parts: userParts });
      }

      // Call Google Gemini with multi-model fallback rotation (500 req/day quota models)
      const modelCandidates = Array.from(
        new Set([
          "gemini-3.5-flash-lite",
          "gemini-3.1-flash-lite",
          "gemini-flash-lite-latest",
        ].filter(Boolean))
      );

      let response: Response | null = null;
      let usedModel = "gemini-3.5-flash-lite";

      for (const cand of modelCandidates) {
        try {
          const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cand}:generateContent?key=${geminiKey}`;
          const res = await fetch(geminiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(25000),
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemInstruction }],
              },
              contents: cleanContents,
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4000,
                thinkingConfig: {
                  thinkingBudget: 2048,
                },
              },
            }),
          });

          if (res.ok) {
            response = res;
            usedModel = cand;
            break;
          } else {
            console.warn(`[AI SWITCHER] Gemini model ${cand} returned status ${res.status}`);
          }
        } catch (candErr) {
          console.warn(`[AI SWITCHER] Error calling Gemini model ${cand}:`, candErr);
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        const candidateParts = data.candidates?.[0]?.content?.parts || [];
        let extractedText = "";
        for (const part of candidateParts) {
          if (!part.thought && typeof part.text === "string" && part.text.trim()) {
            extractedText += (extractedText ? "\n" : "") + part.text.trim();
          }
        }
        if (!extractedText && candidateParts.length > 0) {
          extractedText = (candidateParts[candidateParts.length - 1]?.text || "").trim();
        }
        const rawReply = extractedText || "";

        if (rawReply) {
          const scratchpadProcessed = await handleScratchpadIfTriggered(
            rawReply,
            conversationId,
            currentScratchpad
          );

        const orderProcessed = await handleOrderCreationIfTriggered(
          scratchpadProcessed.cleanedReply,
          tenantId,
          customerName,
          customerPhone,
          conversationId
        );

        const cancelProcessed = await handleOrderCancellationIfTriggered(
          orderProcessed.finalReply,
          tenantId,
          customerName,
          customerPhone,
          conversationId
        );

        const takeoverProcessed = await handleTakeoverIfTriggered(
          cancelProcessed.finalReply,
          tenantId,
          customerName,
          customerHonorific,
          conversationId
        );

        // Deduct cost from wallet
        await deductAiCost(wallet.id, tenantId, perMsgCost, "Gemini Flash");

        const interactiveProcessed = handleInteractiveDirectives(
          takeoverProcessed.finalReply,
          tenant?.products || []
        );

        const clampedReply = clampSplitBubbles(interactiveProcessed.cleanedText, 2);

        return {
          replyText: clampedReply,
          modelUsed: usedModel,
          verifiedStock: false,
          orderCreated: orderProcessed.orderCreated,
          orderCancelled: cancelProcessed.orderCancelled,
          cancelledOrders: cancelProcessed.cancelledOrders,
          aiCostBdt: perMsgCost,
          needsHumanTakeover: takeoverProcessed.isTakeover,
          takeoverReason: takeoverProcessed.takeoverReason || undefined,
          carouselProducts: interactiveProcessed.carouselProducts,
          quickReplies: interactiveProcessed.quickReplies,
        };
      } else {
        console.error(`[AI SWITCHER] All Gemini models failed or returned non-200`);
      }
    } else if (model.includes("gpt") && isOpenAiReady) {
      // Call OpenAI GPT-4o-mini
      const gptUserContent =
        effectiveMediaUrls.length > 0
          ? [
              { type: "text", text: userMessage },
              ...effectiveMediaUrls.slice(0, 3).map((url) => ({
                type: "image_url",
                image_url: { url },
              })),
            ]
          : userMessage;

      const gptMessages = [
        { role: "system", content: systemInstruction },
        ...conversationHistory.map((h) => ({
          role: h.role === "user" ? "user" : "assistant",
          content: h.text,
        })),
        { role: "user", content: gptUserContent },
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: gptMessages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const gptReply =
          data.choices?.[0]?.message?.content ||
          "জি, আমি আপনাকে সাহায্য করছি। আপনি কী জানতে চান অনুগ্রহ করে বলুন।";

        const scratchpadProcessed = await handleScratchpadIfTriggered(
          gptReply,
          conversationId,
          currentScratchpad
        );

        const orderProcessed = await handleOrderCreationIfTriggered(
          scratchpadProcessed.cleanedReply,
          tenantId,
          customerName,
          customerPhone,
          conversationId
        );

        const cancelProcessed = await handleOrderCancellationIfTriggered(
          orderProcessed.finalReply,
          tenantId,
          customerName,
          customerPhone,
          conversationId
        );

        const takeoverProcessed = await handleTakeoverIfTriggered(
          cancelProcessed.finalReply,
          tenantId,
          customerName,
          customerHonorific,
          conversationId
        );

        await deductAiCost(wallet.id, tenantId, perMsgCost, "GPT-4o Mini");

        const interactiveProcessed = handleInteractiveDirectives(
          takeoverProcessed.finalReply,
          tenant?.products || []
        );

        const clampedReply = clampSplitBubbles(interactiveProcessed.cleanedText, 2);

        return {
          replyText: clampedReply,
          modelUsed: "gpt-4o-mini",
          verifiedStock: false,
          orderCreated: orderProcessed.orderCreated,
          orderCancelled: cancelProcessed.orderCancelled,
          cancelledOrders: cancelProcessed.cancelledOrders,
          aiCostBdt: perMsgCost,
          needsHumanTakeover: takeoverProcessed.isTakeover,
          takeoverReason: takeoverProcessed.takeoverReason || undefined,
          carouselProducts: interactiveProcessed.carouselProducts,
          quickReplies: interactiveProcessed.quickReplies,
        };
        }
      }
    }
  } catch (error) {
    console.error("Master LLM Call Error, falling back to local agent:", error);
  }

  // Fallback to local intelligent agent if external call encounters issues
  const fallbackRes = await processCustomerMessage(
    tenantId,
    userMessage,
    customerName,
    customerPhone
  );

  return {
    ...fallbackRes,
    modelUsed: "local-fallback",
  };
}

function handleInteractiveDirectives(text: string, tenantProducts: any[] = []): {
  cleanedText: string;
  carouselProducts: any[];
  quickReplies: Array<{ title: string; payload: string }>;
} {
  let cleaned = text || "";
  let carouselProducts: any[] = [];
  let quickReplies: Array<{ title: string; payload: string }> = [];

  // Match [SHOW_CAROUSEL: id1, id2, ...]
  const carouselMatch = cleaned.match(/\[SHOW_CAROUSEL:\s*([^\]]+)\]/i);
  if (carouselMatch) {
    const rawIds = carouselMatch[1]
      .split(/[,|]/)
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);

    for (const rawId of rawIds) {
      const found = tenantProducts.find(
        (p) =>
          p.id === rawId ||
          p.id.toLowerCase().includes(rawId.toLowerCase()) ||
          p.name.toLowerCase().includes(rawId.toLowerCase())
      );
      if (found && !carouselProducts.some((cp) => cp.id === found.id)) {
        carouselProducts.push(found);
      }
    }
    // Limit to 10 products
    carouselProducts = carouselProducts.slice(0, 10);
    cleaned = cleaned.replace(carouselMatch[0], "").trim();
  }

  // Match [QUICK_REPLIES: M, L, XL] or [QUICK_REPLIES: নিশ্চিত করুন, বাতিল করুন]
  const qrMatch = cleaned.match(/\[QUICK_REPLIES:\s*([^\]]+)\]/i);
  if (qrMatch) {
    const rawOptions = qrMatch[1]
      .split(/[,|]/)
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);

    quickReplies = rawOptions.slice(0, 13).map((opt) => ({
      title: opt.slice(0, 20),
      payload: `SELECT_${opt.toUpperCase().replace(/\s+/g, "_")}`,
    }));

    cleaned = cleaned.replace(qrMatch[0], "").trim();
  }

  return { cleanedText: cleaned, carouselProducts, quickReplies };
}

function clampSplitBubbles(text: string, maxBubbles: number = 2): string {
  if (!text) return "";

  const sanitizeBubbleLines = (bubble: string): string => {
    const lines = bubble
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length <= 2) {
      return lines.join("\n");
    }
    // If more than 2 lines, join them concisely into maximum 2 sentences/lines
    const first = lines[0];
    const remaining = lines.slice(1).join(" ");
    return `${first}\n${remaining}`.trim();
  };

  // 1. If explicit [SPLIT] tags are present, respect them (up to maxBubbles, default 2)
  if (/\[SPLIT\]/i.test(text)) {
    const parts = text
      .split(/\[SPLIT\]/i)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const keptParts = parts.slice(0, maxBubbles).map(sanitizeBubbleLines);
    return keptParts.join(" [SPLIT] ");
  }

  // Default is strictly 1 single bubble, sanitized to maximum 2 lines
  return sanitizeBubbleLines(text.trim());
}

async function deductAiCost(
  walletId: string,
  tenantId: string,
  cost: number,
  modelName: string
) {
  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.wallet.findUnique({ where: { id: walletId } });
      if (!current) return;

      const newBal = Math.max(0, current.balanceBdt - cost);

      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balanceBdt: {
            decrement: Math.min(current.balanceBdt, cost),
          },
        },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId,
          tenantId,
          amount: -cost,
          type: "AI_USAGE",
          description: `AI Message Reply (${modelName})`,
          balanceAfter: newBal,
        },
      });
    });
  } catch (err) {
    console.error("Ledger deduction error:", err);
  }
}

async function handleScratchpadIfTriggered(
  reply: string,
  conversationId?: string,
  initialScratchpad: any = {}
): Promise<{ cleanedReply: string; updatedScratchpad: any }> {
  const scratchpadMatch = reply.match(/\[SCRATCHPAD:\s*(\{[\s\S]*?\})\]/i);
  if (!scratchpadMatch) {
    return { cleanedReply: reply, updatedScratchpad: initialScratchpad };
  }

  const cleanedReply = reply.replace(/\[SCRATCHPAD:\s*\{[\s\S]*?\}\]/gi, "").trim();

  try {
    const parsedNew = JSON.parse(scratchpadMatch[1]);
    const merged = { ...initialScratchpad, ...parsedNew };

    if (conversationId) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { scratchpad: merged },
      });
      console.log(`[AGENT SCRATCHPAD UPDATED] Conversation ${conversationId}:`, merged);
    }
    return { cleanedReply, updatedScratchpad: merged };
  } catch (err) {
    console.warn("[SCRATCHPAD PARSE ERROR]", err);
    return { cleanedReply, updatedScratchpad: initialScratchpad };
  }
}

async function handleTakeoverIfTriggered(
  reply: string,
  tenantId: string,
  customerName: string,
  greetingStyle: string,
  conversationId?: string
): Promise<{ finalReply: string; isTakeover: boolean; takeoverReason: string | null }> {
  const takeoverMatch = reply.match(/\[TAKEOVER:\s*([^\]]+)\]/i);
  if (!takeoverMatch) {
    return { finalReply: reply, isTakeover: false, takeoverReason: null };
  }

  const takeoverReason = takeoverMatch[1].trim();
  let cleanedReply = reply.replace(/\[TAKEOVER:\s*[^\]]+\]/gi, "").trim();
  if (!cleanedReply) {
    cleanedReply = `দুঃখিত ${greetingStyle}, এই বিষয়টি নিশ্চিত করার জন্য আমি আমাদের একজন প্রতিনিধির সাথে আপনাকে যুক্ত করে দিচ্ছি। একটু অপেক্ষা করুন, আমাদের প্রতিনিধি খুব শীঘ্রই উত্তর দিচ্ছেন।`;
  }

  if (conversationId) {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          aiHandled: false,
          status: "NEEDS_ATTENTION",
          takeoverReason: takeoverReason || "কাস্টমারের প্রশ্নের তথ্য ক্যাটালগে পাওয়া যায়নি",
        },
      });

      await prisma.notification.create({
        data: {
          tenantId,
          title: `⚠️ হিউম্যান সহায়তা প্রয়োজন (${customerName})`,
          message: `${takeoverReason}। অনুগ্রহ করে ইনবক্স চ্যাটে গিয়ে সঠিক তথ্যটি দিন।`,
          type: "HUMAN_TAKEOVER",
        },
      });
      console.log(`[HUMAN TAKEOVER TRIGGERED] Conversation ${conversationId}: ${takeoverReason}`);
    } catch (err) {
      console.warn("[TAKEOVER DB ERROR]", err);
    }
  }

  return { finalReply: cleanedReply, isTakeover: true, takeoverReason };
}


async function handleOrderCreationIfTriggered(
  reply: string,
  tenantId: string,
  customerName: string,
  customerPhone?: string,
  conversationId?: string
): Promise<{ finalReply: string; orderCreated: boolean; orderNumber?: string }> {
  const orderMatch = reply.match(/\[ORDER_CREATE:\s*(\{[\s\S]*?\})\]/i);
  if (!orderMatch) {
    return { finalReply: reply, orderCreated: false };
  }

  // Always clean out the ORDER_CREATE tag completely so raw internal tags are never leaked to the customer
  const cleanedReply = reply.replace(/\[ORDER_CREATE:\s*\{[\s\S]*?\}\]/gi, "").trim();

  try {
    let jsonString = orderMatch[1].trim();
    // Repair single-quoted keys or values if AI generated pseudo-JSON
    if (jsonString.includes("'") && !jsonString.includes('"')) {
      jsonString = jsonString.replace(/'/g, '"');
    }
    const rawData = JSON.parse(jsonString);
    const finalCustomerName = rawData.customerName || customerName || "Customer";
    const finalCustomerPhone = rawData.customerPhone || customerPhone || "01700000000";
    const finalAddress = rawData.deliveryAddress || "N/A";
    const productName = rawData.productName || "অর্ডারকৃত পণ্য";
    const quantity = Number(rawData.quantity) || 1;
    const unitPrice = Number(rawData.unitPrice) || 0;
    const deliveryCharge = Number(rawData.deliveryCharge) || 0;
    const subtotal = Number(rawData.subtotal || (quantity * unitPrice) || rawData.totalAmount || 0);
    const totalAmount = Number(rawData.totalAmount || (subtotal + deliveryCharge) || 0);
    const remarks = rawData.remarks || "অর্ডার স্বয়ংক্রিয়ভাবে AI দ্বারা কনফার্ম করা হয়েছে।";

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Inventory Stock Check & Linked Product Lookup
    let matchedProduct = null;
    if (rawData.productId) {
      matchedProduct = await prisma.product.findFirst({
        where: { id: String(rawData.productId), tenantId },
      });
    }
    if (!matchedProduct && productName) {
      matchedProduct = await prisma.product.findFirst({
        where: {
          tenantId,
          name: { equals: productName, mode: "insensitive" },
        },
      });
    }

    const newOrder = await prisma.$transaction(async (tx) => {
      // If product exists in catalog, atomically decrement stock
      if (matchedProduct) {
        await tx.product.update({
          where: { id: matchedProduct.id },
          data: {
            stock: {
              decrement: Math.min(Math.max(0, matchedProduct.stock), quantity),
            },
          },
        });
      }

      return await tx.order.create({
        data: {
          tenantId,
          orderNumber,
          customerName: finalCustomerName,
          customerPhone: finalCustomerPhone,
          deliveryAddress: finalAddress,
          subtotal,
          deliveryCharge,
          totalAmount,
          status: "PENDING",
          channel: "FACEBOOK",
          remarks,
          items: {
            create: [
              {
                productId: matchedProduct?.id || null,
                productName,
                quantity,
                unitPrice: unitPrice > 0 ? unitPrice : subtotal,
                totalPrice: subtotal,
              },
            ],
          },
        },
      });
    });

    console.log(`[AI ORDER CREATED] Order ${newOrder.orderNumber} created for ${finalCustomerName} (৳${totalAmount})`);

    if (conversationId) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          ...(finalCustomerName && finalCustomerName !== "Facebook Customer" && finalCustomerName !== "Customer"
            ? { customerName: finalCustomerName }
            : {}),
          ...(finalCustomerPhone && finalCustomerPhone.length >= 11
            ? { customerPhone: finalCustomerPhone }
            : {}),
        },
      }).catch((e) => console.warn("[AI ORDER] Error updating conversation:", e));
    }

    await prisma.notification.create({
      data: {
        tenantId,
        title: `🛒 নতুন অর্ডার প্রাপ্ত হয়েছে (#${orderNumber})`,
        message: `${finalCustomerName} (${finalCustomerPhone}) মোট ৳${totalAmount}-এর অর্ডার করেছেন।`,
        type: "NEW_ORDER",
      },
    }).catch((e) => console.warn("[AI ORDER] Error creating notification:", e));

    let replyWithOrderId = cleanedReply;
    if (!cleanedReply.includes(orderNumber)) {
      replyWithOrderId = `${cleanedReply}\n\nআপনার অর্ডার আইডি: #${orderNumber}। যেকোনো সময় এই আইডি দিয়ে আপনি আপনার অর্ডারের স্ট্যাটাস জানতে পারবেন।`;
    }

    return {
      finalReply: replyWithOrderId,
      orderCreated: true,
      orderNumber,
    };
  } catch (err) {
    console.warn("[AI ORDER PARSE ERROR]", err);
    return { finalReply: cleanedReply, orderCreated: false };
  }
}

async function handleOrderCancellationIfTriggered(
  reply: string,
  tenantId: string,
  customerName: string,
  customerPhone?: string,
  conversationId?: string
): Promise<{ finalReply: string; orderCancelled: boolean; cancelledOrders?: string[] }> {
  const cancelMatch = reply.match(/\[ORDER_CANCEL:\s*(\{[\s\S]*?\})\]/i);
  if (!cancelMatch) {
    return { finalReply: reply, orderCancelled: false };
  }

  const cleanedReply = reply.replace(/\[ORDER_CANCEL:\s*\{[\s\S]*?\}\]/gi, "").trim();

  try {
    const rawData = JSON.parse(cancelMatch[1]);
    const targetOrderNumber = rawData.orderNumber
      ? String(rawData.orderNumber).replace(/#/g, "").trim()
      : null;
    const cancelAll = Boolean(rawData.cancelAll);
    const reason = rawData.reason || "কাস্টমারের অনুরোধে অর্ডার বাতিল করা হয়েছে।";

    const cancelConditions: any[] = [];
    if (targetOrderNumber) {
      cancelConditions.push({ orderNumber: { contains: targetOrderNumber } });
    } else {
      if (customerPhone && customerPhone.length >= 7) {
        cancelConditions.push({ customerPhone: { contains: customerPhone.slice(-10) } });
      }
      if (
        customerName &&
        customerName !== "Customer" &&
        customerName !== "Facebook Customer"
      ) {
        cancelConditions.push({ customerName: { equals: customerName, mode: "insensitive" } });
      }
    }

    if (cancelConditions.length === 0 && conversationId) {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { customerPhone: true, customerName: true },
      });
      if (conv?.customerPhone) {
        cancelConditions.push({ customerPhone: { contains: conv.customerPhone.slice(-10) } });
      }
      if (
        conv?.customerName &&
        conv.customerName !== "Customer" &&
        conv.customerName !== "Facebook Customer"
      ) {
        cancelConditions.push({ customerName: { equals: conv.customerName, mode: "insensitive" } });
      }
    }

    if (cancelConditions.length > 0) {
      const ordersToCancel = await prisma.order.findMany({
        where: {
          tenantId,
          status: { in: ["PENDING", "PROCESSING"] },
          OR: cancelConditions,
        },
        take: cancelAll ? 10 : 1,
        orderBy: { createdAt: "desc" },
      });

      if (ordersToCancel.length > 0) {
        const orderIds = ordersToCancel.map((o) => o.id);
        const orderNumbers = ordersToCancel.map((o) => o.orderNumber);

        await prisma.order.updateMany({
          where: { id: { in: orderIds } },
          data: {
            status: "CANCELLED",
            remarks: reason,
          },
        });

        // Record Activity Log
        await prisma.activityLog.create({
          data: {
            tenantId,
            action: "ORDER_CANCELLED_BY_AI",
            details: `অর্ডার (${orderNumbers.join(", ")}) কাস্টমারের অনুরোধে বাতিল করা হয়েছে। কারণ: ${reason}`,
          },
        }).catch(() => {});

        // Record In-App Notification for Merchant
        await prisma.notification.create({
          data: {
            tenantId,
            title: `🚫 অর্ডার বাতিল করা হয়েছে (${orderNumbers.map((n) => `#${n}`).join(", ")})`,
            message: `কাস্টমার ${customerName} (${customerPhone || "N/A"}) এর অনুরোধে অর্ডার বাতিল করা হয়েছে।`,
            type: "ORDER",
          },
        }).catch(() => {});

        console.log(`[AI ORDER CANCELLED] Orders ${orderNumbers.join(", ")} set to CANCELLED in DB.`);
        return {
          finalReply: cleanedReply,
          orderCancelled: true,
          cancelledOrders: orderNumbers,
        };
      }
    }

    return { finalReply: cleanedReply, orderCancelled: false };
  } catch (err) {
    console.warn("[AI ORDER CANCEL PARSE ERROR]", err);
    return { finalReply: cleanedReply, orderCancelled: false };
  }
}
