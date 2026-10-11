import prisma from "@/lib/db";
import { decryptSecret } from "@/lib/encryption";

export interface SendSmsRequest {
  tenantId: string;
  recipientPhone: string;
  messageText: string;
}

export interface SendSmsResponse {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  maintenance?: boolean;
  rawResponse?: any;
}

/**
 * Enterprise Unified SMS Gateway Client
 * Supports Greenweb, BulkSMSBD, and SSL Wireless.
 * Performs pre-flight wallet balance check and audit ledger recording.
 */
export async function dispatchSms(req: SendSmsRequest): Promise<SendSmsResponse> {
  const { tenantId, recipientPhone, messageText } = req;

  // 1. Fetch Super Admin SMS Configuration
  const superConfig = await prisma.superAdminConfig.findFirst();
  const provider = superConfig?.smsProvider || "GREENWEB";
  const perSmsCost = superConfig?.perSmsCost || 0.35;

  // 2. Real-time Wallet Balance Check
  const wallet = await prisma.wallet.findUnique({
    where: { tenantId },
  });

  if (!wallet || wallet.balanceBdt < perSmsCost) {
    return {
      success: false,
      error: `অপর্যাপ্ত ওয়ালেট ব্যালেন্স। এসএমএস প্রেরণের জন্য ন্যূনতম ৳${perSmsCost.toFixed(2)} প্রয়োজন।`,
    };
  }

  // Format recipient phone number (normalize BD phone numbers, e.g., 017... -> 88017...)
  let formattedPhone = recipientPhone.replace(/\D/g, "");
  if (formattedPhone.startsWith("01")) {
    formattedPhone = "88" + formattedPhone;
  } else if (!formattedPhone.startsWith("8801") && formattedPhone.length === 11) {
    formattedPhone = "88" + formattedPhone;
  }

  let messageId = `sms_${Date.now()}`;
  let rawResponse: any = null;

  try {
    if (provider === "GREENWEB") {
      const token = decryptSecret(superConfig?.greenwebToken) || process.env.GREENWEB_TOKEN;
      if (!token) {
        return {
          success: false,
          error: "Greenweb SMS token is not configured in Super Admin settings.",
          maintenance: true,
        };
      }

      const params = new URLSearchParams({
        token,
        to: formattedPhone,
        message: messageText,
      });

      const res = await fetch("https://api.greenweb.com.bd/api.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const responseText = await res.text();
      rawResponse = responseText;

      // Greenweb returns strings like "Ok: 1 SMS Sent" or error codes
      if (!responseText.toLowerCase().includes("ok") && !responseText.toLowerCase().includes("sent")) {
        console.warn("[SMS] Greenweb returned non-OK response:", responseText);
      }
      messageId = `gw_${Date.now()}`;
    } else if (provider === "BULKSMSBD") {
      const apiKey = decryptSecret(superConfig?.bulksmsApiKey) || process.env.BULKSMS_API_KEY;
      const senderId = superConfig?.bulksmsSenderId || process.env.BULKSMS_SENDER_ID;

      if (!apiKey || !senderId) {
        return {
          success: false,
          error: "BulkSMSBD credentials (API key or Sender ID) are not configured in Super Admin settings.",
          maintenance: true,
        };
      }

      const params = new URLSearchParams({
        api_key: apiKey,
        type: "text",
        number: formattedPhone,
        senderid: senderId,
        message: messageText,
      });

      const res = await fetch("http://bulksmsbd.net/api/smsapi", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const json = await res.json().catch(() => ({ raw: "non-json response" }));
      rawResponse = json;
      messageId = json?.message_id || `bsms_${Date.now()}`;
    } else if (provider === "SSL_WIRELESS") {
      const apiKey = decryptSecret(superConfig?.sslczSmsApiKey) || process.env.SSL_SMS_API_KEY;
      const sid = superConfig?.sslczSmsSid || process.env.SSL_SMS_SID;

      if (!apiKey || !sid) {
        return {
          success: false,
          error: "SSL Wireless SMS credentials are not configured in Super Admin settings.",
          maintenance: true,
        };
      }

      const params = new URLSearchParams({
        api_token: apiKey,
        sid: sid,
        msisdn: formattedPhone,
        sms: messageText,
        csms_id: `csms_${Date.now()}`,
      });

      const res = await fetch("https://smsplus.sslwireless.com/api/v3/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const json = await res.json().catch(() => ({ raw: "non-json response" }));
      rawResponse = json;
      messageId = `ssl_${Date.now()}`;
    } else {
      return {
        success: false,
        error: `Unsupported SMS provider: ${provider}`,
      };
    }

    // 3. Deduct Wallet Balance & Create Ledger Entry
    const newBal = Math.max(0, wallet.balanceBdt - perSmsCost);
    await prisma.$transaction([
      prisma.wallet.update({
        where: { tenantId },
        data: { balanceBdt: newBal },
      }),
      prisma.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          tenantId,
          amount: -perSmsCost,
          type: "DEBIT_SMS",
          description: `SMS notification to ${recipientPhone} via ${provider}`,
          balanceAfter: newBal,
        },
      }),
    ]);

    return {
      success: true,
      messageId,
      provider,
      rawResponse,
    };
  } catch (err: any) {
    console.error("[SMS_DISPATCH_ERROR]", err);
    return {
      success: false,
      error: err.message || "SMS sending failed due to an unexpected error.",
    };
  }
}
