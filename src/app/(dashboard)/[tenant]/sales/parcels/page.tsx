import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { ParcelsClient } from "./parcels-client";

export const dynamic = "force-dynamic";

export default async function ParcelsPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  const parcels = await prisma.parcel.findMany({
    where: { tenantId: tenant.id },
    include: {
      order: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ParcelsClient
      tenantSlug={tenant.slug}
      initialParcels={parcels}
      tenantName={tenant.name}
    />
  );
}
