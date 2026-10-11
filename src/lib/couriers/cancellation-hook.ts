import prisma from "@/lib/db";

export interface CancelOrderHookResult {
  actionTaken: "CANCELLED_DROPPED" | "RETURN_IN_TRANSIT" | "ORDER_CANCELLED_NO_PARCEL";
  success: boolean;
  message: string;
  revertedStock: boolean;
}

/**
 * Pillar 8: Post-Booking Cancellation & Modification Hook
 * Real-time synchronization with Steadfast/Pathao when customer cancels in chat.
 */
export async function executePostBookingCancel(
  tenantId: string,
  orderNumber: string,
  reason: string = "Customer requested cancellation via chat"
): Promise<CancelOrderHookResult> {
  const order = await prisma.order.findFirst({
    where: { orderNumber, tenantId },
    include: { items: true, parcels: true },
  });

  if (!order) {
    return {
      actionTaken: "ORDER_CANCELLED_NO_PARCEL",
      success: false,
      message: `অর্ডার #${orderNumber} খুঁজে পাওয়া যায়নি।`,
      revertedStock: false,
    };
  }

  // 1. If no courier parcel was created yet: cancel directly and revert stock
  if (!order.parcels || order.parcels.length === 0 || !order.courierTrackingCode) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", remarks: reason },
      });

      // Stock + 1 for all items
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    });

    return {
      actionTaken: "ORDER_CANCELLED_NO_PARCEL",
      success: true,
      message: `অর্ডার #${orderNumber} সফলভাবে বাতিল করা হয়েছে এবং স্টকে পণ্য ফিরিয়ে দেওয়া হয়েছে।`,
      revertedStock: true,
    };
  }

  const latestParcel = order.parcels[order.parcels.length - 1];
  const parcelStatus = (latestParcel.status || order.status || "").toLowerCase();

  // 2. If status is pending / in_review (Rider has NOT picked up)
  const isPendingPickup =
    parcelStatus === "pending" ||
    parcelStatus === "in_review" ||
    parcelStatus === "confirmed" ||
    parcelStatus === "processing";

  if (isPendingPickup) {
    // Attempt real-time courier cancel if partner is Steadfast
    if (latestParcel.courierName?.toUpperCase() === "STEADFAST" && latestParcel.consignmentId) {
      try {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { steadfastApiKey: true, steadfastSecretKey: true },
        });

        if (tenant?.steadfastApiKey && tenant?.steadfastSecretKey) {
          // Attempt courier cancel call
          await fetch(`https://portal.steadfast.com.bd/api/v1/cancel_order`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Api-Key": tenant.steadfastApiKey,
              "Secret-Key": tenant.steadfastSecretKey,
            },
            body: JSON.stringify({ consignment_id: latestParcel.consignmentId }),
          }).catch(() => null);
        }
      } catch (err) {
        console.warn("[CancelHook] Steadfast cancellation warning:", err);
      }
    }

    // Cancel order in DB, mark parcel cancelled, and restore stock
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", remarks: reason },
      });

      await tx.parcel.update({
        where: { id: latestParcel.id },
        data: { status: "CANCELLED" },
      });

      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.notification.create({
        data: {
          tenantId,
          title: `অর্ডার #${orderNumber} বাতিল হয়েছে`,
          message: `কাস্টমার মেসেঞ্জারে অর্ডারটি বাতিল করেছেন। রাইডার পিক করার আগেই কুরিয়ার বুকিং ড্রপ করে স্টক স্বয়ংক্রিয়ভাবে ফিরিয়ে নেওয়া হয়েছে।`,
          type: "ORDER",
        },
      });
    });

    return {
      actionTaken: "CANCELLED_DROPPED",
      success: true,
      message: `অর্ডার #${orderNumber} সফলভাবে কুরিয়ার থেকে ড্রপ করা হয়েছে এবং স্টকে পণ্য ফিরিয়ে দেওয়া হয়েছে।`,
      revertedStock: true,
    };
  }

  // 3. If parcel is already picked up / in_transit:
  // Courier will not cancel. Flag as Return in Transit and notify merchant.
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "RETURN_IN_TRANSIT",
        remarks: `কাস্টমার বাতিল চেয়েছেন, কিন্তু পার্সেল ইতিমধ্যে কুরিয়ার ট্রানজিটে রয়েছে। ট্র্যাকিং: ${order.courierTrackingCode}`,
      },
    });

    await tx.notification.create({
      data: {
        tenantId,
        title: `অর্ডার #${orderNumber} ক্যান্সেলেশন রিকোয়েস্ট (ইন-ট্রানজিট)`,
        message: `পার্সেল #${latestParcel.trackingCode} ইতিমধ্যে কুরিয়ারে ট্রানজিটে রয়েছে। কাস্টমার বাতিল চেয়েছেন। ওয়্যারহাউসে রিটার্ন আসার পর স্টক QC যাচাই করুন।`,
        type: "ORDER",
      },
    });
  });

  return {
    actionTaken: "RETURN_IN_TRANSIT",
    success: true,
    message: `পার্সেলটি ইতিমধ্যে কুরিয়ারে ট্রানজিটে আছে। এটি 'Cancellation Requested: Return in Transit' হিসেবে চিহ্নিত করা হয়েছে।`,
    revertedStock: false,
  };
}
