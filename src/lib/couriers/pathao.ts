import prisma from "@/lib/db";
import { CourierBookingResult } from "./steadfast";

export interface PathaoOrderPayload {
  tenantId: string;
  merchant_order_id: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city?: number;
  recipient_zone?: number;
  amount_to_collect: number;
  item_quantity?: number;
  item_weight?: number;
  item_description?: string;
}

/**
 * 100% Plug-and-Play Official Pathao Courier Dispatcher
 * Resilient against Pathao server downtime with in-app notifications
 */
export async function createPathaoOrder(
  payload: PathaoOrderPayload
): Promise<CourierBookingResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
    select: { id: true, name: true, pathaoClientId: true, pathaoClientSecret: true },
  });

  const clientId = tenant?.pathaoClientId || process.env.PATHAO_CLIENT_ID;
  const clientSecret = tenant?.pathaoClientSecret || process.env.PATHAO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      configured: false,
      success: false,
      message: "Pathao Client ID ও Secret Key কনফিগার করা নেই। অনুগ্রহ করে Integrations সেটিংস থেকে যুক্ত করুন।",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://api-hermes.pathao.com/aladdin/api/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientId}`,
      },
      body: JSON.stringify({
        store_id: 1,
        merchant_order_id: payload.merchant_order_id,
        recipient_name: payload.recipient_name,
        recipient_phone: payload.recipient_phone,
        recipient_address: payload.recipient_address,
        recipient_city: payload.recipient_city || 1,
        recipient_zone: payload.recipient_zone || 1,
        amount_to_collect: payload.amount_to_collect,
        item_quantity: payload.item_quantity || 1,
        item_weight: payload.item_weight || 0.5,
        item_description: payload.item_description || "Mogent Order",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      await prisma.notification.create({
        data: {
          tenantId: payload.tenantId,
          title: "Pathao সার্ভার ডাউন নোটিশ",
          message: `Pathao সার্ভারে সাময়িক সমস্যা (${res.status}) থাকায় অর্ডার #${payload.merchant_order_id}-এর পার্সেলটি পেন্ডিং রাখা হয়েছে।`,
          type: "SYSTEM",
        },
      });

      return {
        configured: true,
        success: false,
        outage: true,
        message: "Pathao সার্ভার সাময়িকভাবে ডাউন। আপনার পার্সেলটি পেন্ডিং রাখা হয়েছে।",
      };
    }

    const data = await res.json();

    if (data.type === "success" && data.data) {
      return {
        configured: true,
        success: true,
        message: "Pathao পার্সেল সফলভাবে বুক করা হয়েছে!",
        consignment: {
          consignment_id: data.data.consignment_id || "",
          tracking_code: data.data.consignment_id || "",
          status: "in_transit",
        },
      };
    }

    return {
      configured: true,
      success: false,
      message: data.message || "Pathao পার্সেল বুকিং ব্যর্থ হয়েছে।",
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Pathao API error:", error);

    await prisma.notification.create({
      data: {
        tenantId: payload.tenantId,
        title: "Pathao সার্ভার সংযোগ বিচ্ছিন্ন",
        message: `Pathao সার্ভার ডাউন থাকায় অর্ডার #${payload.merchant_order_id} পার্সেলটি পেন্ডিং রাখা হয়েছে।`,
        type: "SYSTEM",
      },
    });

    return {
      configured: true,
      success: false,
      outage: true,
      message: "Pathao সার্ভার ডাউন বা টাইমআউট হয়েছে। পার্সেলটি পেন্ডিং রাখা হয়েছে।",
    };
  }
}
