import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { SetupClient } from "./setup-client";

export const dynamic = "force-dynamic";

export default async function AiSetupPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  return (
    <SetupClient
      tenantSlug={tenant.slug}
      initialSettings={tenant.aiSetting}
      storeName={tenant.name}
      initialBusinessType={tenant.businessType || "ECOMMERCE"}
    />
  );
}
