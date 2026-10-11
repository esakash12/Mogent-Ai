import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { OrdersClient } from "./orders-client";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  // Fetch real orders from database
  const orders = await prisma.order.findMany({
    where: { tenantId: tenant.id },
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    deliveryAddress: o.deliveryAddress,
    subtotal: o.subtotal,
    deliveryCharge: o.deliveryCharge,
    totalAmount: o.totalAmount,
    status: o.status as any,
    channel: o.channel,
    remarks: o.remarks,
    courierName: o.courierName,
    courierTrackingCode: o.courierTrackingCode,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId || undefined,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    })),
  }));

  return <OrdersClient tenantSlug={tenant.slug} initialOrders={formatted} />;
}
