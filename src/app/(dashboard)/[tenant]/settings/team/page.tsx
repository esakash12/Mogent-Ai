import * as React from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getOrCreateTenant } from "@/lib/tenant";
import { TeamClient } from "./team-client";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  const teamMembers = await prisma.teamMember.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <TeamClient
      tenantSlug={tenant.slug}
      initialMembers={teamMembers}
    />
  );
}
