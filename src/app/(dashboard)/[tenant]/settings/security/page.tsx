import * as React from "react";
import { notFound } from "next/navigation";
import { getOrCreateTenant } from "@/lib/tenant";
import { SecurityClient } from "./security-client";

export const dynamic = "force-dynamic";

export default async function SecurityPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);
  if (!tenant) {
    notFound();
  }

  return <SecurityClient tenantSlug={tenant.slug} />;
}
