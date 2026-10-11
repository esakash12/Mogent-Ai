import * as React from "react";
import { notFound } from "next/navigation";
import { getOrCreateTenant } from "@/lib/tenant";
import { NotificationsClient } from "./notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);
  if (!tenant) {
    notFound();
  }

  return <NotificationsClient tenantSlug={tenant.slug} />;
}
