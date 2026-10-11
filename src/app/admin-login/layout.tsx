import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session) {
    if (session.role === "SUPER_ADMIN") {
      redirect("/admin");
    }
    if (session.tenantSlug) {
      redirect(`/${session.tenantSlug}/dashboard`);
    }
    redirect("/dashboard");
  }

  return <>{children}</>;
}
