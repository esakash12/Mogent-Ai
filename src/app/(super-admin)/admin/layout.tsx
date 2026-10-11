import * as React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getServerOutboundIp } from "@/lib/server-ip";
import prisma from "@/lib/db";
import { AdminShell } from "./admin-shell";

export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Strict Security Guard: Only authenticated SUPER_ADMIN users allowed
  const session = await getSession();

  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/admin-login");
  }

  // 2. Fetch server metadata for enterprise top-bar
  const [serverIp, totalMerchants] = await Promise.all([
    getServerOutboundIp(),
    prisma.tenant.count(),
  ]);

  return (
    <AdminShell
      serverIp={serverIp}
      totalMerchants={totalMerchants}
      adminEmail={session.email || "admin@mogent.ai"}
    >
      {children}
    </AdminShell>
  );
}
