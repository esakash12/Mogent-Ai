import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  const noCacheHeaders = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };

  if (!session) {
    return NextResponse.json(
      { authenticated: false, session: null },
      { headers: noCacheHeaders }
    );
  }

  const dashboardUrl =
    session.role === "SUPER_ADMIN"
      ? "/admin"
      : session.tenantSlug
      ? `/${session.tenantSlug}/dashboard`
      : "/dashboard";

  return NextResponse.json(
    {
      authenticated: true,
      session: {
        userId: session.userId,
        tenantId: session.tenantId,
        tenantSlug: session.tenantSlug,
        role: session.role,
        name: session.name,
        email: session.email,
        dashboardUrl,
      },
    },
    { headers: noCacheHeaders }
  );
}
