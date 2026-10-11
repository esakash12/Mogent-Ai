import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  return (
    <ProfileClient
      tenantSlug={tenant.slug}
      initialName={tenant.name}
      initialContactPerson={tenant.contactPerson || ""}
      initialBusinessEmail={tenant.businessEmail || ""}
      initialPhone={tenant.phone || ""}
      initialBusinessType={tenant.businessType || "E-commerce"}
    />
  );
}
