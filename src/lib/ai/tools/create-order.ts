import prisma from "@/lib/db";

export interface CreateOrderParams {
  tenantId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  productId?: string;
  productName: string;
  quantity?: number;
  deliveryCharge?: number;
  channel?: string;
}

export async function createOrderTool(params: CreateOrderParams) {
  const {
    tenantId,
    customerName,
    customerPhone,
    deliveryAddress,
    productId,
    productName,
    quantity = 1,
    deliveryCharge = 60,
    channel = "FACEBOOK",
  } = params;

  // Fetch product price if productId exists
  let unitPrice = 0;
  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product) {
      unitPrice = product.price;
      // Decrement stock if available
      if (product.stock >= quantity) {
        await prisma.product.update({
          where: { id: productId },
          data: { stock: product.stock - quantity },
        });
      }
    }
  }

  const subtotal = unitPrice * quantity;
  const totalAmount = subtotal + deliveryCharge;
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = await prisma.order.create({
    data: {
      tenantId,
      orderNumber,
      customerName,
      customerPhone,
      deliveryAddress,
      subtotal,
      deliveryCharge,
      totalAmount,
      status: "PENDING",
      channel,
      items: {
        create: [
          {
            productId,
            productName,
            quantity,
            unitPrice,
            totalPrice: subtotal,
          },
        ],
      },
    },
    include: { items: true },
  });

  // Async dispatch Meta CAPI event if configured
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { metaPixelId: true, metaCapiToken: true, metaTestEventCode: true },
    });

    if (tenant?.metaPixelId && tenant?.metaCapiToken) {
      const { sendMetaCapiPurchaseEvent } = await import("@/lib/meta/conversions");
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
        items: [
          {
            productId,
            productName,
            quantity,
            unitPrice,
          },
        ],
      }).catch((err) => console.warn("[AI ORDER CAPI] Dispatch error:", err));
    }
  } catch (tErr) {
    console.warn("[AI ORDER CAPI] Tenant lookup error:", tErr);
  }

  return {
    success: true,
    orderId: newOrder.id,
    orderNumber: newOrder.orderNumber,
    totalAmount: newOrder.totalAmount,
    message: `অর্ডারটি সফলভাবে কনফার্ম করা হয়েছে! আপনার অর্ডার নম্বর: ${newOrder.orderNumber}, সর্বমোট মূল্য: ৳${newOrder.totalAmount} (ডেলিভারি চার্জ সহ)।`,
  };
}
