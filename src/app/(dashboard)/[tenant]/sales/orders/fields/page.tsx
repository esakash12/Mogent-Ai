import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { OrderFieldsClient } from "./fields-client";

export const dynamic = "force-dynamic";

export default async function OrderFieldsPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  const savedFields = (tenant.aiSetting?.orderFieldsJson as any[]) || [];

  return <OrderFieldsClient tenantSlug={tenant.slug} initialFields={savedFields} />;
}
