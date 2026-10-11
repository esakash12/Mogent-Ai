import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { getOrCreateTenant } from "@/lib/tenant";
import { getSession } from "@/lib/session";
import { DashboardProviders } from "@/components/shared/dashboard-providers";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  // 1. Strict Server-Side Authentication Guard
  const session = await getSession();
  if (!session) {
    redirect(`/login?redirect=/${params.tenant}/dashboard`);
  }

  // 2. Cross-Tenant IDOR Guard: Only allow if SUPER_ADMIN or tenant matches session
  if (session.role !== "SUPER_ADMIN" && session.tenantSlug !== params.tenant) {
    redirect(`/${session.tenantSlug}/dashboard`);
  }

  const tenant = await getOrCreateTenant(params.tenant);

  if (!tenant) {
    notFound();
  }

  const isImpersonating = session.role === "SUPER_ADMIN" && session.tenantSlug !== params.tenant;

  return (
    <DashboardProviders>
      <DashboardShell
        tenantSlug={tenant.slug}
        tenantName={tenant.name}
        userEmail={tenant.businessEmail || undefined}
        walletBalanceBdt={tenant.wallet?.balanceBdt ?? 0}
        initialAiActive={tenant.aiSetting?.aiActive ?? true}
        isImpersonating={isImpersonating}
      >
        {children}
      </DashboardShell>
    </DashboardProviders>
  );
}
