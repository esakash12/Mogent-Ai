import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function UniversalDashboardRedirect() {
  const session = await getSession();

  if (!session) {
    redirect("/login?redirect=/dashboard");
  }

  if (session.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  if (session.tenantSlug) {
    redirect(`/${session.tenantSlug}/dashboard`);
  }

  redirect("/login");
}
