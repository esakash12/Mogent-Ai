import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { AdsFlowClient } from "./ads-flow-client";

export const dynamic = "force-dynamic";

export default async function AdsFlowPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);
  if (!tenant) {
    notFound();
  }

  // Fetch Meta-attributed orders (Facebook / Instagram)
  const metaOrders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      channel: { in: ["FACEBOOK", "INSTAGRAM"] },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Fetch logged Meta Ad Spends
  const adSpends = await prisma.adSpend.findMany({
    where: { tenantId: tenant.id },
    orderBy: { date: "desc" },
  });

  const metaChannels = await prisma.channel.findMany({
    where: {
      tenantId: tenant.id,
      type: { in: ["FACEBOOK", "INSTAGRAM"] },
      isActive: true,
    },
  });

  const formattedOrders = metaOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    totalAmount: o.totalAmount,
    channel: o.channel,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }));

  const formattedSpends = adSpends.map((s) => ({
    id: s.id,
    amount: s.amount,
    date: s.date.toISOString(),
    campaignName: s.campaignName,
    platform: s.platform,
    notes: s.notes,
  }));

  const initialPixelConfig = {
    metaPixelId: tenant.metaPixelId || "",
    metaCapiTokenMasked: tenant.metaCapiToken
      ? "••••••••" + tenant.metaCapiToken.slice(-6)
      : "",
    hasCapiToken: Boolean(tenant.metaCapiToken && tenant.metaCapiToken.trim().length > 0),
    metaTestEventCode: tenant.metaTestEventCode || "",
    metaAdAccountId: tenant.metaAdAccountId || "",
    isConfigured: Boolean(tenant.metaPixelId && tenant.metaCapiToken),
  };

  return (
    <AdsFlowClient
      tenantSlug={tenant.slug}
      initialOrders={formattedOrders}
      initialSpends={formattedSpends}
      metaChannelsCount={metaChannels.length}
      initialPixelConfig={initialPixelConfig}
    />
  );
}
