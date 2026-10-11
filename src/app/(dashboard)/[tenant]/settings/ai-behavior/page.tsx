import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { BehaviorClient } from "./behavior-client";

export const dynamic = "force-dynamic";

export default async function AiBehaviorPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  return (
    <BehaviorClient
      tenantSlug={tenant.slug}
      initialTemplate={tenant.aiSetting?.orderConfirmationTemplate || ""}
      initialPhotoAction={tenant.aiSetting?.unknownPhotoAction || "ASK_NEVER_GUESS"}
      initialChangeAction={tenant.aiSetting?.orderChangeAction || "HANDOFF_TO_TEAM"}
      initialEnableCatalogCards={tenant.aiSetting?.enableCatalogCards ?? true}
      initialCatalogLocationUrl={tenant.aiSetting?.catalogLocationUrl || ""}
    />
  );
}
