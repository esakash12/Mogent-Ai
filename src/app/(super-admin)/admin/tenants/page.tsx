import * as React from "react";
import prisma from "@/lib/db";
import { TenantsClient } from "./tenants-client";

export const dynamic = "force-dynamic";

export default async function SuperAdminTenantsPage() {
  const rawTenants = await prisma.tenant.findMany({
    include: {
      wallet: {
        select: {
          id: true,
          balanceBdt: true,
        },
      },
      _count: {
        select: {
          orders: true,
          products: true,
          channels: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedTenants = rawTenants.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    contactPerson: t.contactPerson,
    businessEmail: t.businessEmail,
    phone: t.phone,
    createdAt: t.createdAt.toISOString(),
    wallet: t.wallet,
    _count: t._count,
  }));

  return <TenantsClient initialTenants={serializedTenants} />;
}
