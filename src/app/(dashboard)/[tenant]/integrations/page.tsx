import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { IntegrationsClient } from "./integrations-client";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  const channels = await prisma.channel.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  const formatted = channels.map((c) => ({
    id: c.id,
    type: c.type,
    pageName: c.pageName,
    pageId: c.pageId,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  }));

  const masterConfig = await prisma.superAdminConfig.findFirst();
  const isMetaConfigured = Boolean(
    masterConfig?.metaAppId?.trim() || process.env.META_APP_ID?.trim()
  );
  const isWhatsAppConfigured = Boolean(masterConfig?.metaConfigId?.trim());

  return (
    <IntegrationsClient
      tenantSlug={tenant.slug}
      channels={formatted}
      isMetaConfigured={isMetaConfigured}
      isWhatsAppConfigured={isWhatsAppConfigured}
    />
  );
}
