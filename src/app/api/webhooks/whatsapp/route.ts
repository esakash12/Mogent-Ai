import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { dispatchAiResponse } from "@/lib/ai/model-switcher";
import { decryptSecret } from "@/lib/encryption";
import { markWhatsAppSeen, sendWhatsAppReply } from "@/lib/meta/whatsapp-embedded";

export const dynamic = "force-dynamic";

// In-memory sliding cache to prevent duplicate processing of Meta WhatsApp webhooks
const processedMessageIds = new Map<string, number>();
const DEDUPE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function isDuplicateWhatsAppMid(mid?: string | null): boolean {
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
  processedMessageIds.set(mid, now);
  return false;
}

// 1. Webhook Verification (Meta GET Request)
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

// 2. Webhook Event Receiver (Meta WhatsApp Cloud API POST Request)
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Fetch Meta App Secret from Super Admin Config or Environment
    const superConfig = await prisma.superAdminConfig.findFirst();
    const appSecret =
      decryptSecret(superConfig?.metaAppSecret) || process.env.META_APP_SECRET;

    // Security Layer: HMAC-SHA256 Signature Verification (if appSecret is configured)
    if (appSecret && appSecret.trim().length > 0 && signature) {
      const expectedSignature =
        "sha256=" +
        crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        console.warn("[SECURITY] Rejected unauthenticated WhatsApp webhook: Invalid HMAC signature");
        return new Response("Unauthorized: Invalid signature", { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    if (body.object === "whatsapp_business_account" || body.entry) {
      for (const entry of body.entry || []) {
        const wabaId = entry.id;

        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value) continue;

          const phoneNumberId = value.metadata?.phone_number_id;
          const rawMessages = value.messages;
          const messages: any[] = Array.isArray(rawMessages)
            ? rawMessages
            : rawMessages
            ? [rawMessages]
            : [];
          const rawContacts = value.contacts;
          const contacts: any[] = Array.isArray(rawContacts)
            ? rawContacts
            : rawContacts
            ? [rawContacts]
            : [];

          if (messages.length > 0) {
            console.log(`[WHATSAPP WEBHOOK] Processing ${messages.length} message(s) for PhoneId: ${phoneNumberId}`);
          }

          for (const message of messages) {
            const mid = message.id; // e.g. "wamid.HBgL..."
            const fromPhone = message.from; // e.g. "8801700000000"
            const messageType = message.type;

            // Extract message text (supports plain text or interactive button clicks)
            let messageText = "";
            if (messageType === "text") {
              messageText = message.text?.body || "";
            } else if (messageType === "interactive") {
              messageText =
                message.interactive?.button_reply?.title ||
                message.interactive?.list_reply?.title ||
                "";
            } else if (messageType === "button") {
              messageText = message.button?.text || "";
            }

            console.log("[WHATSAPP WEBHOOK] Incoming message:", { mid, fromPhone, messageType, messageText });

            if (!mid || !fromPhone || !messageText.trim()) continue;

            // 1. Sliding In-Memory Deduplication: Meta retries webhook if response took > 5s
            if (isDuplicateWhatsAppMid(mid)) {
              console.log(`[WHATSAPP BOT] Skipping duplicate webhook retry (in-memory): mid=${mid}`);
              continue;
            }

            // 2. Database Deduplication: Ensure mid hasn't already been processed
            const existingMsg = await prisma.message.findFirst({
              where: { externalId: mid },
            });
            if (existingMsg) {
              console.log(`[WHATSAPP BOT] Skipping already processed message in DB: mid=${mid}`);
              continue;
            }

            // 3. Resolve Customer Display Name
            const contact = contacts.find((c: any) => c.wa_id === fromPhone);
            const customerDisplayName = contact?.profile?.name || "WhatsApp Customer";

            // 4. Multi-Tenant Channel Matching:
            // Match Channel by phoneNumberId, then fallback to WABA ID or active WhatsApp channel
            let channel = null;
            if (phoneNumberId) {
              channel = await prisma.channel.findFirst({
                where: { type: "WHATSAPP", pageId: phoneNumberId },
                include: { tenant: true },
              });
            }

            if (!channel && wabaId) {
              channel = await prisma.channel.findFirst({
                where: { type: "WHATSAPP", pageName: { contains: wabaId } },
                include: { tenant: true },
              });
            }

            if (!channel) {
              channel = await prisma.channel.findFirst({
                where: { type: "WHATSAPP", isActive: true },
                include: { tenant: true },
              });
            }

            let tenant = channel?.tenant || null;
            if (!tenant) {
              tenant = await prisma.tenant.findFirst();
            }

            if (!tenant) {
              console.warn(`[WHATSAPP BOT] No tenant found for message from ${fromPhone}`);
              continue;
            }

            // 5. Resolve Access Token
            const effectiveToken =
              (channel?.accessToken ? decryptSecret(channel.accessToken) : null) ||
              decryptSecret(superConfig?.whatsappSystemToken) ||
              process.env.WHATSAPP_SYSTEM_USER_TOKEN;

            // 6. Mark message as Read (Two Blue Ticks) immediately on WhatsApp
            if (phoneNumberId && effectiveToken) {
              markWhatsAppSeen(phoneNumberId, effectiveToken, mid).catch(() => {});
            }

            // 7. Find or Create Conversation in DB
            let conversation = await prisma.conversation.findFirst({
              where: {
                tenantId: tenant.id,
                customerExternalId: fromPhone,
                channelType: "WHATSAPP",
              },
            });

            if (!conversation) {
              conversation = await prisma.conversation.create({
                data: {
                  tenantId: tenant.id,
                  channelId: channel?.id || null,
                  channelType: "WHATSAPP",
                  customerExternalId: fromPhone,
                  customerPhone: fromPhone,
                  customerName: customerDisplayName,
                  status: "OPEN",
                  lastMessageAt: new Date(),
                },
              });
            } else {
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                  lastMessageAt: new Date(),
                  ...(customerDisplayName && conversation.customerName === "WhatsApp Customer"
                    ? { customerName: customerDisplayName }
                    : {}),
                },
              });
            }

            // 8. Save Customer Message to DB
            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                tenantId: tenant.id,
                externalId: mid,
                senderType: "CUSTOMER",
                senderName: customerDisplayName,
                content: messageText,
              },
            });

            // 9. Automation Checks
            if (channel && channel.isActive === false) {
              console.log(`[WHATSAPP BOT] Channel ${channel.pageName} is paused. Skipping bot reply.`);
              continue;
            }

            if (conversation.aiHandled === false) {
              console.log(`[WHATSAPP BOT] Conversation ${conversation.id} AI is paused by merchant. Skipping bot reply.`);
              continue;
            }

            // Debounce Check: Prevent rapid duplicate AI replies within 6 seconds
            const recentAiReply = await prisma.message.findFirst({
              where: {
                conversationId: conversation.id,
                senderType: "AI",
                createdAt: {
                  gte: new Date(Date.now() - 6000),
                },
              },
            });
            if (recentAiReply) {
              console.log(`[WHATSAPP BOT] Skipping duplicate reply: Already replied within last 6s.`);
              continue;
            }

            // 10. Meta Click-to-WhatsApp (CTWA) Ad Referral Context Extraction
            let promptText = messageText;
            if (message.referral) {
              const ref = message.referral;
              const adTitle = ref.headline || ref.body || "";
              if (adTitle) {
                promptText = `[বিজ্ঞাপন রেফারেল: "${adTitle}"]\n${messageText}`;
                console.log(`[WHATSAPP CTWA] Detected Meta Ad Referral: "${adTitle}"`);
              }
            }

            // 11. Dispatch through AI Brain
            let replyText = "";
            try {
              const aiResult = await dispatchAiResponse(
                tenant.id,
                promptText,
                customerDisplayName,
                fromPhone,
                conversation.id
              );
              replyText = aiResult.replyText;
            } catch (aiErr) {
              console.error("[WHATSAPP BOT] AI Dispatch failed:", aiErr);
              replyText = "ধন্যবাদ আপনার বার্তার জন্য। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।";
            }

            // 12. Dispatch Reply Back to Customer on WhatsApp
            if (phoneNumberId && effectiveToken && replyText) {
              const sendResult = await sendWhatsAppReply(
                phoneNumberId,
                effectiveToken,
                fromPhone,
                replyText
              );

              console.log("[WHATSAPP BOT] Dispatched reply to WhatsApp:", {
                fromPhone,
                phoneNumberId,
                success: sendResult?.success,
              });

              // Record AI Message in DB
              await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  tenantId: tenant.id,
                  senderType: "AI",
                  senderName: "Mogent AI",
                  content: replyText,
                },
              });
            } else {
              console.warn("[WHATSAPP BOT] Cannot dispatch reply: Missing Phone Number ID or Token.", {
                hasPhoneId: Boolean(phoneNumberId),
                hasToken: Boolean(effectiveToken),
              });
            }
          }
        }
      }
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("WhatsApp Webhook Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
