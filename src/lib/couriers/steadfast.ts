import prisma from "@/lib/db";

export interface SteadfastOrderPayload {
  tenantId: string;
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

export interface CourierBookingResult {
  configured: boolean;
  success: boolean;
  outage?: boolean;
  message: string;
  consignment?: {
    consignment_id: string;
    tracking_code: string;
    status: string;
  };
}

/**
 * 100% Plug-and-Play Official Steadfast Courier Dispatcher
 * Resilient against third-party API outages with in-app notification alerts
 */
export async function createSteadfastOrder(
  payload: SteadfastOrderPayload
): Promise<CourierBookingResult> {
  // 1. Fetch credentials from Tenant record or environment
  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
    select: { id: true, name: true, steadfastApiKey: true, steadfastSecretKey: true },
  });

  const apiKey = tenant?.steadfastApiKey || process.env.STEADFAST_API_KEY;
  const secretKey = tenant?.steadfastSecretKey || process.env.STEADFAST_SECRET_KEY;

  // 2. Unconfigured State Check
  if (!apiKey || !secretKey) {
    return {
      configured: false,
      success: false,
      message: "Steadfast API Key ও Secret Key কনফিগার করা নেই। অনুগ্রহ করে Integrations সেটিংস থেকে API Key যুক্ত করুন।",
    };
  }

  // 3. Live External Call with 8-Second Outage Timeout Protection
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://portal.steadfast.com.bd/api/v1/create_order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
      },
      body: JSON.stringify({
        invoice: payload.invoice,
        recipient_name: payload.recipient_name,
        recipient_phone: payload.recipient_phone,
        recipient_address: payload.recipient_address,
        cod_amount: payload.cod_amount,
        note: payload.note || "Mogent AI Commerce Order",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // If Steadfast server returns 5xx or bad gateway
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.warn(`Steadfast server responded with HTTP ${res.status}:`, errorText);

      // Record in-app notification for merchant
      await prisma.notification.create({
        data: {
          tenantId: payload.tenantId,
          title: "Steadfast সার্ভার ডাউন নোটিশ",
          message: `Steadfast সার্ভারে সাময়িক সমস্যা (${res.status}) থাকায় চালান #${payload.invoice}-এর পার্সেল বুকিং পেন্ডিং রাখা হয়েছে। সার্ভার সচল হলে পুনরায় চেষ্টা করুন।`,
          type: "SYSTEM",
        },
      });

      return {
        configured: true,
        success: false,
        outage: true,
        message: "Steadfast সার্ভার সাময়িকভাবে ডাউন। আপনার পার্সেলটি পেন্ডিং রাখা হয়েছে।",
      };
    }

    const data = await res.json();

    if (data.status === 200 && data.consignment) {
      return {
        configured: true,
        success: true,
        message: "Steadfast পার্সেল সফলভাবে তৈরি হয়েছে!",
        consignment: {
          consignment_id: data.consignment.consignment_id?.toString() || "",
          tracking_code: data.consignment.tracking_code || "",
          status: data.consignment.status || "in_review",
        },
      };
    }

    return {
      configured: true,
      success: false,
      message: data.message || "Steadfast পার্সেল বুকিং ব্যর্থ হয়েছে।",
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Steadfast API connection error:", error.name, error.message);

    // Handle Network Timeout or Server Down
    await prisma.notification.create({
      data: {
        tenantId: payload.tenantId,
        title: "Steadfast সার্ভার সাময়িক ডাউন",
        message: `Steadfast সার্ভার সংযোগ বিচ্ছিন্ন থাকায় ইনভয়েস #${payload.invoice} পার্সেলটি পেন্ডিং হিসেবে সংরক্ষণ করা হয়েছে।`,
        type: "SYSTEM",
      },
    });

    return {
      configured: true,
      success: false,
      outage: true,
      message: "Steadfast সার্ভার সাময়িকভাবে ডাউন বা টাইমআউট হয়েছে। পার্সেলটি পেন্ডিং রাখা হয়েছে।",
    };
  }
}
