import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { ProductsClient } from "./products-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  // Fetch real products from DB
  const products = await prisma.product.findMany({
    where: {
      tenantId: tenant.id,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    category: p.category,
    imageUrl: p.imageUrl,
    source: p.source,
    createdAt: p.createdAt.toISOString(),
  }));

  return <ProductsClient tenantSlug={tenant.slug} initialProducts={formatted} />;
}
