import prisma from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/encryption";

export interface EmbeddedSignupPayload {
  tenantSlug: string;
  wabaId: string;
  phoneNumberId: string;
  code?: string;
  phoneNumber?: string;
  accessToken?: string;
}

/**
 * Normalizes phone number into international WhatsApp Cloud API recipient format (E.164 digits without +)
 * Example:
 * 01712345678 -> 8801712345678
 * +880 1812-345678 -> 8801812345678
 */
export function normalizeWhatsAppRecipient(rawPhone: string): string {
  let cleaned = rawPhone.replace(/\D/g, "");
  if (cleaned.startsWith("01") && cleaned.length === 11) {
    cleaned = "88" + cleaned;
  }
  return cleaned;
}

/**
 * Handles Meta WhatsApp Embedded Signup & Direct API Connection:
 * 1. Resolves tenant.
 * 2. Obtains effective Access Token (Custom token, exchanged code, or SuperAdmin Master Token).
 * 3. Subscribes WABA to webhooks (POST /{waba_id}/subscribed_apps).
 * 4. Auto-registers phone number with Meta Graph API (POST /{phone_number_id}/register).
 * 5. Optionally fetches verified display name & phone info from Meta.
 * 6. Saves active WHATSAPP channel in PostgreSQL.
 */
export async function handleWhatsAppEmbeddedSignup(payload: EmbeddedSignupPayload) {
  const { tenantSlug, wabaId, phoneNumberId, code, phoneNumber, accessToken: customToken } = payload;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    throw new Error("Merchant tenant not found");
  }

  const config = await prisma.superAdminConfig.findFirst();
  const appId = config?.metaAppId?.trim() || process.env.META_APP_ID?.trim();
  const appSecret =
    decryptSecret(config?.metaAppSecret) || process.env.META_APP_SECRET?.trim();

  let effectiveToken = customToken?.trim() || "";

  // 1. If authorization code was returned by Embedded Signup and App Secret is available, exchange it
  if (!effectiveToken && code && appId && appSecret && !code.startsWith("mock_")) {
    try {
      const exchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
      const exRes = await fetch(exchangeUrl);
      const exData = await exRes.json();
      if (exData.access_token) {
        effectiveToken = exData.access_token;
        console.log(`[WHATSAPP] Exchanged code for access token successfully.`);
      }
    } catch (exErr) {
      console.warn(`[WHATSAPP] Code exchange failed, falling back to master system token:`, exErr);
    }
  }

  // 2. Fallback to Master System User Token
  if (!effectiveToken) {
    effectiveToken =
      decryptSecret(config?.whatsappSystemToken) ||
      process.env.WHATSAPP_SYSTEM_USER_TOKEN ||
      "";
  }

  let verifiedDisplayName = phoneNumber;

  // 3. Auto-subscribe WABA to platform webhook if token is available
  if (effectiveToken && wabaId && !wabaId.startsWith("waba_demo")) {
    try {
      const subRes = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/subscribed_apps`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
          "Content-Type": "application/json",
        },
      });
      const subData = await subRes.json();
      console.log(`[WHATSAPP] Subscribed WABA ${wabaId} to webhooks:`, subData);
    } catch (err) {
      console.warn(`[WHATSAPP] Failed to subscribe WABA ${wabaId} to webhook:`, err);
    }
  }

  // 4. Auto-register phone number with Meta Cloud API
  if (effectiveToken && phoneNumberId && !phoneNumberId.startsWith("phone_demo")) {
    try {
      await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          pin: "123456",
        }),
      });
    } catch (err) {
      console.warn(`[WHATSAPP] Failed to auto-register phone ${phoneNumberId}:`, err);
    }

    // 5. Query phone info to fetch verified business name & formatted display number
    try {
      const phoneRes = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
        {
          headers: { Authorization: `Bearer ${effectiveToken}` },
        }
      );
      if (phoneRes.ok) {
        const phoneData = await phoneRes.json();
        if (phoneData.verified_name || phoneData.display_phone_number) {
          verifiedDisplayName = `${phoneData.verified_name || "WhatsApp"} (${phoneData.display_phone_number || phoneNumberId})`;
        }
      }
    } catch (qErr) {
      console.warn(`[WHATSAPP] Phone info query error:`, qErr);
    }
  }

  // 6. Upsert WHATSAPP Channel in PostgreSQL
  const channel = await prisma.channel.upsert({
    where: { id: `wa_channel_${tenant.id}` },
    update: {
      type: "WHATSAPP",
      pageId: phoneNumberId,
      pageName: verifiedDisplayName || phoneNumber || `WhatsApp (${wabaId})`,
      accessToken: effectiveToken ? encryptSecret(effectiveToken) : null,
      isActive: true,
      tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year rolling
    },
    create: {
      id: `wa_channel_${tenant.id}`,
      tenantId: tenant.id,
      type: "WHATSAPP",
      pageId: phoneNumberId,
      pageName: verifiedDisplayName || phoneNumber || `WhatsApp (${wabaId})`,
      accessToken: effectiveToken ? encryptSecret(effectiveToken) : null,
      isActive: true,
      tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  return { success: true, channel };
}

/**
 * Mark a customer's incoming WhatsApp message as Read (Two Blue Ticks)
 */
export async function markWhatsAppSeen(
  phoneNumberId: string,
  accessToken: string,
  messageId: string
) {
  if (!phoneNumberId || !accessToken || !messageId) return;

  const endpoint = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
  } catch (err) {
    console.warn("[WHATSAPP] markWhatsAppSeen error:", err);
  }
}

/**
 * Dispatches an AI reply text to WhatsApp via Meta Cloud API.
 * Supports natural humanized [SPLIT] message delivery bubbles with pacing.
 */
export async function sendWhatsAppReply(
  phoneNumberId: string,
  accessToken: string,
  toPhone: string,
  messageText: string
): Promise<{ success: boolean; messageId?: string; error?: any }> {
  if (!phoneNumberId || !accessToken || !toPhone || !messageText?.trim()) {
    console.warn("[WHATSAPP SENDER] Missing required parameters:", {
      hasPhoneId: Boolean(phoneNumberId),
      hasToken: Boolean(accessToken),
      toPhone,
      textLen: messageText?.length,
    });
    return { success: false, error: "Missing required parameters" };
  }

  const recipient = normalizeWhatsAppRecipient(toPhone);
  const endpoint = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  // Split into bubbles by [SPLIT] delimiter
  const parts = messageText
    .split(/\[SPLIT\]/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  let lastMessageId: string | undefined;

  try {
    for (let i = 0; i < parts.length; i++) {
      const bubbleText = parts[i];

      // Human-like natural pacing between multi-part bubbles
      if (i > 0) {
        const delayMs = Math.min(1200, Math.max(600, bubbleText.length * 20));
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "text",
          text: {
            preview_url: false,
            body: bubbleText,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`[WHATSAPP SENDER] Meta Cloud API Error on bubble ${i + 1}:`, data);
        return { success: false, error: data };
      }

      lastMessageId = data.messages?.[0]?.id;
    }

    return { success: true, messageId: lastMessageId };
  } catch (error: any) {
    console.error("[WHATSAPP SENDER] Network error sending WhatsApp reply:", error);
    return { success: false, error: error.message };
  }
}
