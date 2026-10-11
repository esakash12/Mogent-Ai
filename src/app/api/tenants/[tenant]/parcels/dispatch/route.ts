import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createSteadfastOrder } from "@/lib/couriers/steadfast";
import { createPathaoOrder } from "@/lib/couriers/pathao";
import { validateTenantApiAccess } from "@/lib/api-guard";

export async function POST(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

    const body = await req.json();
    const { orderId, courier } = body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify order belongs to this tenant
    if (order.tenantId !== tenant.id) {
      return NextResponse.json({ error: "অননুমোদিত অর্ডার অ্যাক্সেস।" }, { status: 403 });
    }

    // Idempotency: Prevent duplicate courier booking / dispatch
    if (order.courierTrackingCode) {
      return NextResponse.json(
        {
          error: `এই অর্ডারটি ইতিমধ্যে কুরিয়ারে পাঠানো হয়েছে (ট্র্যাকিং কোড: ${order.courierTrackingCode})।`,
          alreadyDispatched: true,
          trackingCode: order.courierTrackingCode,
        },
        { status: 400 }
      );
    }

    const existingParcel = await prisma.parcel.findFirst({
      where: {
        orderId: order.id,
        status: { notIn: ["CANCELLED", "FAILED"] },
      },
    });

    if (existingParcel && existingParcel.trackingCode) {
      return NextResponse.json(
        {
          error: `এই অর্ডারের জন্য ইতিমধ্যে একটি পার্সেল বিদ্যমান রয়েছে (ট্র্যাকিং কোড: ${existingParcel.trackingCode})।`,
          alreadyDispatched: true,
          trackingCode: existingParcel.trackingCode,
        },
        { status: 400 }
      );
    }

    let bookingResult;
    if (courier === "PATHAO") {
      bookingResult = await createPathaoOrder({
        tenantId: tenant.id,
        merchant_order_id: order.orderNumber,
        recipient_name: order.customerName,
        recipient_phone: order.customerPhone,
        recipient_address: order.deliveryAddress,
        amount_to_collect: order.totalAmount,
        item_description: order.items[0]?.productName || "E-commerce Goods",
      });
    } else {
      // Default to Steadfast
      bookingResult = await createSteadfastOrder({
        tenantId: tenant.id,
        invoice: order.orderNumber,
        recipient_name: order.customerName,
        recipient_phone: order.customerPhone,
        recipient_address: order.deliveryAddress,
        cod_amount: order.totalAmount,
        note: `Order #${order.orderNumber}`,
      });
    }

    if (!bookingResult.configured) {
      return NextResponse.json(
        {
          error: bookingResult.message,
          unconfigured: true,
        },
        { status: 400 }
      );
    }

    if (bookingResult.outage) {
      // Create pending parcel with outage status
      const parcel = await prisma.parcel.create({
        data: {
          tenantId: tenant.id,
          orderId: order.id,
          courierName: courier || "STEADFAST",
          status: "PENDING_RETRY",
          deliveryFee: order.deliveryCharge,
          codAmount: order.totalAmount,
        },
      });

      return NextResponse.json({
        success: false,
        outage: true,
        message: bookingResult.message,
        parcel,
      });
    }

    if (!bookingResult.success) {
      return NextResponse.json(
        { error: bookingResult.message },
        { status: 400 }
      );
    }

    // Success -> Create Parcel and update Order
    const parcel = await prisma.parcel.create({
      data: {
        tenantId: tenant.id,
        orderId: order.id,
        consignmentId: bookingResult.consignment?.consignment_id,
        courierName: courier || "STEADFAST",
        trackingCode: bookingResult.consignment?.tracking_code,
        status: "PICKED_UP",
        deliveryFee: order.deliveryCharge,
        codAmount: order.totalAmount,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PROCESSING",
        courierName: courier || "STEADFAST",
        courierTrackingCode: bookingResult.consignment?.tracking_code,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${courier || "Steadfast"} কুরিয়ারে পার্সেল সফলভাবে বুক করা হয়েছে!`,
      parcel,
      trackingCode: bookingResult.consignment?.tracking_code,
    });
  } catch (error: any) {
    console.error("Courier dispatch error:", error);
    return NextResponse.json(
      { error: error.message || "কুরিয়ার বুকিং প্রক্রিয়ায় ত্রুটি হয়েছে।" },
      { status: 500 }
    );
  }
}
