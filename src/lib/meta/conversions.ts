import crypto from "crypto";

export interface MetaCapiUserData {
  phone?: string | null;
  name?: string | null;
  email?: string | null;
  city?: string | null;
  country?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
}

export interface MetaCapiPurchaseParams {
  pixelId: string;
  capiAccessToken: string;
  testEventCode?: string | null;
  eventId: string; // Order Number or unique ID
  amount: number;
  currency?: string;
  userData: MetaCapiUserData;
  actionSource?: "chat" | "website" | "system_generated";
  items?: Array<{
    productId?: string | null;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

/**
 * Normalizes and hashes customer PII according to Meta CAPI specification (SHA-256)
 */
export function hashSha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function normalizeAndHashPhone(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;

  // Normalize Bangladeshi phone numbers to E.164 without leading +
  if (digits.startsWith("01")) {
    digits = "88" + digits;
  } else if (digits.startsWith("8801")) {
    // already 8801...
  }

  return hashSha256(digits);
}

/**
 * Dispatches a server-side Purchase event to Meta Graph API Conversions API (CAPI)
 */
export async function sendMetaCapiPurchaseEvent(params: MetaCapiPurchaseParams) {
  const {
    pixelId,
    capiAccessToken,
    testEventCode,
    eventId,
    amount,
    currency = "BDT",
    userData,
    actionSource = "chat",
    items = [],
  } = params;

  if (!pixelId || !capiAccessToken) {
    return {
      success: false,
      error: "Missing Meta Pixel ID or CAPI Access Token",
    };
  }

  const endpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(
    pixelId.trim()
  )}/events?access_token=${encodeURIComponent(capiAccessToken.trim())}`;

  // Build Meta User Data with SHA-256 hashed fields
  const metaUserData: Record<string, any> = {};

  const hashedPhone = normalizeAndHashPhone(userData.phone);
  if (hashedPhone) {
    metaUserData.ph = [hashedPhone];
  }

  if (userData.name) {
    const nameParts = userData.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;
    metaUserData.fn = [hashSha256(firstName)];
    metaUserData.ln = [hashSha256(lastName)];
  }

  if (userData.email) {
    metaUserData.em = [hashSha256(userData.email)];
  }

  const city = userData.city || "Dhaka";
  metaUserData.ct = [hashSha256(city)];
  metaUserData.country = [hashSha256(userData.country || "bd")];

  if (userData.clientIpAddress) {
    metaUserData.client_ip_address = userData.clientIpAddress;
  }
  if (userData.clientUserAgent) {
    metaUserData.client_user_agent = userData.clientUserAgent;
  }

  // Build Meta Custom Data
  const customData: Record<string, any> = {
    currency: currency.toUpperCase(),
    value: amount,
    content_type: "product",
  };

  if (items.length > 0) {
    customData.contents = items.map((item) => ({
      id: item.productId || item.productName,
      quantity: item.quantity,
      item_price: item.unitPrice,
    }));
  }

  const eventPayload: Record<string, any> = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: process.env.NEXT_PUBLIC_APP_URL || "https://mogent.ai",
    action_source: actionSource,
    user_data: metaUserData,
    custom_data: customData,
  };

  const requestBody: Record<string, any> = {
    data: [eventPayload],
  };

  if (testEventCode && testEventCode.trim().length > 0) {
    requestBody.test_event_code = testEventCode.trim();
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[META CAPI] Error dispatching event to Meta:", responseData);
      return {
        success: false,
        error: responseData.error?.message || "Failed to send CAPI event",
        details: responseData,
      };
    }

    console.log("[META CAPI] Event dispatched successfully:", {
      eventsReceived: responseData.events_received,
      fbtraceId: responseData.fbtrace_id,
      eventId,
      testEventCode: testEventCode || "LIVE",
    });

    return {
      success: true,
      eventsReceived: responseData.events_received,
      fbtraceId: responseData.fbtrace_id,
      data: responseData,
    };
  } catch (err: any) {
    console.error("[META CAPI] Network error dispatching CAPI event:", err);
    return {
      success: false,
      error: err.message || "Network error",
    };
  }
}
