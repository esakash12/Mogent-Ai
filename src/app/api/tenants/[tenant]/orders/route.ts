import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendMetaCapiPurchaseEvent } from "@/lib/meta/conversions";

export async function POST(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      deliveryAddress,
      productName,
      subtotal = 0,
      deliveryCharge = 0,
      channel = "FACEBOOK",
      remarks,
    } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = (parseFloat(subtotal) || 0) + (parseFloat(deliveryCharge) || 0);

    const newOrder = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        orderNumber,
        customerName,
        customerPhone,
        deliveryAddress,
        subtotal: parseFloat(subtotal) || 0,
        deliveryCharge: parseFloat(deliveryCharge) || 0,
        totalAmount,
        status: "PENDING",
        channel,
        remarks,
        items: {
          create: [
            {
              productName: productName || "General Item",
              quantity: 1,
              unitPrice: parseFloat(subtotal) || 0,
              totalPrice: parseFloat(subtotal) || 0,
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    // Dispatch Meta Conversions API (CAPI) Purchase Event asynchronously
    if (tenant.metaPixelId && tenant.metaCapiToken) {
      sendMetaCapiPurchaseEvent({
        pixelId: tenant.metaPixelId,
        capiAccessToken: tenant.metaCapiToken,
        testEventCode: tenant.metaTestEventCode,
        eventId: newOrder.orderNumber,
        amount: newOrder.totalAmount,
        currency: "BDT",
        actionSource: "chat",
        userData: {
          phone: customerPhone,
          name: customerName,
          city: "Dhaka",
        },
        items: newOrder.items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      }).catch((capiErr) => {
        console.warn("[META CAPI] Auto-dispatch purchase error:", capiErr);
      });
    }

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
