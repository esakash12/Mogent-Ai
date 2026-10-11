import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { TrainContentClient } from "./content-client";

export const dynamic = "force-dynamic";

export default async function TrainContentPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  const memories = await prisma.agentMemoryEntry.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
  });

  const formattedMemories = memories.map((m) => ({
    id: m.id,
    category: m.category,
    title: m.title,
    content: m.content,
    tags: m.tags,
    source: m.source,
    isActive: m.isActive,
    updatedAt: m.updatedAt.toISOString(),
  }));

  return (
    <TrainContentClient
      tenantSlug={tenant.slug}
      initialKnowledgeBase={tenant.aiSetting?.knowledgeBaseText || ""}
      initialMemories={formattedMemories}
    />
  );
}
