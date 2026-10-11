import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { dispatchAiResponse } from "@/lib/ai/model-switcher";
import { decryptSecret } from "@/lib/encryption";
import { sendFacebookReply, markFacebookSeen, fetchFacebookUserProfile, resolvePublicMediaUrl } from "@/lib/meta/messages";
import { debounceIncomingMessage, registerPendingMedia } from "@/lib/ai/debouncer";

export const dynamic = "force-dynamic";

// In-memory sliding cache to prevent duplicate processing of Meta webhooks (retries)
const processedMessageIds = new Map<string, number>();
const DEDUPE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function isDuplicateMetaMid(mid?: string | null): boolean {
  if (!mid) return false;
  const now = Date.now();
  if (processedMessageIds.size > 2000) {
    processedMessageIds.forEach((timestamp, key) => {
      if (now - timestamp > DEDUPE_TTL_MS) {
        processedMessageIds.delete(key);
      }
    });
  }
  if (processedMessageIds.has(mid)) {
    return true;
  }
  // Record immediately to block concurrent incoming webhook retries
  processedMessageIds.set(mid, now);
  return false;
}

// Webhook Verification (Meta GET Request)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const superConfig = await prisma.superAdminConfig.findFirst();
  const verifyToken =
    superConfig?.whatsappVerifyToken?.trim() ||
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    "mogent_ai_secure_verify_token_2026";

  if (mode === "subscribe" && token === verifyToken) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

// Webhook Event Receiver (Meta POST Request with HMAC-SHA256 Verification)
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // 1. Fetch Meta App Secret from Super Admin Config or Environment
    const superConfig = await prisma.superAdminConfig.findFirst();
    const appSecret =
      decryptSecret(superConfig?.metaAppSecret) || process.env.META_APP_SECRET;

    // 2. Security Layer: HMAC-SHA256 Signature Verification (if configured)
    if (appSecret && appSecret.trim().length > 0) {
      if (!signature) {
        return new Response("Missing X-Hub-Signature-256 header", { status: 401 });
      }

      const expectedSignature =
        "sha256=" +
        crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        console.warn("[SECURITY] Rejected unauthenticated Meta webhook event: Invalid HMAC signature");
        return new Response("Unauthorized: Invalid signature", { status: 401 });
      }
    }

    // 3. Parse Event Body
    const body = JSON.parse(rawBody);

    if (body.object === "page") {
      // Check AI readiness in Super Admin
      const geminiKey = decryptSecret(superConfig?.geminiApiKey);
      const openaiKey = decryptSecret(superConfig?.openaiApiKey);
      const isAiApiReady = Boolean(
        (geminiKey && geminiKey.trim().length > 10) ||
        (openaiKey && openaiKey.trim().length > 10)
      );

      for (const entry of body.entry || []) {
        const pageId = entry.id; // Facebook Page ID

        // Match Channel to find corresponding Tenant & Access Token
        let channel = null;
        if (pageId) {
          channel = await prisma.channel.findFirst({
            where: { pageId },
            include: { tenant: { include: { aiSetting: true } } },
          });
        }

        // Fallback: match first Facebook channel if direct pageId not matched
        if (!channel) {
          channel = await prisma.channel.findFirst({
            where: { type: "FACEBOOK" },
            include: { tenant: { include: { aiSetting: true } } },
          });
        }

        let tenant = channel?.tenant || null;
        if (!tenant) {
          tenant = await prisma.tenant.findFirst({ include: { aiSetting: true } });
        }

        const messagingEvents = entry.messaging || [];
        for (const webhookEvent of messagingEvents) {
          // Support both standard user messages and interactive button clicks (postbacks)
          const isPostback = Boolean(webhookEvent.postback);
          const isStandardMsg = Boolean(webhookEvent.message && !webhookEvent.message.is_echo);

          if (isStandardMsg || isPostback) {
            const senderId = webhookEvent.sender?.id;
            let rawMessageText = "";
            let mid = webhookEvent.message?.mid;

            if (isPostback) {
              const pbTitle = webhookEvent.postback?.title || "";
              const pbPayload = webhookEvent.postback?.payload || "";
              mid = webhookEvent.postback?.mid || `pb_${Date.now()}_${senderId}`;
              rawMessageText = pbTitle || pbPayload || "এটি নিতে চাই";
            } else {
              rawMessageText = webhookEvent.message?.text || "";
              if (webhookEvent.message?.quick_reply) {
                const qrPayload = webhookEvent.message.quick_reply.payload;
                rawMessageText = webhookEvent.message.text || qrPayload || "";
              }
            }

            // Extract incoming attachments (images, PDFs, documents, voice)
            const rawAttachments = webhookEvent.message?.attachments || [];
            let incomingMediaUrl: string | null = null;
            let incomingMediaType: string | null = null;

            if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
              const firstAtt = rawAttachments[0];
              incomingMediaType = firstAtt.type || "file";
              incomingMediaUrl = firstAtt.payload?.url || null;
            }

            const hasText = Boolean(rawMessageText.trim());
            const hasMedia = Boolean(incomingMediaUrl);

            if (!senderId || !tenant || (!hasText && !hasMedia)) continue;

            // 1. Sliding In-Memory Deduplication: Meta retries webhook if response took > 5s
            if (mid && isDuplicateMetaMid(mid)) {
              console.log(`[META BOT] Skipping duplicate webhook retry (in-memory): mid=${mid}`);
              continue;
            }

            // 2. Database Deduplication: Ensure mid hasn't been saved in DB
            if (mid) {
              const existingMsg = await prisma.message.findFirst({
                where: { externalId: mid },
              });
              if (existingMsg) {
                console.log(`[META BOT] Skipping already processed message in DB: mid=${mid}`);
                continue;
              }
            }

            const pageAccessToken = channel?.accessToken
              ? decryptSecret(channel.accessToken)
              : null;

            // Immediately mark message as Seen on Facebook
            if (pageAccessToken) {
              markFacebookSeen(pageAccessToken, senderId).catch(() => {});
            }

            // Fetch Customer Profile (real name) from Facebook Graph API
            let customerDisplayName: string | undefined = undefined;
            if (pageAccessToken) {
              try {
                const userProfile = await fetchFacebookUserProfile(pageAccessToken, senderId);
                if (userProfile?.name) {
                  customerDisplayName = userProfile.name;
                }
              } catch (profileErr) {
                console.warn("[META BOT] Could not fetch user profile:", profileErr);
              }
            }

            // Auto-detect Bangladeshi Phone Number from message text
            let detectedPhone: string | null = null;
            const phoneMatch = rawMessageText.match(/(?:\+?88)?01[3-9]\d{8}/);
            if (phoneMatch) {
              detectedPhone = phoneMatch[0];
            }

            // Save Conversation & Incoming Customer Message in DB
            let conversation = await prisma.conversation.findFirst({
              where: {
                tenantId: tenant.id,
                customerExternalId: senderId,
                channelType: "FACEBOOK",
              },
            });

            if (!conversation) {
              conversation = await prisma.conversation.create({
                data: {
                  tenantId: tenant.id,
                  customerExternalId: senderId,
                  customerName: customerDisplayName || "Facebook Customer",
                  customerPhone: detectedPhone || null,
                  channelType: "FACEBOOK",
                  channelId: channel?.id || null,
                  status: "OPEN",
                  lastMessageAt: new Date(),
                },
              });
            } else {
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                  lastMessageAt: new Date(),
                  ...(channel?.id && !conversation.channelId ? { channelId: channel.id } : {}),
                  ...(customerDisplayName && conversation.customerName === "Facebook Customer"
                    ? { customerName: customerDisplayName }
                    : {}),
                  ...(detectedPhone && !conversation.customerPhone
                    ? { customerPhone: detectedPhone }
                    : {}),
                },
              });
            }

            // 6. Define Session Key for Debouncer
            const sessionKey = `${tenant.id}:FB:${senderId}`;

            // Auto-transcribe incoming audio if present (with burst hold)
            let voiceTranscript = "";
            let releasePendingAudio: (() => void) | null = null;
            if (incomingMediaType === "audio") {
              releasePendingAudio = registerPendingMedia(sessionKey);
            }

            try {
              if (incomingMediaType === "audio" && incomingMediaUrl && geminiKey) {
                voiceTranscript = await transcribeAudioAttachment(incomingMediaUrl, geminiKey);
                if (voiceTranscript) {
                  console.log(`[META BOT] Audio transcribed: "${voiceTranscript}"`);
                }
              }
            } finally {
              if (releasePendingAudio) {
                releasePendingAudio();
              }
            }

            // Save Customer Message in DB with mediaUrl attachment
            const savedContent = hasText
              ? (voiceTranscript ? `${rawMessageText.trim()}\n🎵 [ভয়েস মেসেজ]: "${voiceTranscript}"` : rawMessageText.trim())
              : incomingMediaType === "image"
              ? "📷 [ছবি / ইমেজ]"
              : incomingMediaType === "audio"
              ? (voiceTranscript ? `🎵 [ভয়েস মেসেজ]: "${voiceTranscript}"` : "🎵 [ভয়েস মেসেজ]")
              : incomingMediaType === "video"
              ? "🎥 [ভিডিও]"
              : "📎 [ফাইল সংযুক্তি]";

            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                tenantId: tenant.id,
                externalId: mid || null,
                senderType: "CUSTOMER",
                senderName: customerDisplayName || conversation.customerName || "Customer",
                content: savedContent,
                mediaUrl: incomingMediaUrl || null,
              },
            });

            // Check if page automation is enabled / active
            // If merchant toggled this channel OFF, do not send bot reply
            if (channel && channel.isActive === false) {
              console.log(`[META BOT] Page ${channel.pageName} (${channel.pageId}) is paused. Skipping bot reply.`);
              continue;
            }

            // If merchant took over this conversation (AI paused), do not send bot reply
            if (conversation.aiHandled === false) {
              console.log(`[META BOT] Conversation ${conversation.id} AI is paused by human agent. Skipping bot reply.`);
              continue;
            }

            const targetConversationId = conversation.id;
            const targetTenantId = tenant.id;

            const textForAi = voiceTranscript
              ? (hasText ? `${rawMessageText.trim()}\n[কাস্টমার একটি ভয়েস মেসেজ পাঠিয়েছেন। ট্রান্সক্রিপ্ট]: "${voiceTranscript}"` : `[কাস্টমার একটি ভয়েস মেসেজ পাঠিয়েছেন। ট্রান্সক্রিপ্ট]: "${voiceTranscript}"`)
              : hasText
              ? (hasMedia && incomingMediaType === "image" ? `${rawMessageText.trim()}\n[কাস্টমার একটি ছবি পাঠিয়েছেন]` : (hasMedia ? `${rawMessageText.trim()}\n[কাস্টমার একটি ফাইল পাঠিয়েছেন]` : rawMessageText.trim()))
              : (incomingMediaType === "audio" ? "[কাস্টমার একটি ভয়েস মেসেজ পাঠিয়েছেন]" : (incomingMediaType === "image" ? "[কাস্টমার একটি ছবি পাঠিয়েছেন]" : "[কাস্টমার একটি ফাইল সংযুক্তি পাঠিয়েছেন]"));

            const imageToPass = incomingMediaType === "image" ? (incomingMediaUrl || null) : null;

            debounceIncomingMessage(
              sessionKey,
              {
                text: textForAi,
                imageUrl: imageToPass || undefined,
              },
              async ({ aggregatedText, imageUrls }) => {
                let replyText = "";
                let aiResult: any = null;
                if (!isAiApiReady) {
                  replyText =
                    "ধন্যবাদ আপনার বার্তার জন্য! একটু অপেক্ষা করুন, আমাদের প্রতিনিধি খুব শীঘ্রই আপনার সাথে যুক্ত হবেন।";
                } else {
                  try {
                    aiResult = await dispatchAiResponse(
                      targetTenantId,
                      aggregatedText,
                      customerDisplayName || "Facebook Customer",
                      detectedPhone || conversation.customerPhone || undefined,
                      targetConversationId,
                      undefined,
                      imageUrls.length > 0 ? imageUrls : undefined
                    );
                    replyText = aiResult.replyText;
                  } catch (aiErr) {
                    console.error("[META BOT] AI Dispatch failed, falling back:", aiErr);
                    replyText = "একটু অপেক্ষা করুন, আমরা শীঘ্রই উত্তর দিচ্ছি।";
                  }
                }

              // 7. Dispatch Unified Reply Back to User on Messenger
              const hasCarousel = Boolean(aiResult?.carouselProducts && aiResult.carouselProducts.length > 0);
              if (pageAccessToken && (replyText || hasCarousel)) {
                let carouselElements: any[] | undefined = undefined;
                if (hasCarousel) {
                  const catalogUrl = tenant?.aiSetting?.catalogLocationUrl || undefined;
                  carouselElements = aiResult.carouselProducts.map((p: any) => ({
                    title: p.name.slice(0, 80),
                    subtitle: `দাম ৳${p.price}${p.stock !== undefined ? ` · স্টক: ${p.stock}` : ""}`,
                    image_url: p.imageUrl ? resolvePublicMediaUrl(p.imageUrl) : undefined,
                    buttons: [
                      {
                        type: "postback",
                        title: "এটি নিতে চাই",
                        payload: `ORDER_PRODUCT_${p.id}`,
                      },
                      ...(catalogUrl
                        ? [
                            {
                              type: "web_url",
                              title: "বিস্তারিত",
                              url: catalogUrl,
                            },
                          ]
                        : [
                            {
                              type: "postback",
                              title: "বিস্তারিত",
                              payload: `DETAILS_PRODUCT_${p.id}`,
                            },
                          ]),
                    ],
                  }));
                }

                const sendResult = await sendFacebookReply(
                  pageAccessToken,
                  senderId,
                  replyText,
                  null,
                  null,
                  {
                    carouselElements,
                    quickReplies: aiResult?.quickReplies,
                  }
                );
                console.log("[META BOT] Dispatched debounced reply to Messenger:", {
                  senderId,
                  hasCarousel,
                  hasQuickReplies: Boolean(aiResult?.quickReplies?.length),
                  success: sendResult?.success,
                });

                // Record Bot Message in DB
                await prisma.message.create({
                  data: {
                    conversationId: targetConversationId,
                    tenantId: targetTenantId,
                    senderType: "AI",
                    senderName: "Mogent AI",
                    content: replyText || (hasCarousel ? "[প্রোডাক্ট কার্ড ক্যারোসেল পাঠানো হয়েছে]" : ""),
                  },
                });
              } else {
                console.warn("[META BOT] Cannot dispatch reply: Missing Page Access Token on channel.");
              }
            }).catch((debErr) => {
              console.error("[META BOT] Debouncer error:", debErr);
            });
          }
        }
      }

      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    return new Response("Not a page event", { status: 404 });
  } catch (error: any) {
    console.error("Meta Webhook Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}


async function transcribeAudioAttachment(audioUrl: string, apiKey?: string | null): Promise<string> {
  if (!apiKey || !audioUrl) return "";
  try {
    const audioRes = await fetch(audioUrl, { signal: AbortSignal.timeout(12000) });
    if (!audioRes.ok) return "";
    const buf = Buffer.from(await audioRes.arrayBuffer());
    const b64 = buf.toString("base64");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe:generateContent?key=${apiKey}`,
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
                    mime_type: "audio/mp4",
                    data: b64,
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
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.audioTranscription?.text ||
        data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === "string") {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn("[AUDIO TRANSCRIBE ERROR]", err);
  }
  return "";
}
